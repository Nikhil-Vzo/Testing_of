-- Optimizing Chat Performance
-- Date: 2026-02-16

-- Index for fetching messages by match_id (used in Chat.tsx)
-- This covers: .eq('match_id', matchId).order('created_at', { ascending: false })
CREATE INDEX IF NOT EXISTS idx_messages_match_created 
ON public.messages (match_id, created_at DESC);

-- Index for fetching matches (used in Matches.tsx)
-- This covers: .or(`user_a.eq.${currentUser.id},user_b.eq.${currentUser.id}`)
-- Note: OR queries are hard to index perfectly, but separate indexes on user_a and user_b help
CREATE INDEX IF NOT EXISTS idx_matches_user_a ON public.matches (user_a);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON public.matches (user_b);
