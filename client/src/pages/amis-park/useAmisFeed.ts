import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';

export interface FeedPost {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  block_tag: string | null;
  event_id: string | null;
  event_name?: string;
  created_at: string;
  reactions: Record<string, number>;
  userReaction?: string;
  comments: FeedComment[];
  commentCount: number;
}

export interface FeedComment {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  anonymous_id?: string;
}

const REACTIONS = ['🔥', '❤️', '😂', '🤯', '💀', '😱'];
const POSTS_PER_PAGE = 15;

export function useAmisFeed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const expandedRef = useRef<Record<string, boolean>>({});

  const fetchPosts = useCallback(async (pageIndex: number, reset = false) => {
    if (!supabase) return;
    if (pageIndex > 0) setLoadingMore(true);
    else if (reset) setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    const from = pageIndex * POSTS_PER_PAGE;
    const to = from + POSTS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from('amis_feed_posts')
      .select(`
        *,
        amis_events(name),
        amis_feed_reactions(emoji, user_id),
        amis_feed_comments(id, text, created_at, user_id),
        comment_count:amis_feed_comments(count)
      `)
      .order('created_at', { ascending: false })
      .order('created_at', { foreignTable: 'amis_feed_comments', ascending: false })
      .limit(3, { foreignTable: 'amis_feed_comments' })
      .range(from, to);

    if (error) {
      console.error('Feed fetch error:', error);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (!data || data.length < POSTS_PER_PAGE) setHasMore(false);

    const formatted: FeedPost[] = (data || []).map((p: any) => {
      const reactionCounts: Record<string, number> = {};
      (p.amis_feed_reactions || []).forEach((r: any) => {
        reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
      });
      const userReaction = user
        ? (p.amis_feed_reactions || []).find((r: any) => r.user_id === user.id)?.emoji
        : undefined;

      return {
        id: p.id,
        user_id: p.user_id,
        content: p.content,
        image_url: p.image_url,
        block_tag: p.block_tag,
        event_id: p.event_id,
        event_name: p.amis_events?.name || null,
        created_at: p.created_at,
        reactions: reactionCounts,
        userReaction,
        comments: (p.amis_feed_comments || []).map((c: any) => ({
          id: c.id,
          user_id: c.user_id,
          text: c.text,
          created_at: c.created_at,
        })),
        commentCount: p.comment_count?.[0]?.count || p.amis_feed_comments?.length || 0,
      };
    });

    if (reset) {
      setPosts(formatted);
    } else {
      setPosts(prev => {
        const existing = new Set(prev.map(p => p.id));
        return [...prev, ...formatted.filter(p => !existing.has(p.id))];
      });
    }

    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchPosts(0, true);

    // Realtime subscription
    if (!supabase) return;
    const channel = supabase.channel('amis-feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'amis_feed_posts' }, async () => {
        // Refresh to get the new post with all joins
        fetchPosts(0, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'amis_feed_reactions' }, () => {
        fetchPosts(0, true);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'amis_feed_comments' }, () => {
        fetchPosts(0, true);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, false);
    }
  }, [hasMore, loadingMore, loading, page, fetchPosts]);

  const createPost = async (content: string, imageUrl: string | null, blockTag: string | null, eventId: string | null) => {
    if (!supabase) return false;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Optimistic add
    const optimisticId = 'opt-' + Date.now();
    const optimisticPost: FeedPost = {
      id: optimisticId,
      user_id: user.id,
      content,
      image_url: imageUrl,
      block_tag: blockTag,
      event_id: eventId,
      created_at: new Date().toISOString(),
      reactions: {},
      comments: [],
      commentCount: 0,
    };
    setPosts(prev => [optimisticPost, ...prev]);

    const { data, error } = await supabase
      .from('amis_feed_posts')
      .insert({ user_id: user.id, content, image_url: imageUrl, block_tag: blockTag, event_id: eventId })
      .select('id')
      .single();

    if (error) {
      console.error('Create post error:', error);
      setPosts(prev => prev.filter(p => p.id !== optimisticId));
      return false;
    }

    // Replace optimistic with real ID
    setPosts(prev => prev.map(p => p.id === optimisticId ? { ...p, id: data.id } : p));
    return true;
  };

  const toggleReaction = async (postId: string, emoji: string) => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    const previousReaction = post?.userReaction;

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const newReactions = { ...p.reactions };
      if (previousReaction) newReactions[previousReaction] = Math.max(0, (newReactions[previousReaction] || 1) - 1);
      let newUserReaction: string | undefined = emoji;
      if (previousReaction === emoji) {
        newUserReaction = undefined;
      } else {
        newReactions[emoji] = (newReactions[emoji] || 0) + 1;
      }
      return { ...p, userReaction: newUserReaction, reactions: newReactions };
    }));

    try {
      if (previousReaction === emoji) {
        await supabase.from('amis_feed_reactions').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('amis_feed_reactions').upsert(
          { post_id: postId, user_id: user.id, emoji },
          { onConflict: 'post_id,user_id' }
        );
      }
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  const addComment = async (postId: string, text: string) => {
    if (!supabase || !text.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Optimistic
    const optComment: FeedComment = { id: 'opt-' + Date.now(), user_id: user.id, text: text.trim(), created_at: new Date().toISOString() };
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return { ...p, comments: [...p.comments, optComment], commentCount: p.commentCount + 1 };
    }));

    try {
      const { data } = await supabase.from('amis_feed_comments')
        .insert({ post_id: postId, user_id: user.id, text: text.trim() })
        .select('id')
        .single();

      if (data?.id) {
        setPosts(prev => prev.map(p => {
          if (p.id !== postId) return p;
          return { ...p, comments: p.comments.map(c => c.id === optComment.id ? { ...c, id: data.id } : c) };
        }));
      }
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const fetchFullComments = async (postId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from('amis_feed_comments')
      .select('id, text, created_at, user_id')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (data) {
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: data.map((c: any) => ({
            id: c.id,
            user_id: c.user_id,
            text: c.text,
            created_at: c.created_at,
          })),
        };
      }));
    }
  };

  return { posts, loading, loadingMore, hasMore, loadMore, createPost, toggleReaction, addComment, fetchFullComments, refetch: () => fetchPosts(0, true) };
}

export { REACTIONS };
