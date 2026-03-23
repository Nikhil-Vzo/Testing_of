import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { AmisEvent, AmisPost, EventCategory, AmisPoll } from './types';

export function useAmisEvents(category?: EventCategory | 'all', search?: string) {
  const [events, setEvents] = useState<AmisEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('amis_events').select('*');

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (search && search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    const { data, error } = await query.order('is_trending', { ascending: false }).order('name');

    if (!error && data) {
      // Fetch aggregate counts for each event
      const eventIds = data.map((e: any) => e.id);

      const [checkinsRes, reactionsRes, postsRes] = await Promise.all([
        supabase.from('amis_checkins').select('event_id').in('event_id', eventIds),
        supabase.from('amis_reactions').select('event_id').in('event_id', eventIds),
        supabase.from('amis_posts').select('event_id').in('event_id', eventIds),
      ]);

      const checkinCounts: Record<string, number> = {};
      const reactionCounts: Record<string, number> = {};
      const postCounts: Record<string, number> = {};

      (checkinsRes.data || []).forEach((c: any) => {
        checkinCounts[c.event_id] = (checkinCounts[c.event_id] || 0) + 1;
      });
      (reactionsRes.data || []).forEach((r: any) => {
        reactionCounts[r.event_id] = (reactionCounts[r.event_id] || 0) + 1;
      });
      (postsRes.data || []).forEach((p: any) => {
        postCounts[p.event_id] = (postCounts[p.event_id] || 0) + 1;
      });

      setEvents(data.map((e: any) => ({
        ...e,
        checkin_count: checkinCounts[e.id] || 0,
        reaction_count: reactionCounts[e.id] || 0,
        post_count: postCounts[e.id] || 0,
      })));
    }
    setLoading(false);
  }, [category, search]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  return { events, loading, refetch: fetchEvents };
}

export function useAmisEventDetail(eventId: string | undefined) {
  const [event, setEvent] = useState<AmisEvent | null>(null);
  const [posts, setPosts] = useState<AmisPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCheckedIn, setUserCheckedIn] = useState(false);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [checkinCount, setCheckinCount] = useState(0);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});

  const fetchDetail = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const [eventRes, postsRes, checkinsRes, reactionsRes] = await Promise.all([
      supabase.from('amis_events').select('*').eq('id', eventId).single(),
      supabase.from('amis_posts').select('*').eq('event_id', eventId).order('created_at', { ascending: false }),
      supabase.from('amis_checkins').select('*').eq('event_id', eventId),
      supabase.from('amis_reactions').select('*').eq('event_id', eventId),
    ]);

    if (eventRes.data) setEvent(eventRes.data as AmisEvent);
    if (postsRes.data) setPosts(postsRes.data as AmisPost[]);

    const checkins = checkinsRes.data || [];
    setCheckinCount(checkins.length);
    if (user) setUserCheckedIn(checkins.some((c: any) => c.user_id === user.id));

    const reactions = reactionsRes.data || [];
    const counts: Record<string, number> = {};
    reactions.forEach((r: any) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
    setReactionCounts(counts);
    if (user) {
      const userR = reactions.find((r: any) => r.user_id === user.id);
      setUserReaction(userR ? userR.emoji : null);
    }

    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const toggleCheckin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !eventId) return;

    if (userCheckedIn) {
      await supabase.from('amis_checkins').delete().eq('event_id', eventId).eq('user_id', user.id);
    } else {
      await supabase.from('amis_checkins').insert({ event_id: eventId, user_id: user.id });
    }
    fetchDetail();
  };

  const toggleReaction = async (emoji: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !eventId) return;

    if (userReaction === emoji) {
      await supabase.from('amis_reactions').delete().eq('event_id', eventId).eq('user_id', user.id);
    } else if (userReaction) {
      await supabase.from('amis_reactions').update({ emoji }).eq('event_id', eventId).eq('user_id', user.id);
    } else {
      await supabase.from('amis_reactions').insert({ event_id: eventId, user_id: user.id, emoji });
    }
    fetchDetail();
  };

  const addPost = async (content: string, anonymousName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !eventId) return;

    await supabase.from('amis_posts').insert({
      event_id: eventId,
      user_id: user.id,
      content,
      anonymous_name: anonymousName,
    });
    fetchDetail();
  };

  return { event, posts, loading, userCheckedIn, userReaction, checkinCount, reactionCounts, toggleCheckin, toggleReaction, addPost, refetch: fetchDetail };
}

export function useAmisPolls() {
  const [polls, setPolls] = useState<AmisPoll[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPolls = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch active polls & their options
    const { data: pollsData } = await supabase
      .from('amis_polls')
      .select(`
        id, question, is_active, created_at, block_tag, event_id,
        amis_events(name),
        amis_poll_options (id, poll_id, text, vote_count)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (pollsData) {
      if (user) {
        // Fetch user's votes for these polls
        const pollIds = pollsData.map((p: any) => p.id);
        const { data: votesData } = await supabase
          .from('amis_poll_votes')
          .select('*')
          .in('poll_id', pollIds)
          .eq('user_id', user.id);

        const userVotes: Record<string, string> = {};
        (votesData || []).forEach((v: any) => {
          userVotes[v.poll_id] = v.option_id;
        });

        setPolls(pollsData.map((p: any) => ({
          id: p.id,
          question: p.question,
          is_active: p.is_active,
          created_at: p.created_at,
          block_tag: p.block_tag || null,
          event_id: p.event_id || null,
          event_name: p.amis_events?.name || null,
          options: p.amis_poll_options.sort((a: any, b: any) => a.text.localeCompare(b.text)),
          user_voted_option_id: userVotes[p.id] || null
        })));
      } else {
        setPolls(pollsData.map((p: any) => ({
          id: p.id,
          question: p.question,
          is_active: p.is_active,
          created_at: p.created_at,
          block_tag: p.block_tag || null,
          event_id: p.event_id || null,
          event_name: p.amis_events?.name || null,
          options: p.amis_poll_options.sort((a: any, b: any) => a.text.localeCompare(b.text)),
          user_voted_option_id: null
        })));
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPolls(); }, [fetchPolls]);

  const vote = async (pollId: string, optionId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Optimistic update
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId) return p;
      if (p.user_voted_option_id) return p; // Already voted

      return {
        ...p,
        user_voted_option_id: optionId,
        options: p.options.map(opt => 
          opt.id === optionId ? { ...opt, vote_count: opt.vote_count + 1 } : opt
        )
      };
    }));

    await supabase.from('amis_poll_votes').insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: user.id
    });
    // Trigger is handling the option's vote_count increment in DB
  };

  const createPoll = async (question: string, optionTexts: string[], blockTag?: string | null, eventId?: string | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !question.trim() || optionTexts.length < 2) return false;

    // 1. Insert Poll
    const { data: pollData, error: pollError } = await supabase
      .from('amis_polls')
      .insert({ question: question.trim(), user_id: user.id, block_tag: blockTag || null, event_id: eventId || null })
      .select('id')
      .single();

    if (pollError || !pollData) return false;

    // 2. Insert Options
    const optionsToInsert = optionTexts
      .filter(opt => opt.trim() !== '')
      .map(opt => ({ poll_id: pollData.id, text: opt.trim() }));
      
    if (optionsToInsert.length < 2) return false; // Safety check

    const { error: optionsError } = await supabase
      .from('amis_poll_options')
      .insert(optionsToInsert);

    if (optionsError) return false;

    // 3. Refetch to show new poll
    await fetchPolls();
    return true;
  };

  return { polls, loading, vote, createPoll, refetch: fetchPolls };
}
