import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { MatchProfile, Message, CallType } from '../types';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Ghost } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Chat: React.FC = () => {
  const { id: matchId } = useParams<{ id: string }>(); // This is the MATCH ID from the URL
  const { currentUser } = useAuth();
  const { startCall } = useCall();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [partner, setPartner] = useState<MatchProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

        // B. Identify Partner
        const partnerId = matchData.user_a === currentUser.id ? matchData.user_b : matchData.user_a;

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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !currentUser || !supabase || !matchId) return;

    const textToSend = newMessage.trim();
    setNewMessage(''); // Clear input immediately

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

      // (Realtime subscription will pick this up, but we can optimistically add it here if network is slow)
    } catch (err) {
      console.error('Failed to send:', err);
      alert('Failed to send message');
    }
  };

  const startVideoCall = () => {
    if (partner) {
      startCall(CallType.VIDEO, partner.realName || partner.anonymousId);
    }
  };

  const startAudioCall = () => {
    if (partner) {
      startCall(CallType.AUDIO, partner.realName || partner.anonymousId);
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
              {partner.realName || partner.anonymousId}
            </h3>
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              {partner.university}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={startVideoCall} className="p-2.5 text-gray-400 hover:text-neon hover:bg-gray-800 rounded-full transition-all">
            <Video className="w-5 h-5" />
          </button>
          <button onClick={startAudioCall} className="p-2.5 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded-full transition-all">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
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
    </div>
  );
};