import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePresence } from '../context/PresenceContext';
import { supabase } from '../lib/supabase';
import { MatchProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import { Search, Ghost, Loader2 } from 'lucide-react';
import { getBlockList, isBlockedBy } from '../services/blockService';
import { getOptimizedUrl } from '../utils/image';

interface ChatPreview {
  id: string;
  partner: MatchProfile;
  lastMessage: string | null;
  lastMessageTime: number | null;
  unreadCount: number;
}

// v3 Key to force cache clear for the new logic
const CACHE_KEY = 'otherhalf_matches_cache_v3';

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

  // 1. Load from Cache initially for speed
  const [chats, setChats] = useState<ChatPreview[]>(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  const [loading, setLoading] = useState(() => chats.length === 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'online'>('all');

  // Ref to debounce refreshes
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 2. The Core Loading Function
  const loadMatches = useCallback(async (isBackground = false) => {
    if (!currentUser || !supabase) return;
    if (!isBackground && chats.length === 0) setLoading(true);

    try {
      const blockedUsers = await getBlockList();

      // Fetches Matches + Profiles + Messages (for count) in 1 query
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select(`
          id, user_a, user_b, created_at,
          user_a_profile:profiles!fk_matches_user_a(id, real_name, anonymous_id, avatar, is_verified, university, gender, branch, year, bio, dob, interests),
          user_b_profile:profiles!fk_matches_user_b(id, real_name, anonymous_id, avatar, is_verified, university, gender, branch, year, bio, dob, interests),
          messages!fk_messages_match(text, created_at, sender_id, is_read)
        `)
        .or(`user_a.eq.${currentUser.id},user_b.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!matchesData || matchesData.length === 0) {
        setChats([]);
        setLoading(false);
        sessionStorage.removeItem(CACHE_KEY);
        return;
      }

      const formatted: ChatPreview[] = [];

      for (const match of matchesData) {
        const partnerId = match.user_a === currentUser.id ? match.user_b : match.user_a;
        if (blockedUsers.includes(partnerId) || await isBlockedBy(partnerId)) continue;

        // @ts-ignore
        const rawProfile = match.user_a === currentUser.id ? match.user_b_profile : match.user_a_profile;
        const partnerProfile: any = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;

        if (!partnerProfile) continue;

        // @ts-ignore
        const matchMessages = match.messages || [];
        // Sort to find latest
        matchMessages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const lastMsg = matchMessages[0];

        // CALCULATION: This is the source of truth. We count what the DB says.
        const unreadCount = matchMessages.filter((m: any) => m.sender_id === partnerId && !m.is_read).length;

        formatted.push({
          id: match.id,
          partner: {
            id: partnerProfile.id,
            anonymousId: partnerProfile.anonymous_id,
            realName: partnerProfile.real_name,
            avatar: partnerProfile.avatar,
            isVerified: partnerProfile.is_verified,
            university: partnerProfile.university,
            gender: partnerProfile.gender,
            branch: partnerProfile.branch || '',
            year: partnerProfile.year || '',
            bio: partnerProfile.bio || '',
            dob: partnerProfile.dob || '',
            interests: partnerProfile.interests || [],
            matchPercentage: 0,
            distance: 'Connected'
          },
          lastMessage: lastMsg?.text?.replace('[SYSTEM]', '') || 'New Match!',
          lastMessageTime: lastMsg ? new Date(lastMsg.created_at).getTime() : new Date(match.created_at).getTime(),
          unreadCount: unreadCount || 0
        });
      }

      formatted.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

      setChats(prev => {
        const isDifferent = JSON.stringify(prev) !== JSON.stringify(formatted);
        if (isDifferent) {
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(formatted)); } catch (e) { sessionStorage.clear(); }
          return formatted;
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
      // INSERT: new message arrived
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        refreshMatches();
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
      <div className="h-full w-full bg-transparent p-4 space-y-4">
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

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Ghost className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-sm text-gray-400 font-medium">No matches found</p>
          </div>
        ) : (
          filteredChats.map(chat => (
            <div key={chat.id} onClick={() => {
              // === FIX BUG 2: Optimistic Cache Update ===
              setChats(prev => {
                const updated = prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c);
                try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(updated)); } catch (e) { }
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
                    <h3 className="text-base font-bold text-gray-100 truncate pr-2 group-hover:text-white transition-colors">{chat.partner.realName || chat.partner.anonymousId}</h3>
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