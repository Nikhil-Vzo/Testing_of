import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { usePresence } from '../context/PresenceContext';
import { MatchProfile, Message } from '../types';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Ghost, Shield, Clock, User, AlertTriangle, Ban, Loader2, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VideoCall } from '../components/VideoCall';
import { PermissionModal } from '../components/PermissionModal';
import { blockUser, unblockUser, isUserBlocked, isBlockedBy } from '../services/blockService';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { initiateCall, checkUserBusy } from '../services/callSignaling';
import { analytics } from '../utils/analytics';

const MESSAGES_PER_PAGE = 50;

export const Chat: React.FC = () => {
  const { id: matchId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { startCall, setOutgoingCall, isCallActive } = useCall();
  const { subscribeToUser, unsubscribeFromUser, isUserOnline, getLastSeen } = usePresence();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [partner, setPartner] = useState<MatchProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByThem, setIsBlockedByThem] = useState(false);

  // Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', confirmLabel: 'Confirm', isDestructive: false, onConfirm: () => { } });
  const [permissionModal, setPermissionModal] = useState({ isOpen: false, type: 'video' as 'audio' | 'video', onGranted: () => { } });

  // Pagination State
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initial Load
  useEffect(() => {
    if (!currentUser || !matchId || !supabase) return;

    const loadInitialData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Match & Partner Data
        const { data: matchData, error: matchError } = await supabase.from('matches').select('*').eq('id', matchId).single();
        if (matchError || !matchData) { navigate('/matches'); return; }

        const partnerId = matchData.user_a === currentUser.id ? matchData.user_b : matchData.user_a;
        setIsRevealed(matchData.is_revealed || false);

        // Fetch Profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', partnerId).single();
        if (profile) {
          setPartner({
            id: profile.id, anonymousId: profile.anonymous_id, realName: profile.real_name,
            gender: profile.gender, university: profile.university, branch: profile.branch,
            year: profile.year, interests: profile.interests || [], bio: profile.bio,
            dob: profile.dob, isVerified: profile.is_verified, avatar: profile.avatar,
            matchPercentage: 0, distance: 'Connected'
          });
          subscribeToUser(partnerId);
          const [blocked, blockedBy] = await Promise.all([isUserBlocked(partnerId), isBlockedBy(partnerId)]);
          setIsBlocked(blocked);
          setIsBlockedByThem(blockedBy);
        }

        // 2. Fetch Last 50 Messages
        const { data: msgData } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: false }) // Get latest first
          .limit(MESSAGES_PER_PAGE);

        if (msgData) {
          const formatted = msgData.map((m: any) => ({
            id: m.id, senderId: m.sender_id, text: m.text.replace('[SYSTEM]', '').trim(),
            timestamp: new Date(m.created_at).getTime(),
            isSystem: m.text.startsWith('[SYSTEM]') || m.text.startsWith('📞')
          })).reverse(); // Reverse to chronological order for display
          setMessages(formatted);
          setHasMoreMessages(msgData.length === MESSAGES_PER_PAGE);

          // Scroll to bottom on initial load
          setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
        }

      } catch (err) {
        console.error('Error loading chat:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    return () => { if (partner) unsubscribeFromUser(partner.id); };
  }, [matchId, currentUser]);

  // Fetch More Messages
  const loadMoreMessages = async () => {
    if (!hasMoreMessages || isLoadingMore || !matchId) return;

    setIsLoadingMore(true);
    const currentTopInfo = messages[0]; // Remember top message to maintain scroll position

    try {
      const { data: msgData } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: false })
        .range(messages.length, messages.length + MESSAGES_PER_PAGE - 1);

      if (msgData && msgData.length > 0) {
        const formatted = msgData.map((m: any) => ({
          id: m.id, senderId: m.sender_id, text: m.text.replace('[SYSTEM]', '').trim(),
          timestamp: new Date(m.created_at).getTime(),
          isSystem: m.text.startsWith('[SYSTEM]') || m.text.startsWith('📞')
        })).reverse();

        setMessages(prev => [...formatted, ...prev]);
        setHasMoreMessages(msgData.length === MESSAGES_PER_PAGE);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Scroll Handler for "Load Previous"
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && hasMoreMessages && !isLoadingMore) {
      // Save current scroll height to restore position after loading
      const container = e.currentTarget;
      const oldScrollHeight = container.scrollHeight;

      loadMoreMessages().then(() => {
        // Restore scroll position
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight - oldScrollHeight;
        });
      });
    }
  };

  // Realtime Subscription
  useEffect(() => {
    if (!matchId || !supabase) return;

    const channel = supabase.channel(`chat:${matchId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, (payload) => {
        const newMsg = payload.new;
        const incoming: Message = {
          id: newMsg.id, senderId: newMsg.sender_id, text: newMsg.text.replace('[SYSTEM]', '').trim(),
          timestamp: new Date(newMsg.created_at).getTime(),
          isSystem: newMsg.text.startsWith('[SYSTEM]') || newMsg.text.startsWith('📞')
        };

        setMessages(prev => {
          const exists = prev.some(m => m.id === incoming.id);
          if (exists) return prev;

          // Replace optimistic message
          const hasOptimistic = prev.some(m => m.id.toString().startsWith('temp-') && m.senderId === incoming.senderId && m.text === incoming.text);
          if (hasOptimistic) {
            return prev.map(m => (m.id.toString().startsWith('temp-') && m.senderId === incoming.senderId && m.text === incoming.text) ? incoming : m);
          }

          const nextMessages = [...prev, incoming];
          // Auto-scroll if near bottom
          const container = chatContainerRef.current;
          if (container) {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            if (isNearBottom) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }
          return nextMessages;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId]);

  // Handlers
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !currentUser || !matchId) return;

    const textToSend = newMessage.trim();
    setNewMessage('');

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}-${Math.random()}`, senderId: currentUser.id, text: textToSend, timestamp: Date.now(), isSystem: false
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const { error } = await supabase.from('messages').insert({ match_id: matchId, sender_id: currentUser.id, text: textToSend });
      if (error) throw error;
      analytics.messageSent();
    } catch (err) {
      console.error('Failed to send:', err);
      showToast('Failed to send', 'error');
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    }
  };

  // ... (Keep existing Call Helpers: startVideoCall, proceedWithCallCheck, proceedWithCall, startAudioCall, etc.)
  // For brevity, I'm assuming these helper functions (startVideoCall, etc.) are preserved or imported. 
  // Since I'm essentially rewriting the file, I need to include them.

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));
  const showConfirm = (title: string, message: string, onConfirm: () => void, isDestructive = false, confirmLabel = 'Confirm') => {
    setConfirmModal({ isOpen: true, title, message, confirmLabel, isDestructive, onConfirm: () => { onConfirm(); closeConfirmModal(); } });
  };

  const startVideoCall = async (type: 'audio' | 'video' = 'video') => {
    if (!partner || isStartingCall || !matchId) return;
    if (isCallActive) { showToast('Already on a call.', 'warning'); return; }

    if (!isUserOnline(partner.id)) {
      const lastSeen = getLastSeen(partner.id);
      const lastSeenText = lastSeen ? `Last seen ${formatLastSeen(lastSeen)}` : 'Currently offline';
      showConfirm('User Offline', `${partner.realName || partner.anonymousId} is ${lastSeenText}. Call anyway?`, () => proceedWithCallCheck(type), false, 'Call Anyway');
      return;
    }
    proceedWithCallCheck(type);
  };

  const proceedWithCallCheck = (type: 'audio' | 'video') => {
    setPermissionModal({ isOpen: true, type, onGranted: () => { setPermissionModal(prev => ({ ...prev, isOpen: false })); proceedWithCall(type); } });
  };

  const proceedWithCall = async (callType: 'audio' | 'video') => {
    if (!partner || !matchId || !currentUser) return;
    setIsStartingCall(true);

    try {
      if (await checkUserBusy(partner.id)) {
        showToast(`${partner.realName || partner.anonymousId} is on another call.`, 'info');
        setIsStartingCall(false);
        return;
      }
    } catch (err) { console.error(err); }

    setOutgoingCall({ receiverName: partner.realName || partner.anonymousId, receiverAvatar: partner.avatar || 'https://via.placeholder.com/150', callType });

    try {
      const callSession = await initiateCall(partner.id, matchId, {
        id: currentUser.id, name: currentUser.realName || currentUser.anonymousId || 'Anonymous',
        avatar: currentUser.avatar || 'https://via.placeholder.com/150', callType
      });

      if (!callSession) throw new Error('Failed to create session');

      const timeoutId = setTimeout(async () => {
        setOutgoingCall(null); setIsStartingCall(false); showToast('No answer.', 'info');
        await insertSystemMessage('📞 Missed Call');
      }, 30000);

      const callChannel = supabase.channel(`call_status:${callSession.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'call_sessions', filter: `id=eq.${callSession.id}` }, async (payload) => {
          const updatedSession = payload.new as any;
          if (updatedSession.status === 'active') {
            clearTimeout(timeoutId); supabase.removeChannel(callChannel);
            startCall(partner.realName || partner.anonymousId, partner.avatar || 'https://via.placeholder.com/150', callSession.app_id, callSession.channel_name, callSession.token, callType, callSession.id);
            setIsStartingCall(false);
          } else if (updatedSession.status === 'rejected') {
            clearTimeout(timeoutId); supabase.removeChannel(callChannel);
            setOutgoingCall(null); setIsStartingCall(false); showToast('Call declined.', 'info');
            await insertSystemMessage('📞 Call Declined');
          }
        }).subscribe();
    } catch (error) {
      console.error('Error starting call:', error); showToast('Failed to start call', 'error'); setOutgoingCall(null); setIsStartingCall(false);
    }
  };

  const insertSystemMessage = async (text: string) => {
    if (!currentUser || !matchId) return;
    try { await supabase.from('messages').insert({ match_id: matchId, sender_id: currentUser.id, text: text.startsWith('📞') ? text : `[SYSTEM] ${text}` }); } catch (err) { console.error(err); }
  };

  const formatLastSeen = (date: Date): string => {
    const diff = (new Date().getTime() - date.getTime()) / 60000;
    if (diff < 1) return 'just now'; if (diff < 60) return `${Math.floor(diff)}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`; return date.toLocaleDateString();
  };

  const startAudioCall = () => startVideoCall('audio');
  const handleViewProfile = () => { if (partner) { navigate(`/profile/${partner.id}`); setShowMenu(false); } };

  const handleBlockUser = async () => {
    if (!partner) return;
    if (isBlocked) {
      showConfirm('Unblock User', `Unblock ${partner.realName || partner.anonymousId}?`, async () => {
        if (await unblockUser(partner.id)) { setIsBlocked(false); setShowMenu(false); showToast('User unblocked', 'success'); }
      });
    } else {
      showConfirm('Block User', `Block ${partner.realName || partner.anonymousId}?`, async () => {
        if (await blockUser(partner.id)) { setIsBlocked(true); setShowMenu(false); showToast('User blocked', 'success'); }
      }, true, 'Block');
    }
  };

  const handleReport = () => { setShowMenu(false); navigate('/contact', { state: { reportUserId: partner?.id, reportUserName: partner?.realName || partner?.anonymousId } }); };


  if (loading) return (
    <div className="h-full w-full bg-[#000000] flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 text-neon animate-spin mb-4" />
      <p className="text-gray-500 text-sm">Loading chat...</p>
    </div>
  );

  if (!partner) return null;

  return (
    <div className="h-full w-full bg-transparent flex flex-col relative">
      <ConfirmationModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} confirmLabel={confirmModal.confirmLabel} isDestructive={confirmModal.isDestructive} onConfirm={confirmModal.onConfirm} onCancel={closeConfirmModal} />
      <PermissionModal isOpen={permissionModal.isOpen} onPermissionsGranted={permissionModal.onGranted} onCancel={() => setPermissionModal(prev => ({ ...prev, isOpen: false }))} requiredPermissions={permissionModal.type === 'video' ? ['camera', 'microphone'] : ['microphone']} />

      {/* Header */}
      <div className="flex-none px-4 py-3 bg-black/95 backdrop-blur-md border-b border-gray-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/matches')} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <div className="relative"><img src={partner.avatar} className="w-10 h-10 rounded-full border border-gray-700 object-cover" alt="" /><div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#000000]"></div></div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">{partner.realName || partner.anonymousId}</h3>
            <span className="text-[10px] text-gray-500">{isUserOnline(partner.id) ? <span className="text-green-400">Active</span> : (getLastSeen(partner.id) ? formatLastSeen(getLastSeen(partner.id)!) : 'Offline')}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => startVideoCall('video')} disabled={isStartingCall} className="p-2.5 text-gray-400 hover:text-neon hover:bg-gray-800 rounded-full"><Video className="w-5 h-5" /></button>
          <button onClick={startAudioCall} disabled={isStartingCall} className="p-2.5 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded-full"><Phone className="w-5 h-5" /></button>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"><MoreVertical className="w-5 h-5" /></button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-12 z-50 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                  <button onClick={handleViewProfile} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800"><User className="w-4 h-4" /> View Profile</button>
                  <div className="h-px bg-gray-800" />
                  <button onClick={handleBlockUser} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-orange-400"><Ban className="w-4 h-4" /> {isBlocked ? 'Unblock' : 'Block'}</button>
                  <div className="h-px bg-gray-800" />
                  <button onClick={handleReport} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-gray-800"><AlertTriangle className="w-4 h-4" /> Report</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 select-none min-h-0 overscroll-contain"
        onScroll={handleScroll}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        )}

        {!hasMoreMessages && messages.length > 20 && (
          <div className="text-center py-4 text-xs text-gray-600">No more messages</div>
        )}

        {/* Privacy Notice */}
        <div className="mb-4">
          <div className="bg-gradient-to-r from-blue-900/10 to-purple-900/10 border border-blue-800/20 rounded-2xl p-3 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-600/10 rounded-full mt-0.5"><Shield className="w-4 h-4 text-blue-400/80" /></div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-blue-400/90 mb-1 flex items-center gap-2"><Clock className="w-3 h-3" /> Privacy Protection Active</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">Messages deleted after <span className="font-bold text-blue-400/80">3 days</span>. Screenshots disabled.</p>
              </div>
            </div>
          </div>
        </div>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[50vh] opacity-50 space-y-4">
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center border border-gray-800"><Ghost className="w-10 h-10 text-gray-700" /></div>
            <div className="text-center"><p className="text-gray-500 text-sm">No messages yet.</p><p className="text-xs text-gray-600 mt-1">Say hello!</p></div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUser?.id;
          const showAvatar = !isMe && (i === 0 || messages[i - 1].senderId !== msg.senderId);
          if (msg.isSystem) return <div key={msg.id} className="flex justify-center w-full my-4"><span className="text-[10px] uppercase tracking-wider text-gray-500 bg-gray-900/50 px-4 py-1.5 rounded-full border border-gray-800/50 flex items-center gap-2">{msg.text.includes('Match') && '💖'}{msg.text.includes('Missed') && '📞'}{msg.text.replace('📞', '').trim()}</span></div>;
          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] md:max-w-[60%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isMe && <div className="w-8 h-8 flex-shrink-0 flex flex-col justify-end">{showAvatar ? <img src={partner.avatar} className="w-8 h-8 rounded-full border border-gray-800 object-cover" alt="" /> : <div className="w-8" />}</div>}
                <div className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${isMe ? 'bg-neon text-white rounded-br-none' : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'}`}>{msg.text}<span className={`text-[9px] block mt-1 opacity-60 text-right ${isMe ? 'text-white' : 'text-gray-400'}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-black/95 backdrop-blur-md border-t border-gray-800 z-20">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-2 px-2 pb-2">
          <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl flex items-center gap-2 px-3 py-1 shadow-inner focus-within:border-gray-600 transition-colors">
            <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-transparent py-3 text-sm text-white placeholder-gray-500 outline-none min-h-[44px] max-h-32" />
          </div>
          <button type="submit" disabled={!newMessage.trim()} className="p-3 rounded-full bg-neon text-white shadow-lg hover:bg-[#d6006b] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"><Send className="w-5 h-5 fill-current" /></button>
        </form>
      </div>
    </div>
  );
};