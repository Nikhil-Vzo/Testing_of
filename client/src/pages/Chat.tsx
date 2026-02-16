import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { usePresence } from '../context/PresenceContext';
import { MatchProfile, Message } from '../types';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Ghost, Shield, Clock, User, AlertTriangle, Ban, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PermissionModal } from '../components/PermissionModal';
import { blockUser, unblockUser, checkBlockStatus } from '../services/blockService';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { initiateCall, checkUserBusy } from '../services/callSignaling';
import { analytics } from '../utils/analytics';
import { getOptimizedUrl } from '../utils/image';

const MESSAGES_PER_PAGE = 50;

const ChatSkeleton = () => (
  <div className="h-full w-full bg-black flex flex-col">
    <div className="flex-none px-4 py-3 border-b border-gray-800 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-800" />
        <div className="space-y-1">
          <div className="h-3 w-28 bg-gray-800 rounded" />
          <div className="h-2 w-16 bg-gray-700 rounded" />
        </div>
      </div>
    </div>
    <div className="flex-1 p-4 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div className="h-10 w-48 bg-gray-800/60 rounded-2xl animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

export const Chat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const matchId = id!; // Guaranteed by route
  const location = useLocation(); // Add this hook
  const cacheKey = `otherhalf_chat_${matchId}_v2`;

  const [partner, setPartner] = useState<MatchProfile | null>(() => {
    // 1. Check Navigation State (Fastest)
    if (location.state?.partner) return location.state.partner;
    // 2. Check Session Storage
    try { const c = sessionStorage.getItem(cacheKey); return c ? JSON.parse(c).partner : null; } catch { return null; }
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try { const c = sessionStorage.getItem(cacheKey); return c ? JSON.parse(c).messages : []; } catch { return []; }
  });

  // Loading is only true if we don't have a partner yet. Messages can load lazily.
  const [loading, setLoading] = useState(() => !partner);

  const partnerRef = useRef(partner);
  useEffect(() => { partnerRef.current = partner; }, [partner]);

  const { currentUser } = useAuth();
  const { startCall, setOutgoingCall, isCallActive } = useCall();
  const { subscribeToUser, unsubscribeFromUser, isUserOnline, getLastSeen } = usePresence();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [newMessage, setNewMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByThem, setIsBlockedByThem] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', confirmLabel: 'Confirm', isDestructive: false, onConfirm: () => { } });
  const [permissionModal, setPermissionModal] = useState({ isOpen: false, type: 'video' as 'audio' | 'video', onGranted: () => { } });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));
  const showConfirm = (title: string, message: string, onConfirm: () => void, isDestructive = false, confirmLabel = 'Confirm') => {
    setConfirmModal({ isOpen: true, title, message, confirmLabel, isDestructive, onConfirm: () => { onConfirm(); closeConfirmModal(); } });
  };

  useEffect(() => {
    const preventScreenshot = (e: Event) => { e.preventDefault(); return false; };
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && (e.key === '4' || e.key === '5')) || (e.key === 's' && e.shiftKey && e.metaKey)) { e.preventDefault(); showToast('Screenshots are disabled', 'warning'); } };
    const container = chatContainerRef.current;
    if (container) { container.addEventListener('contextmenu', preventScreenshot); document.addEventListener('keydown', handleKeyDown); return () => { container.removeEventListener('contextmenu', preventScreenshot); document.removeEventListener('keydown', handleKeyDown); }; }
  }, []);

  // 4. Persistence Effect: If we have a partner from state, ensure it hits cache immediately
  useEffect(() => {
    if (location.state?.partner) {
      try {
        const currentCache = sessionStorage.getItem(cacheKey);
        const cachedMessages = currentCache ? JSON.parse(currentCache).messages : [];
        sessionStorage.setItem(cacheKey, JSON.stringify({ partner: location.state.partner, messages: cachedMessages }));
      } catch { }
    }
  }, [location.state, cacheKey]);

  // Initial Load
  useEffect(() => {
    if (!currentUser || !matchId || !supabase) return;
    if (partner) subscribeToUser(partner.id);
    if (messages.length > 0) setTimeout(() => messagesEndRef.current?.scrollIntoView(), 0);

    const loadInitialData = async () => {
      try {
        let partnerId = partner?.id;

        // Fetch partner ID if totally missing (direct link load)
        if (!partnerId) {
          const { data: matchData, error: matchError } = await supabase.from('matches').select('user_a, user_b').eq('id', matchId).single();
          if (matchError || !matchData) { navigate('/matches'); return; }
          partnerId = matchData.user_a === currentUser.id ? matchData.user_b : matchData.user_a;

          // If we had to fetch ID, we must fetch profile to show anything
          const { data: profile } = await supabase.from('profiles').select('id, real_name, anonymous_id, avatar, is_verified').eq('id', partnerId).single();
          if (profile) {
            const newPartner = {
              id: profile.id, anonymousId: profile.anonymous_id, realName: profile.real_name,
              gender: '', university: '', branch: '',
              year: '', interests: [], bio: '',
              dob: '', isVerified: profile.is_verified, avatar: profile.avatar,
              matchPercentage: 0, distance: 'Connected'
            };
            setPartner(newPartner);
            subscribeToUser(partnerId!);
          }
        } else {
          // We have a partner (from State or Cache). 
          // Refresh profile in BACKGROUND (Fire & Forget) to keep clear of stale data
          supabase.from('profiles').select('id, real_name, anonymous_id, avatar, is_verified').eq('id', partnerId).single().then(({ data: profile }) => {
            if (profile) {
              setPartner(prev => {
                if (!prev) return prev;
                const updated = {
                  ...prev,
                  realName: profile.real_name,
                  anonymousId: profile.anonymous_id,
                  avatar: profile.avatar,
                  isVerified: profile.is_verified
                };
                // Only update if changed (simple check)
                if (JSON.stringify(prev) !== JSON.stringify(updated)) {
                  return updated;
                }
                return prev;
              });
            }
          });
        }

        // Parallel Fetch: Messages + Block Status
        const [blockStatus, messagesRes] = await Promise.all([
          partnerId ? checkBlockStatus(partnerId) : Promise.resolve({ isBlocked: false, isBlockedBy: false }),
          supabase.from('messages').select('id, sender_id, text, created_at, is_read').eq('match_id', matchId).order('created_at', { ascending: false }).limit(MESSAGES_PER_PAGE)
        ]);

        setIsBlocked(blockStatus.isBlocked); setIsBlockedByThem(blockStatus.isBlockedBy);

        let newMessages: Message[] = messages;
        if (messagesRes.data) {
          newMessages = messagesRes.data.map((m: any) => ({
            id: m.id, senderId: m.sender_id, text: m.text.replace('[SYSTEM]', '').trim(),
            timestamp: new Date(m.created_at).getTime(),
            isSystem: m.text.startsWith('[SYSTEM]') || m.text.startsWith('📞')
          })).reverse();
          setMessages(newMessages); setHasMoreMessages(messagesRes.data.length === MESSAGES_PER_PAGE);
          setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
        }

        // Update cache with latest partner (possibly updated) and messages
        if (partnerRef.current && newMessages.length > 0) {
          try { sessionStorage.setItem(cacheKey, JSON.stringify({ partner: partnerRef.current, messages: newMessages })); } catch (e) { }
        }

      } catch (err) { console.error('Error loading chat:', err); } finally { setLoading(false); }
    };

    loadInitialData();
    return () => { if (partner) unsubscribeFromUser(partner.id); };
  }, [matchId, currentUser]);

  // === FIX BUG 3: Use Ref for markMessagesRead ===
  // This prevents stale closure in the realtime listener
  const markMessagesRead = async () => {
    if (!matchId || !currentUser) return;
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('match_id', matchId)
      .neq('sender_id', currentUser.id)
      .eq('is_read', false);
  };

  const markMessagesReadRef = useRef(markMessagesRead);
  useEffect(() => { markMessagesReadRef.current = markMessagesRead; });

  // Mark on mount
  useEffect(() => {
    if (!matchId || !currentUser) return;
    markMessagesReadRef.current();
  }, [matchId, currentUser?.id]);

  const loadMoreMessages = async () => {
    if (!hasMoreMessages || isLoadingMore || !matchId) return;
    setIsLoadingMore(true);
    try {
      const { data: msgData } = await supabase.from('messages').select('id, sender_id, text, created_at, is_read').eq('match_id', matchId).order('created_at', { ascending: false }).range(messages.length, messages.length + MESSAGES_PER_PAGE - 1);
      if (msgData && msgData.length > 0) {
        const formatted = msgData.map((m: any) => ({ id: m.id, senderId: m.sender_id, text: m.text.replace('[SYSTEM]', '').trim(), timestamp: new Date(m.created_at).getTime(), isSystem: m.text.startsWith('[SYSTEM]') || m.text.startsWith('📞') })).reverse();
        setMessages(prev => [...formatted, ...prev]); setHasMoreMessages(msgData.length === MESSAGES_PER_PAGE);
      } else setHasMoreMessages(false);
    } catch (err) { console.error(err); } finally { setIsLoadingMore(false); }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && hasMoreMessages && !isLoadingMore) {
      const container = e.currentTarget; const oldScrollHeight = container.scrollHeight;
      loadMoreMessages().then(() => { requestAnimationFrame(() => { container.scrollTop = container.scrollHeight - oldScrollHeight; }); });
    }
  };

  // Realtime
  useEffect(() => {
    if (!matchId || !supabase) return;

    const channel = supabase.channel(`chat_turbo:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}` // Server-side filter
      }, (payload) => {
        const newMsg = payload.new;
        const incoming: Message = { id: newMsg.id, senderId: newMsg.sender_id, text: newMsg.text.replace('[SYSTEM]', '').trim(), timestamp: new Date(newMsg.created_at).getTime(), isSystem: newMsg.text.startsWith('[SYSTEM]') || newMsg.text.startsWith('📞') };

        // === Fix: Use Ref to call fresh function ===
        if (newMsg.sender_id !== currentUser?.id) {
          markMessagesReadRef.current();
        }

        setMessages(prev => {
          if (prev.some(m => m.id === incoming.id)) return prev;
          const hasOptimistic = prev.some(m => m.id.toString().startsWith('temp-') && m.senderId === incoming.senderId && m.text === incoming.text);
          const next = hasOptimistic ? prev.map(m => (m.id.toString().startsWith('temp-') && m.senderId === incoming.senderId && m.text === incoming.text) ? incoming : m) : [...prev, incoming];

          const currentPartner = partnerRef.current;
          if (currentPartner) try { sessionStorage.setItem(cacheKey, JSON.stringify({ partner: currentPartner, messages: next })); } catch (e) { }

          const container = chatContainerRef.current;
          if (container && container.scrollHeight - container.scrollTop - container.clientHeight < 100) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          return next;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [matchId]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault(); if (!newMessage.trim() || !currentUser || !matchId) return;
    const textToSend = newMessage.trim(); setNewMessage('');
    const optimistic: Message = { id: `temp-${Date.now()}`, senderId: currentUser.id, text: textToSend, timestamp: Date.now(), isSystem: false };
    setMessages(prev => [...prev, optimistic]); setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try { await supabase.from('messages').insert({ match_id: matchId, sender_id: currentUser.id, text: textToSend }); analytics.messageSent(); }
    catch { setMessages(prev => prev.filter(m => m.id !== optimistic.id)); showToast('Failed', 'error'); }
  };

  const startVideoCall = async (type: 'audio' | 'video' = 'video') => { if (!partner || isStartingCall || !matchId || isCallActive) return; isUserOnline(partner.id) ? proceedWithCallCheck(type) : showConfirm('User Offline', `Call anyway?`, () => proceedWithCallCheck(type), false, 'Call'); };
  const proceedWithCallCheck = (type: 'audio' | 'video') => setPermissionModal({ isOpen: true, type, onGranted: () => { setPermissionModal(prev => ({ ...prev, isOpen: false })); proceedWithCall(type); } });
  const proceedWithCall = async (type: 'audio' | 'video') => {
    if (!partner || !matchId || !currentUser) return; setIsStartingCall(true);
    try { if (await checkUserBusy(partner.id, currentUser.id)) { showToast(`${partner.realName} busy`, 'info'); setIsStartingCall(false); return; } } catch { }
    setOutgoingCall({ receiverName: partner.realName, receiverAvatar: partner.avatar || '', callType: type });
    try {
      const s = await initiateCall(partner.id, matchId, { id: currentUser.id, name: currentUser.realName, avatar: currentUser.avatar || '', callType: type });
      if (!s) throw new Error('Fail');
      const t = setTimeout(async () => { setOutgoingCall(null); setIsStartingCall(false); showToast('No answer', 'info'); await insertSystemMessage('📞 Missed Call'); }, 30000);
      const ch = supabase.channel(`call:${s.id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'call_sessions', filter: `id=eq.${s.id}` }, async (payload: any) => {
        if (payload.new.status === 'active') { clearTimeout(t); supabase.removeChannel(ch); startCall(partner.realName, partner.avatar || '', s.app_id, s.channel_name, s.token, type, s.id); setIsStartingCall(false); }
        else if (payload.new.status === 'rejected') { clearTimeout(t); supabase.removeChannel(ch); setOutgoingCall(null); setIsStartingCall(false); showToast('Declined', 'info'); await insertSystemMessage('📞 Call Declined'); }
      }).subscribe();
    } catch { showToast('Call failed', 'error'); setOutgoingCall(null); setIsStartingCall(false); }
  };
  const insertSystemMessage = async (text: string) => { if (!currentUser || !matchId) return; try { await supabase.from('messages').insert({ match_id: matchId, sender_id: currentUser.id, text: text.startsWith('📞') ? text : `[SYSTEM] ${text}` }); } catch { } };
  const handleBlockUser = () => { if (!partner) return; showConfirm(isBlocked ? 'Unblock' : 'Block', `Confirm?`, async () => { if (isBlocked ? await unblockUser(partner.id) : await blockUser(partner.id)) { setIsBlocked(!isBlocked); setShowMenu(false); showToast('Success', 'success'); } }, !isBlocked); };

  if (loading) return <ChatSkeleton />;
  if (!partner) return null;

  return (
    <div className="h-full w-full bg-transparent flex flex-col relative">
      <ConfirmationModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} confirmLabel={confirmModal.confirmLabel} isDestructive={confirmModal.isDestructive} onConfirm={confirmModal.onConfirm} onCancel={closeConfirmModal} />
      <PermissionModal isOpen={permissionModal.isOpen} onPermissionsGranted={permissionModal.onGranted} onCancel={() => setPermissionModal(prev => ({ ...prev, isOpen: false }))} requiredPermissions={permissionModal.type === 'video' ? ['camera', 'microphone'] : ['microphone']} />
      <div className="flex-none px-4 py-3 bg-black/95 backdrop-blur-md border-b border-gray-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-3"><button onClick={() => navigate('/matches')} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800"><ArrowLeft className="w-5 h-5" /></button><div className="relative"><img src={getOptimizedUrl(partner.avatar, 64)} className="w-10 h-10 rounded-full border border-gray-700 object-cover" /><div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black ${isUserOnline(partner.id) ? 'bg-green-500' : 'bg-gray-500'}`}></div></div><div><h3 className="text-sm font-bold text-white">{partner.realName || partner.anonymousId}</h3><span className="text-[10px] text-gray-500">{isUserOnline(partner.id) ? <span className="text-green-400">Active</span> : (getLastSeen(partner.id) ? (new Date().getTime() - getLastSeen(partner.id)!.getTime() < 60000 ? 'just now' : getLastSeen(partner.id)?.toLocaleDateString()) : 'Offline')}</span></div></div>
        <div className="flex items-center gap-1"><button onClick={() => startVideoCall('video')} disabled={isStartingCall} className="p-2.5 text-gray-400 hover:text-neon hover:bg-gray-800 rounded-full"><Video className="w-5 h-5" /></button><button onClick={() => startVideoCall('audio')} disabled={isStartingCall} className="p-2.5 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded-full"><Phone className="w-5 h-5" /></button>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"><MoreVertical className="w-5 h-5" /></button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-12 z-50 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
                  <button onClick={() => { navigate(`/profile/${partner.id}`); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800"><User className="w-4 h-4" /> View Profile</button>
                  <button onClick={() => { setShowMenu(false); handleBlockUser(); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800"><Ban className="w-4 h-4" /> {isBlocked ? 'Unblock' : 'Block'}</button>
                  <button onClick={() => { navigate('/contact', { state: { reportUserId: partner.id } }); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-gray-800"><AlertTriangle className="w-4 h-4" /> Report</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4" onScroll={handleScroll}>
        {isLoadingMore && <div className="flex justify-center"><Loader2 className="w-5 h-5 text-gray-500 animate-spin" /></div>}
        <div className="mb-4 bg-gradient-to-r from-blue-900/10 to-purple-900/10 border border-blue-800/20 rounded-2xl p-3 backdrop-blur-sm flex gap-3"><div className="p-2 bg-blue-600/10 rounded-full h-fit"><Shield className="w-4 h-4 text-blue-400" /></div><div><h4 className="text-xs font-bold text-blue-400 flex items-center gap-2"><Clock className="w-3 h-3" /> Privacy Active</h4><p className="text-[11px] text-gray-400">Messages deleted after 3 days. Screenshots disabled.</p></div></div>
        {messages.length === 0 && <div className="flex flex-col items-center justify-center h-[50vh] opacity-50"><Ghost className="w-10 h-10 text-gray-700 mb-2" /><p className="text-sm text-gray-500">No messages yet.</p></div>}
        {messages.map((msg, i) => { const isMe = msg.senderId === currentUser?.id; if (msg.isSystem) return <div key={msg.id} className="flex justify-center w-full my-4"><span className="text-[10px] uppercase text-gray-500 bg-gray-900/50 px-4 py-1.5 rounded-full border border-gray-800/50 flex items-center gap-2">{msg.text.replace('📞', '').trim()}</span></div>; return (<div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}><div className={`flex max-w-[80%] md:max-w-[60%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>{!isMe && <div className="w-8 h-8 flex-shrink-0">{(!messages[i - 1] || messages[i - 1].senderId !== msg.senderId) && <img src={getOptimizedUrl(partner.avatar, 64)} className="w-8 h-8 rounded-full border border-gray-800 object-cover" />}</div>}<div className={`relative px-4 py-2.5 rounded-2xl text-sm break-words ${isMe ? 'bg-neon text-white rounded-br-none' : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'}`}>{msg.text}<span className={`text-[9px] block mt-1 opacity-60 text-right ${isMe ? 'text-white' : 'text-gray-400'}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div></div></div>); })}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 bg-black/95 backdrop-blur-md border-t border-gray-800 z-20 relative">{(isBlocked || isBlockedByThem) && <div className="absolute inset-0 bg-gray-900/95 flex items-center justify-center z-30"><div className="text-center"><Ban className="w-8 h-8 text-gray-600 mx-auto mb-2" /><p className="text-sm text-gray-400 font-medium">{isBlocked ? 'You blocked this user' : 'User unavailable'}</p>{isBlocked && <button onClick={handleBlockUser} className="mt-3 px-4 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full">Unblock</button>}</div></div>}<form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-2 px-2 pb-2"><div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl flex items-center gap-2 px-3 py-1 shadow-inner focus-within:border-gray-600 transition-colors"><input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-transparent py-3 text-sm text-white placeholder-gray-500 outline-none min-h-[44px] max-h-32" /></div><button type="submit" disabled={!newMessage.trim()} className="p-3 rounded-full bg-neon text-white shadow-lg hover:bg-[#d6006b] transition-all disabled:opacity-50"><Send className="w-5 h-5 fill-current" /></button></form></div>
    </div>
  );
};