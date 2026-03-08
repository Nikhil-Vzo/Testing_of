import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePresence } from '../context/PresenceContext';
import { supabase } from '../lib/supabase';
import { MatchProfile } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Ghost, Loader2, BadgeCheck } from 'lucide-react';
import { getOptimizedUrl } from '../utils/image';
import { getRandomQuote } from '../data/loadingQuotes';
import { LoadingState } from '../components/LoadingState';

interface ChatPreview {
  id: string;
  partner: MatchProfile;
  lastMessage: string | null;
  lastMessageTime: number | null;
  unreadCount: number;
}

// v6: localStorage + stale-while-revalidate
const CACHE_KEY = 'otherhalf_matches_cache_v6';
const CACHE_EXPIRY_KEY = 'otherhalf_matches_expiry_v6';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper: read cache from localStorage (survives tab close)
const readCache = (): ChatPreview[] => {
  try {
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_EXPIRY_KEY);
      return [];
    }
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch { return []; }
};

const writeCache = (data: ChatPreview[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_DURATION));
  } catch { /* quota exceeded — ignore */ }
};

const MatchSkeleton = () => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-900/30 border border-gray-800/50 animate-pulse">
    <div className="w-14 h-14 bg-gray-800 rounded-full" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-32 bg-gray-800 rounded" />
      <div className="h-3 w-48 bg-gray-800/50 rounded" />
    </div>
  </div>
);

