import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePresence } from '../context/PresenceContext';
import { useNotifications } from '../context/NotificationContext';
import { MatchProfile, ChatSession } from '../types';
import { Ghost, Search, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const CACHE_KEY = 'otherhalf_matches_cache';

export const Matches: React.FC = () => {
  const { currentUser } = useAuth();
  const { subscribeToUser, unsubscribeFromUser, isUserOnline } = usePresence();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<{ match: MatchProfile; session: ChatSession; hasUnread: boolean }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Optimized fetch with batched queries
  const fetchMatchesOptimized = useCallback(async (showLoading: boolean) => {
    if (!currentUser || !supabase) return;

    if (showLoading) setLoading(true);

    try {
      // 1. Get all matches (single query)
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user_a.eq.${currentUser.id},user_b.eq.${currentUser.id}`);

      if (error) throw error;
      if (!matchesData || matchesData.length === 0) {
        setSessions([]);
        try { sessionStorage.removeItem(CACHE_KEY); } catch (e) { }
        if (showLoading) setLoading(false);
        return;
      }

      // 2. Get all partner IDs at once
      const partnerIds = matchesData.map(m =>
        m.user_a === currentUser.id ? m.user_b : m.user_a
      );

      // 3. BATCHED: Fetch ALL partner profiles in ONE query
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', partnerIds);

      // 4. BATCHED: Fetch ONLY the last message for EACH match in PARALLEL
      const lastMessages = await Promise.all(
        matchesData.map(async (match) => {
          const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          return { matchId: match.id, message: data };
        })
      );

      // 4b. Use NotificationContext for unread status
      const unreadMap = new Set(
        notifications
          .filter(n => n.type === 'message' && !n.read && n.fromUserId)
          .map(n => n.fromUserId)
      );

      // Create lookup maps for O(1) access
      const profileMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const lastMessageMap = new Map<string, any>(
        lastMessages.map(item => [item.matchId, item.message])
      );

      // 5. Build sessions
      const loadedSessions = matchesData.map(matchRecord => {
        const partnerId = matchRecord.user_a === currentUser.id ? matchRecord.user_b : matchRecord.user_a;
        const profileData = profileMap.get(partnerId);
        const lastMsg = lastMessageMap.get(matchRecord.id);

        if (!profileData) return null;

        const matchProfile: MatchProfile = {
          id: profileData.id,
          anonymousId: profileData.anonymous_id || 'Anonymous',
          realName: profileData.real_name || 'Student',
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
        };

        const session: ChatSession = {
          matchId: matchRecord.id,
          userA: matchRecord.user_a,
          userB: matchRecord.user_b,
          isRevealed: matchRecord.is_revealed,
          lastUpdated: lastMsg ? new Date(lastMsg.created_at).getTime() : new Date(matchRecord.created_at).getTime(),
          messages: lastMsg ? [{
            id: lastMsg.id,
            senderId: lastMsg.sender_id,
            text: lastMsg.text,
            timestamp: new Date(lastMsg.created_at).getTime(),
            isSystem: false
          }] : []
        };

        return { match: matchProfile, session, hasUnread: unreadMap.has(partnerId) };
      }).filter(Boolean) as { match: MatchProfile; session: ChatSession; hasUnread: boolean }[];

      // Sort by latest activity
      loadedSessions.sort((a, b) => b.session.lastUpdated - a.session.lastUpdated);

      // Deduplicate
      const seenPartners = new Set<string>();
      const uniqueSessions = loadedSessions.filter(item => {
        if (seenPartners.has(item.match.id)) return false;
        seenPartners.add(item.match.id);
        return true;
      });

      setSessions(uniqueSessions);

      // CACHE WRITE (Safe)
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(uniqueSessions)); } catch (e) { /* Ignore quota errors */ }

    } catch (err) {
      console.error('Error loading matches:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [currentUser, notifications]);

  useEffect(() => {
    if (!currentUser || !supabase) return;

    // CACHE READ (Instant Load)
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        setSessions(JSON.parse(cached));
        setLoading(false);
      }
    } catch (e) { /* mismatch */ }

    // NETWORK FETCH (Background update)
    // We pass 'false' for showLoading if we have cache, but the logic 
    // inside fetchMatchesOptimized sets loading to true if passed true.
    // Let's decide: if we have cache, we don't want to show spinner again?
    // Actually, 'fetchMatchesOptimized' sets loading=true if arg is true.
    // We should call it with fetchMatchesOptimized(!cached) or similar, 
    // but 'cached' variable isn't available here. 
    // Simplest: Check cache existence synchronously or just pass false if we want silent update.
    // However, we want to update the data. Let's pass 'false' to avoid flickering spinner if data exists.
    const hasCache = !!sessionStorage.getItem(CACHE_KEY);
    fetchMatchesOptimized(!hasCache);

  }, [currentUser, fetchMatchesOptimized]);

  // Subscribe to presence
  useEffect(() => {
    if (sessions.length === 0) return;
    sessions.forEach(({ match }) => { subscribeToUser(match.id); });
    return () => { sessions.forEach(({ match }) => { unsubscribeFromUser(match.id); }); };
  }, [sessions.length]);

  const filtered = sessions.filter(s =>
    s.match.anonymousId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.match.realName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full w-full bg-transparent text-white flex flex-col relative overflow-hidden">

      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="p-6 pb-2 z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 rounded-xl border border-gray-800">
              <Ghost className="w-6 h-6 text-neon" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Messages</h1>
          </div>
          <div className="bg-gray-900/50 backdrop-blur rounded-full px-3 py-1 text-xs font-bold text-gray-400 border border-gray-800">
            {sessions.length} {sessions.length === 1 ? 'Match' : 'Matches'}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon transition-colors" />
          <input type="text" placeholder="Search matches..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-neon/50 focus:bg-gray-900 transition-all placeholder:text-gray-600" />
        </div>
      </div>

      {/* Match List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-24 md:pb-4 space-y-2 z-10">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-2xl border border-gray-800/50 flex items-center gap-4 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center"><div className="h-5 w-28 bg-gray-800 rounded" /><div className="h-3 w-12 bg-gray-800 rounded" /></div>
                  <div className="h-4 w-48 bg-gray-800/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center opacity-50">
            <Ghost className="w-12 h-12 mb-4 text-gray-700" />
            <p className="text-gray-500 text-sm">No matches found.<br />Start swiping to connect!</p>
          </div>
        ) : (
          filtered.map(({ match, session, hasUnread }) => {
            const lastMsg = session.messages[0];
            const isUnread = hasUnread;

            return (
              <div key={match.id} onClick={() => navigate(`/chat/${session.matchId}`)} className="group relative p-4 rounded-2xl hover:bg-gray-900/40 border border-transparent hover:border-gray-800 transition-all cursor-pointer flex items-center gap-4 active:scale-[0.99]">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-gray-800 to-gray-700 group-hover:from-neon group-hover:to-purple-600 transition-all duration-500">
                    <img src={match.avatar} className="w-full h-full rounded-full object-cover border-2 border-[#000000]" alt="Avatar" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-black rounded-full flex items-center justify-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${isUserOnline(match.id) ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-base text-gray-200 group-hover:text-white transition-colors truncate">{match.realName || match.anonymousId}</h3>
                    <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">{lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate pr-4 ${isUnread ? 'text-white font-medium' : 'text-gray-500 group-hover:text-gray-400'}`}>
                      {lastMsg ? <>{lastMsg.senderId === currentUser?.id && <span className="text-neon mr-1">You:</span>}{lastMsg.text}</> : <span className="text-neon italic">New match! Say hello 👋</span>}
                    </p>
                    {isUnread && <div className="w-2 h-2 bg-neon rounded-full shadow-[0_0_10px_#ff007f]"></div>}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-700 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hidden md:block" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};