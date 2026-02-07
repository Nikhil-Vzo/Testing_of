import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { MatchProfile, Message } from '../types';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Ghost, Shield, Clock, User, AlertTriangle, Ban } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VideoCall } from '../components/VideoCall';

export const Chat: React.FC = () => {
  const { id: matchId } = useParams<{ id: string }>(); // This is the MATCH ID from the URL
  const { currentUser } = useAuth();
  const { startCall } = useCall();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [partner, setPartner] = useState<MatchProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false); // Prevent multiple call initiations

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Screenshot Protection
  useEffect(() => {
    const preventScreenshot = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const container = chatContainerRef.current;
    if (container) {
      // Disable context menu
      container.addEventListener('contextmenu', preventScreenshot);

      // Disable keyboard shortcuts for screenshots
      const handleKeyDown = (e: KeyboardEvent) => {
        // Print Screen, Win+Shift+S, Cmd+Shift+4/5
        if (
          e.key === 'PrintScreen' ||
          (e.metaKey && e.shiftKey && (e.key === '4' || e.key === '5')) ||
          (e.key === 's' && e.shiftKey && e.metaKey)
        ) {
          e.preventDefault();
          alert('Screenshots are disabled to protect privacy');
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        container.removeEventListener('contextmenu', preventScreenshot);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, []);

  // 1. Fetch Match Details & Messages
  useEffect(() => {
    if (!currentUser || !matchId || !supabase) return;

    const fetchChatData = async () => {
      try {
        // A. Get Match Info (to find who the partner is)
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .eq('id', matchId)
          .single();

        if (matchError || !matchData) {
          console.error('Match not found');
          navigate('/matches');
          return;
        }

        // B. Identify Partner and check if names are revealed
        const partnerId = matchData.user_a === currentUser.id ? matchData.user_b : matchData.user_a;
        setIsRevealed(matchData.is_revealed || false);

        // C. Get Partner Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', partnerId)
          .single();

        if (profileData) {
          setPartner({
            id: profileData.id,
            anonymousId: profileData.anonymous_id,
            realName: profileData.real_name,
            gender: profileData.gender,
            university: profileData.university,
            branch: profileData.branch,
            year: profileData.year,
            interests: profileData.interests || [],
            bio: profileData.bio,
            dob: profileData.dob,
            isVerified: profileData.is_verified,
            avatar: profileData.avatar,
            matchPercentage: 0,
            distance: 'Connected'
          });
        }

        // D. Get Message History
        const { data: msgData } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true });

        if (msgData) {
          const formatted: Message[] = msgData.map((m: any) => ({
            id: m.id,
            senderId: m.sender_id,
            text: m.text,
            timestamp: new Date(m.created_at).getTime(),
            isSystem: false
          }));
          setMessages(formatted);
        }

      } catch (err) {
        console.error('Error loading chat:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();

    // 2. REALTIME SUBSCRIPTION (The Magic Part)
    const channel = supabase
      .channel(`chat:${matchId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const newMsg = payload.new;
          // Only add if it wasn't sent by me (because I add mine immediately for UI speed)
          // OR if I want to confirm receipt. simpler: Just append everything incoming.
          // To prevent dupes from my own optimistic update, we can check IDs or just rely on fetching.
          // For simplicity/speed:
          const incoming: Message = {
            id: newMsg.id,
            senderId: newMsg.sender_id,
            text: newMsg.text,
            timestamp: new Date(newMsg.created_at).getTime(),
            isSystem: false
          };

          setMessages(prev => {
            // Avoid duplicate if we optimistically added it
            if (prev.some(m => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [matchId, currentUser]);

  // Reset call starting state when user returns from a call
  useEffect(() => {
    // When user is not in a call anymore, reset the button state
    setIsStartingCall(false);
  }, []);


  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !currentUser || !supabase || !matchId) return;

    const textToSend = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    // Optimistic UI update - show message immediately
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`, // Temporary ID until database assigns real one
      senderId: currentUser.id,
      text: textToSend,
      timestamp: Date.now(),
      isSystem: false
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Database Insert
      const { error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: currentUser.id,
          text: textToSend
        });

      if (error) throw error;

      // Real-time subscription will replace the optimistic message with the database version
    } catch (err) {
      console.error('Failed to send:', err);
      alert('Failed to send message');
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    }
  };

  const startVideoCall = async () => {
    if (!partner || isStartingCall) return; // Prevent multiple simultaneous calls

    setIsStartingCall(true); // Lock the button
    try {
      // Create Daily.co room via backend
      // In production (Vercel), use relative URL which goes through Vercel proxy to Render
      // In development, use localhost directly
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/create-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.roomUrl) {
        startCall(isRevealed ? partner.realName : partner.anonymousId, data.roomUrl);
      } else {
        alert('Failed to create call room');
        setIsStartingCall(false); // Unlock on failure
      }
    } catch (error) {
      console.error('Error creating call:', error);
      alert('Failed to start call');
      setIsStartingCall(false); // Unlock on error
    }
    // Note: Don't unlock on success - the call UI will take over
  };

  const startAudioCall = async () => {
    // For now, audio calls use the same video room (user can disable video)
    await startVideoCall();
  };

  const handleViewProfile = () => {
    if (partner) {
      navigate(`/profile/${partner.id}`);
    }
    setShowMenu(false);
  };

  const handleBlockUser = () => {
    if (confirm('Are you sure you want to block this user?')) {
      alert('Block feature coming soon!');
      setShowMenu(false);
    }
  };

  const handleReport = () => {
    if (confirm('Report this user for inappropriate behavior?')) {
      alert('Report feature coming soon!');
      setShowMenu(false);
    }
  };

  if (loading) return (
    <div className="h-full w-full bg-[#000000] flex flex-col">
      {/* Header Skeleton */}
      <div className="px-4 py-3 bg-gray-900/80 border-b border-gray-800 flex items-center gap-3 animate-pulse">
        <div className="w-8 h-8 bg-gray-800 rounded-full" />
        <div className="w-10 h-10 bg-gray-800 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 bg-gray-800 rounded" />
          <div className="h-3 w-32 bg-gray-800/60 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-gray-800 rounded-full" />
          <div className="w-10 h-10 bg-gray-800 rounded-full" />
        </div>
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 p-4 space-y-4 animate-pulse">
        {/* Incoming message */}
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-gray-800 rounded-full" />
          <div className="h-12 w-48 bg-gray-800 rounded-2xl rounded-bl-none" />
        </div>
        {/* Outgoing message */}
        <div className="flex justify-end">
          <div className="h-10 w-40 bg-gray-700 rounded-2xl rounded-br-none" />
        </div>
        {/* Another incoming */}
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-gray-800 rounded-full" />
          <div className="h-16 w-56 bg-gray-800 rounded-2xl rounded-bl-none" />
        </div>
      </div>

      {/* Input Skeleton */}
      <div className="p-4 bg-gray-900/90 border-t border-gray-800 animate-pulse">
        <div className="flex gap-2">
          <div className="flex-1 h-12 bg-gray-950 rounded-full border border-gray-800" />
          <div className="w-12 h-12 bg-gray-800 rounded-full" />
        </div>
      </div>
    </div>
  );

  if (!partner) return null;

  return (
    <div className="h-full w-full bg-transparent flex flex-col relative">

      {/* 1. Header */}
      <div className="px-4 py-3 bg-black/95 backdrop-blur-md border-b border-gray-800 flex items-center justify-between z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/matches')} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative">
            <img src={partner.avatar} className="w-10 h-10 rounded-full border border-gray-700 object-cover" alt="Avatar" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#000000]"></div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white leading-tight">
              {isRevealed ? partner.realName : partner.anonymousId}
            </h3>
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              {partner.university}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={startVideoCall}
            disabled={isStartingCall}
            className="p-2.5 text-gray-400 hover:text-neon hover:bg-gray-800 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            onClick={startAudioCall}
            disabled={isStartingCall}
            className="p-2.5 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Phone className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                  <button
                    onClick={() => { handleViewProfile(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4" />
                    View Profile
                  </button>
                  <div className="h-px bg-gray-800" />
                  <button
                    onClick={handleBlockUser}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-orange-400 transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                    Block User
                  </button>
                  <div className="h-px bg-gray-800" />
                  <button
                    onClick={handleReport}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Report User
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Messages Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
        {/* Privacy Notice */}
        <div className="sticky top-0 z-10 mb-4">
          <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-600/30 rounded-2xl p-3 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-600/20 rounded-full mt-0.5">
                <Shield className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-yellow-500 mb-1 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Privacy Protection Active
                </h4>
                <p className="text-[11px] text-yellow-200/80 leading-relaxed">
                  Messages are automatically deleted after <span className="font-bold text-yellow-400">3 days</span>. Screenshots are disabled for your safety.
                </p>
              </div>
            </div>
          </div>
        </div>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4">
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center border border-gray-800">
              <Ghost className="w-10 h-10 text-gray-700" />
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-sm">No messages yet.</p>
              <p className="text-xs text-gray-600 mt-1">Break the ice with something witty!</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUser?.id;
          const showAvatar = !isMe && (i === 0 || messages[i - 1].senderId !== msg.senderId);

          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] md:max-w-[60%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar for Partner */}
                {!isMe && (
                  <div className="w-8 h-8 flex-shrink-0 flex flex-col justify-end">
                    {showAvatar ? (
                      <img src={partner.avatar} className="w-8 h-8 rounded-full border border-gray-800 object-cover" alt="" />
                    ) : <div className="w-8" />}
                  </div>
                )}

                {/* Message Bubble */}
                <div className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words
                            ${isMe
                    ? 'bg-neon text-white rounded-br-none'
                    : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
                  }`}
                >
                  {msg.text}
                  <span className={`text-[9px] block mt-1 opacity-60 text-right ${isMe ? 'text-white' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input Area */}
      <div className="p-4 bg-gray-900/90 backdrop-blur border-t border-gray-800 z-20">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-950 border border-gray-800 text-white rounded-full px-5 py-3.5 focus:outline-none focus:border-neon/50 focus:ring-1 focus:ring-neon/20 transition-all placeholder:text-gray-600"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-3.5 bg-neon text-white rounded-full hover:bg-neon/90 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,0,127,0.3)]"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* CSS for Screenshot Protection */}
      <style>{`
        /* Disable text selection in chat */
        .select-none {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        /* Disable drag/drop */
        .select-none img {
          pointer-events: none;
          -webkit-user-drag: none;
          -moz-user-drag: none;
          user-drag: none;
        }
      `}</style>
    </div>
  );
};