export const Matches: React.FC = () => {
  const { currentUser } = useAuth();
  const { isUserOnline } = usePresence();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Load from localStorage cache for instant display
  const [chats, setChats] = useState<ChatPreview[]>(() => {
    try {
      let initialChats = readCache();

      // CHECK FOR INSTANT UPDATE FROM CHAT
      // If we just came back from a chat, update that specific match immediately
      if (location.state?.updatedMatchId) {
        const { updatedMatchId, lastMessage, lastMessageTime } = location.state;

        initialChats = initialChats.map((c: ChatPreview) => {
          if (c.id === updatedMatchId) {
            return {
              ...c,
              lastMessage: lastMessage || c.lastMessage,
              lastMessageTime: lastMessageTime || c.lastMessageTime,
              unreadCount: 0 // We just read it
            };
          }
          return c;
        });

        // Re-sort because the timestamp changed
        initialChats.sort((a: ChatPreview, b: ChatPreview) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

        // Update cache immediately
        writeCache(initialChats);

        // Clear state to prevent re-runs
        window.history.replaceState({}, document.title);
      }

      return initialChats;
    } catch { return []; }
  });

  const [loading, setLoading] = useState(() => chats.length === 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'online'>('all');

  // Ref to debounce refreshes
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 2. The Core Loading Function — server-side block filtering via RPC
  const loadMatches = useCallback(async (isBackground = false) => {
    if (!currentUser || !supabase) return;
    if (!isBackground && chats.length === 0) setLoading(true);

    try {
      // Single RPC call — blocked users are filtered server-side
      const { data: formatted, error } = await supabase
        .rpc('get_matches_with_preview', { current_user_id: currentUser.id });

      if (error) throw error;

      if (!formatted || formatted.length === 0) {
        setChats([]);
        setLoading(false);
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_EXPIRY_KEY);
        return;
      }

      // Map RPC result (snake_case from DB) to our camelCase app types
      const mappedChats: ChatPreview[] = formatted.map((m: any) => {
        const p = m.partner_profile;
        return {
          id: m.match_id,
          partner: {
            id: m.partner_id,
            anonymousId: p.anonymous_id,
            realName: p.real_name,
            avatar: p.avatar,
            isVerified: p.is_verified,
            university: p.university,
            gender: p.gender,
            branch: p.branch || '',
            year: p.year || '',
            bio: p.bio || '',
            dob: p.dob || '',
            interests: p.interests || [],
            matchPercentage: 0,
            distance: 'Connected'
          },
          lastMessage: m.last_message,
          lastMessageTime: m.last_message_time ? new Date(m.last_message_time).getTime() : null,
          unreadCount: m.unread_count
        };
      });

      // Already sorted by RPC, but ensure client-side consistency
      mappedChats.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

      setChats(prev => {
        const isDifferent = JSON.stringify(prev) !== JSON.stringify(mappedChats);
        if (isDifferent) {
          writeCache(mappedChats);
          return mappedChats;
        }
        return prev;
      });

    } catch (err) {
      console.error("Matches load error", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // 3. Debounced Refresh (Prevents flicker/spam)
  const refreshMatches = useCallback(() => {
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = setTimeout(() => {
      console.log("⚡ Refreshing Matches (Realtime)");
      loadMatches(true);
    }, 1000); // Wait 1s for database to settle
  }, [loadMatches]);

  // 4. Initial Load & Realtime
  useEffect(() => {
    loadMatches();

    const channel = supabase.channel('matches-list-updates')
      // INSERT: new message arrived — optimistically update local state
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as any;
        setChats(prev => {
          // Find the chat this message belongs to
          const matchId = msg.match_id;
          const chatIndex = prev.findIndex(c => c.id === matchId);
          if (chatIndex === -1) {
            // New match we don't have yet — fall back to full refresh
            refreshMatches();
            return prev;
          }

          // Update the existing chat entry optimistically
          const updated = [...prev];
          const chat = { ...updated[chatIndex] };
          chat.lastMessage = msg.content || msg.text || '';
          chat.lastMessageTime = msg.created_at ? new Date(msg.created_at).getTime() : Date.now();
          // Only increment unread if the message is from the partner
          if (msg.sender_id !== currentUser?.id) {
            chat.unreadCount = (chat.unreadCount || 0) + 1;
          }
          updated[chatIndex] = chat;

          // Re-sort by latest message
          updated.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
          writeCache(updated);
          return updated;
        });
      })
      // UPDATE: is_read changed (e.g. partner marked messages read)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        refreshMatches();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, [currentUser, loadMatches, refreshMatches]);

  const filteredChats = chats.filter(chat => {
    const matchesSearch = (chat.partner.realName || chat.partner.anonymousId).toLowerCase().includes(searchTerm.toLowerCase());
    const isOnline = isUserOnline(chat.partner.id);
    if (filter === 'online' && !isOnline) return false;
    if (filter === 'unread' && chat.unreadCount === 0) return false;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="h-full w-full bg-transparent p-4 space-y-4 relative">
        <LoadingState />
        <MatchSkeleton /><MatchSkeleton /><MatchSkeleton />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-transparent text-white flex flex-col font-sans">
      <div className="p-5 border-b border-gray-800/50 bg-black/20 backdrop-blur-md sticky top-0 z-20">
        <h1 className="text-2xl font-black tracking-tight mb-4 flex items-center gap-2">Matches <span className="bg-neon/10 text-neon text-xs px-2 py-1 rounded-full border border-neon/20">{chats.length}</span></h1>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon transition-colors" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search matches..." className="w-full bg-gray-900/50 border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-neon/50 focus:bg-gray-900 transition-all" />
        </div>
      </div>

      <div className="px-5 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {(['all', 'unread', 'online'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${filter === f ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-600'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3 pb-24">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Ghost className="w-16 h-16 text-gray-700 mb-4" />
            <p className="text-base font-bold text-gray-400 mb-2">No matches yet</p>
            <p className="text-sm text-gray-600 mb-6 text-center max-w-xs">Start swiping to find your OthrHalff — they're waiting for you!</p>
            <button onClick={() => navigate('/home')} className="px-6 py-3 bg-neon text-white font-bold text-sm uppercase tracking-wider rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,0,127,0.4)]">
              Start Discovering
            </button>
          </div>
        ) : (
          filteredChats.map(chat => (
            <div key={chat.id} onClick={() => {
              // === FIX BUG 2: Optimistic Cache Update ===
              setChats(prev => {
                const updated = prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c);
                writeCache(updated);
                return updated;
              });
              navigate(`/chat/${chat.id}`, { state: { partner: chat.partner } });
            }} className="group relative bg-gray-900/30 hover:bg-gray-800/50 border border-gray-800/50 hover:border-gray-700 rounded-2xl p-4 transition-all duration-300 cursor-pointer active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={getOptimizedUrl(chat.partner.avatar, 64)} alt="Avatar" className="w-14 h-14 rounded-full object-cover border-2 border-gray-800 group-hover:border-gray-600 transition-colors" />
                  {isUserOnline(chat.partner.id) && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <div className="flex items-center gap-1 min-w-0 pr-2">
                      <h3 className="text-base font-bold text-gray-100 truncate group-hover:text-white transition-colors">{chat.partner.realName || chat.partner.anonymousId}</h3>
                      {chat.partner.isVerified && (
                        <BadgeCheck className="w-4 h-4 flex-shrink-0 drop-shadow-[0_0_4px_rgba(96,165,250,0.8)]" style={{ color: '#60a5fa' }} />
                      )}
                    </div>
                    {chat.lastMessageTime && <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap">{new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate pr-4 ${chat.unreadCount > 0 ? 'text-white font-semibold' : 'text-gray-500 group-hover:text-gray-400'}`}>{chat.lastMessage}</p>
                    {chat.unreadCount > 0 && <div className="bg-neon text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-neon/20 min-w-[20px] text-center">{chat.unreadCount}</div>}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};