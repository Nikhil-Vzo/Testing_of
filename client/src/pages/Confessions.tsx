import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Confession } from '../types';
import { ArrowLeft, Image as ImageIcon, Send, Crown, MessageCircle, X, Loader2, SlidersHorizontal, SmilePlus, BarChart2, Ghost } from 'lucide-react';
import { EmojiClickData } from 'emoji-picker-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { analytics } from '../utils/analytics';

type SortOption = 'newest' | 'oldest' | 'popular' | 'discussed';

const REACTIONS = ['❤️', '😂', '🔥', '😮', '😢', '👀'];
const POSTS_PER_PAGE = 10;
const CACHE_KEY = 'otherhalf_confessions_cache';

// --- SKELETON COMPONENT ---
const ConfessionSkeleton = () => (
    <div className="bg-gray-900/30 border border-gray-800/50 rounded-xl p-4 animate-pulse">
        <div className="flex gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-800 rounded-xl" />
            <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-24 bg-gray-800 rounded" />
                <div className="flex justify-between">
                    <div className="h-2 w-16 bg-gray-800/50 rounded" />
                    <div className="h-2 w-12 bg-gray-800/50 rounded" />
                </div>
            </div>
        </div>
        <div className="space-y-2 mb-4">
            <div className="h-2 w-full bg-gray-800/60 rounded" />
            <div className="h-2 w-11/12 bg-gray-800/60 rounded" />
            <div className="h-2 w-4/6 bg-gray-800/60 rounded" />
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-800/50">
            <div className="h-6 w-16 bg-gray-800 rounded-md" />
            <div className="h-6 w-12 bg-gray-800 rounded-md" />
        </div>
    </div>
);

export const Confessions: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [confessions, setConfessions] = useState<Confession[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Initial load state
    const [newText, setNewText] = useState('');
    const [newImage, setNewImage] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const [viewImage, setViewImage] = useState<string | null>(null);

    // Poll State
    const [isPollMode, setIsPollMode] = useState(false);
    const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

    // Sorting State
    const [sortType, setSortType] = useState<SortOption>('newest');
    const [showSortMenu, setShowSortMenu] = useState(false);
    // Comments & Reaction State
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

    // Pagination State
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Ref for realtime
    const expandedCommentsRef = useRef(expandedComments);
    useEffect(() => { expandedCommentsRef.current = expandedComments; }, [expandedComments]);

    // 1. Initial Load (Cache First + Network)
    useEffect(() => {
        if (!currentUser || !supabase) return;

        const init = async () => {
            // A. CACHE FIRST: Load from Session Storage immediately
            try {
                const cached = sessionStorage.getItem(CACHE_KEY);
                if (cached) {
                    setConfessions(JSON.parse(cached));
                    setIsLoading(false); // Show content instantly
                }
            } catch (e) { console.error('Cache read error', e); }

            // B. NETWORK: Fetch fresh data
            // Reset page and hasMore for fresh fetch
            setPage(0);
            setHasMore(true);
            await fetchConfessions(0, true);
        };

        init();

        // --- Supabase Realtime ---
        const channel = supabase.channel('confessions-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'confessions' }, (payload) => {
                const p = payload.new as any;
                if (p.user_id === currentUser.id) return; // Ignore own posts

                const newConfession: Confession = {
                    id: p.id,
                    userId: 'Anonymous',
                    text: p.text || '',
                    imageUrl: p.image_url,
                    timestamp: new Date(p.created_at).getTime(),
                    likes: 0,
                    reactions: {},
                    comments: [],
                    university: p.university,
                    type: p.type as 'text' | 'poll',
                    pollOptions: [],
                    userVote: undefined,
                    userReaction: undefined
                };
                setConfessions(prev => [newConfession, ...prev]);
            })
            // ... (Other handlers kept same as before) ...
            .on('postgres_changes', { event: '*', schema: 'public', table: 'confession_reactions' }, (payload) => {
                const event = payload.eventType;
                const record = (event === 'DELETE' ? payload.old : payload.new) as any;
                const confessionId = record.confession_id;

                setConfessions(prev => prev.map(c => {
                    if (c.id !== confessionId) return c;
                    const newReactions = { ...c.reactions };
                    let newLikes = c.likes;
                    let newUserReaction = c.userReaction;

                    if (event === 'INSERT') {
                        newReactions[record.emoji] = (newReactions[record.emoji] || 0) + 1;
                        newLikes += 1;
                        if (record.user_id === currentUser.id) newUserReaction = record.emoji;
                    } else if (event === 'DELETE') {
                        newReactions[record.emoji] = Math.max(0, (newReactions[record.emoji] || 1) - 1);
                        newLikes = Math.max(0, newLikes - 1);
                        if (record.user_id === currentUser.id) newUserReaction = undefined;
                    } else if (event === 'UPDATE') {
                        const oldEmoji = (payload.old as any)?.emoji;
                        if (oldEmoji) newReactions[oldEmoji] = Math.max(0, (newReactions[oldEmoji] || 1) - 1);
                        newReactions[record.emoji] = (newReactions[record.emoji] || 0) + 1;
                        if (record.user_id === currentUser.id) newUserReaction = record.emoji;
                    }
                    return { ...c, reactions: newReactions, likes: newLikes, userReaction: newUserReaction };
                }));
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'confession_comments' }, async (payload) => {
                const record = payload.new as any;
                const confessionId = record.confession_id;
                setConfessions(prev => prev.map(c => {
                    if (c.id !== confessionId) return c;
                    if (expandedCommentsRef.current[confessionId]) {
                        const newComment = {
                            id: record.id,
                            userId: record.user_id === currentUser.id ? 'You' : 'Anonymous',
                            text: record.text,
                            timestamp: new Date(record.created_at).getTime()
                        };
                        if (c.comments?.some(com => com.id === record.id)) return c;
                        return { ...c, comments: [...(c.comments || []), newComment] };
                    }
                    return { ...c, comments: [...(c.comments || []), { id: record.id, userId: '', text: '', timestamp: 0 }] };
                }));
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentUser, sortType]);


    // 2. Fetch Logic
    const fetchConfessions = async (pageIndex: number, reset = false) => {
        if (!currentUser || !supabase) return;
        if (pageIndex > 0) setIsLoadingMore(true);

        const from = pageIndex * POSTS_PER_PAGE;
        const to = from + POSTS_PER_PAGE - 1;

        let query = supabase
            .from('confessions')
            .select(`*, poll_options (*), confession_reactions (emoji, user_id), confession_comments (id)`)
            .range(from, to);

        if (sortType === 'newest') query = query.order('created_at', { ascending: false });
        else if (sortType === 'oldest') query = query.order('created_at', { ascending: true });
        else query = query.order('created_at', { ascending: false });

        const { data: posts, error } = await query;

        if (error) {
            console.error('Error:', error);
            setIsLoading(false);
            setIsLoadingMore(false);
            return;
        }

        if (posts.length < POSTS_PER_PAGE) setHasMore(false);

        // Fetch votes
        const postIds = posts.map(p => p.id);
        const { data: myVotes } = await supabase.from('poll_votes').select('confession_id, option_id').in('confession_id', postIds).eq('user_id', currentUser.id);
        const myVoteMap = new Map();
        myVotes?.forEach(v => myVoteMap.set(v.confession_id, v.option_id));

        const formatted: Confession[] = posts.map((p: any) => {
            const reactionCounts: Record<string, number> = {};
            p.confession_reactions.forEach((r: any) => { reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1; });

            return {
                id: p.id, userId: 'Anonymous', text: p.text || '', imageUrl: p.image_url,
                timestamp: new Date(p.created_at).getTime(),
                likes: p.confession_reactions.length, reactions: reactionCounts, comments: p.confession_comments || [],
                university: p.university, type: p.type as 'text' | 'poll',
                pollOptions: p.poll_options?.map((opt: any) => ({ id: opt.id, text: opt.text, votes: opt.vote_count })),
                userVote: myVoteMap.get(p.id),
                userReaction: p.confession_reactions.find((r: any) => r.user_id === currentUser.id)?.emoji
            };
        });

        if (reset) {
            setConfessions(formatted);
            setIsLoading(false);
            // Update Cache (Safely)
            try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(formatted)); } catch (e) { /* Ignore quota errors */ }
        } else {
            setConfessions(prev => {
                const existing = new Set(prev.map(c => c.id));
                return [...prev, ...formatted.filter(c => !existing.has(c.id))];
            });
        }
        setIsLoadingMore(false);
    };

    // 3. Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchConfessions(nextPage, false);
            }
        }, { threshold: 1.0 });
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, isLoading, page]);


    // --- Handlers (Preserved from existing file) ---

    const handleReactionClick = (e: React.MouseEvent, id: string) => {
        if (activeReactionMenu === id) { setActiveReactionMenu(null); setMenuPosition(null); }
        else {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            let left = rect.left; if (left + 300 > window.innerWidth) left = window.innerWidth - 310; if (left < 10) left = 10;
            setMenuPosition({ top: rect.bottom + 5, left }); setActiveReactionMenu(id);
        }
    };

    const handlePost = async () => {
        if (!isPollMode && !newText.trim() && !newImage) return;
        if (isPollMode && (pollOptions.filter(o => o.trim()).length < 2 || !newText.trim())) return;
        if (!currentUser || !supabase) return;

        setIsPosting(true);

        try {
            // Check limits
            const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
            const { data: dailyPosts, error: limitError } = await supabase
                .from('confessions').select('type, image_url').eq('user_id', currentUser.id).gte('created_at', startOfDay.toISOString());

            if (limitError) throw limitError;
            const totalPosts = dailyPosts?.length || 0;
            const totalPolls = dailyPosts?.filter(p => p.type === 'poll').length || 0;
            const totalImages = dailyPosts?.filter(p => p.image_url).length || 0;

            if (totalPosts >= 3) { alert("Daily limit reached (3 posts)!"); setIsPosting(false); return; }
            if (isPollMode && totalPolls >= 1) { alert("Only 1 poll per day allowed!"); setIsPosting(false); return; }
            if (!isPollMode && newImage && totalImages >= 1) { alert("Only 1 image per day allowed!"); setIsPosting(false); return; }

            // Insert
            const { data: post, error } = await supabase
                .from('confessions')
                .insert({
                    user_id: currentUser.id, university: currentUser.university,
                    text: newText, image_url: newImage, type: isPollMode ? 'poll' : 'text'
                })
                .select().single();

            if (error) throw error;

            if (isPollMode && post) {
                const optionsToInsert = pollOptions.filter(o => o.trim()).map(text => ({ confession_id: post.id, text }));
                await supabase.from('poll_options').insert(optionsToInsert);
            }

            analytics.confessionPost(isPollMode ? 'poll' : newImage ? 'image' : 'text');
            setNewText(''); setNewImage(null); setIsPollMode(false); setPollOptions(['', '']);

            setPage(0);
            fetchConfessions(0, true);

        } catch (err) { console.error('Post error:', err); alert('Failed to post.'); } finally { setIsPosting(false); }
    };

    const handlePollVote = async (confessionId: string, optionId: string) => {
        if (!currentUser || !supabase) return;
        setConfessions(prev => prev.map(c => {
            if (c.id !== confessionId || !c.pollOptions) return c;
            if (c.userVote) return c;
            return {
                ...c, userVote: optionId,
                pollOptions: c.pollOptions.map(opt => opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt)
            };
        }));
        try { await supabase.from('poll_votes').insert({ confession_id: confessionId, option_id: optionId, user_id: currentUser.id }); } catch (err) { console.error(err); fetchConfessions(0, true); }
    };

    const handleReaction = async (id: string, emoji: string) => {
        if (!currentUser) return;
        setActiveReactionMenu(null); setMenuPosition(null);
        const confession = confessions.find(c => c.id === id);
        const previousReaction = confession?.userReaction;

        setConfessions(prev => prev.map(c => {
            if (c.id !== id) return c;
            const newReactions = { ...c.reactions };
            if (previousReaction) newReactions[previousReaction] = Math.max(0, (newReactions[previousReaction] || 1) - 1);
            let newUserReaction: string | undefined = emoji;
            if (previousReaction === emoji) newUserReaction = undefined;
            else newReactions[emoji] = (newReactions[emoji] || 0) + 1;
            return { ...c, userReaction: newUserReaction, reactions: newReactions, likes: Object.values(newReactions).reduce((a, b) => a + b, 0) };
        }));

        try {
            if (previousReaction === emoji) { await supabase.from('confession_reactions').delete().eq('confession_id', id).eq('user_id', currentUser.id); }
            else { analytics.confessionReact(emoji); await supabase.from('confession_reactions').upsert({ confession_id: id, user_id: currentUser.id, emoji }, { onConflict: 'confession_id,user_id' }); }
        } catch (err) { console.error(err); }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { const reader = new FileReader(); reader.onloadend = () => setNewImage(reader.result as string); reader.readAsDataURL(file); }
    };

    const toggleComments = async (id: string) => {
        const isExpanding = !expandedComments[id];
        setExpandedComments(prev => ({ ...prev, [id]: isExpanding }));
        if (isExpanding) {
            const { data } = await supabase!
                .from('confession_comments').select(`id, text, created_at, user_id, profiles(anonymous_id)`).eq('confession_id', id).order('created_at', { ascending: true });
            if (data) {
                setConfessions(prev => prev.map(c => {
                    if (c.id !== id) return c;
                    return {
                        ...c, comments: data.map((com: any) => ({
                            id: com.id, userId: com.profiles?.anonymous_id || 'Anonymous', text: com.text, timestamp: new Date(com.created_at).getTime()
                        }))
                    };
                }));
            }
        }
    };

    const handleCommentSubmit = async (confessionId: string) => {
        const text = commentInputs[confessionId];
        if (!text?.trim() || !currentUser) return;
        try {
            await supabase!.from('confession_comments').insert({ confession_id: confessionId, user_id: currentUser.id, text: text.trim() });
            setCommentInputs(prev => ({ ...prev, [confessionId]: '' }));
            toggleComments(confessionId);
        } catch (err) { console.error(err); }
    };

    const isAmityStudent = currentUser?.university?.toLowerCase().includes('amity');

    if (!isAmityStudent) {
        return (
            <div className="h-full bg-transparent text-white flex flex-col relative overflow-hidden">
                <div className="p-4 border-b border-gray-900 flex items-center justify-between bg-black z-20 shrink-0">
                    <button onClick={() => navigate('/home')} className="p-2 hover:bg-gray-800 rounded-full transition-colors hidden md:block"><ArrowLeft className="w-6 h-6 text-gray-400" /></button>
                    <div><h1 className="text-xl font-black uppercase">Campus Confessions</h1></div>
                </div>
                <div className="flex-1 flex items-center justify-center"><p className="text-white">Amity Only</p></div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-transparent text-white flex flex-col relative overflow-hidden font-sans">
            {/* Header */}
            <div className="flex-none p-4 border-b border-gray-800/50 bg-black/20 backdrop-blur-md z-40 sticky top-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/home')} className="p-2 hover:bg-gray-800 rounded-full hidden md:block"><ArrowLeft className="w-6 h-6 text-gray-400" /></button>
                    <div><h1 className="text-xl font-bold uppercase tracking-tight">Campus Confessions</h1><p className="text-xs text-gray-500 font-mono">Amity University</p></div>
                </div>
                {/* Sort Menu */}
                <div className="relative">
                    <button onClick={() => setShowSortMenu(!showSortMenu)} className={`p-2 rounded-full transition-colors ${showSortMenu ? 'bg-white text-black' : 'bg-gray-900 text-gray-400'}`}><SlidersHorizontal className="w-5 h-5" /></button>
                    {showSortMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)}></div>
                            <div className="absolute right-0 top-12 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-20">
                                {['newest', 'oldest'].map((type) => (
                                    <button key={type} onClick={() => { setSortType(type as SortOption); setShowSortMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 capitalize">{type}</button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 pb-32 relative z-10">
                {isLoading && (
                    <>
                        <ConfessionSkeleton />
                        <ConfessionSkeleton />
                        <ConfessionSkeleton />
                    </>
                )}

                {!isLoading && confessions.length === 0 && (
                    <div className="text-center py-20">
                        <Ghost className="w-10 h-10 text-gray-600 mx-auto mb-6" />
                        <h2 className="text-lg font-bold text-gray-300">It's quiet here...</h2>
                    </div>
                )}

                {confessions.map(conf => (
                    <div key={conf.id} className={`bg-gray-900/30 backdrop-blur-md border rounded-xl p-4 ${conf.id === '46c46dcc-ad75-487d-b5a4-70b03081c222' ? 'border-neon/50' : 'border-gray-800/50'}`}>
                        {/* Card Content Matches User's + Existing */}
                        <div className="flex gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${conf.id === '46c46dcc-ad75-487d-b5a4-70b03081c222' ? 'bg-neon text-white' : 'bg-gray-900 border border-gray-800'}`}>
                                {conf.id === '46c46dcc-ad75-487d-b5a4-70b03081c222' ? <Crown className="w-5 h-5" /> : <span className="text-sm font-bold text-gray-500">?</span>}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${conf.id === '46c46dcc-ad75-487d-b5a4-70b03081c222' ? 'text-neon' : 'text-gray-300'}`}>{conf.id === '46c46dcc-ad75-487d-b5a4-70b03081c222' ? 'Team Other Half' : conf.userId}</span>
                                </div>
                                <div className="flex justify-between mt-0.5">
                                    <p className="text-[10px] text-gray-600 uppercase font-bold">{conf.university}</p>
                                    <span className="text-[10px] text-gray-600 font-mono">{new Date(conf.timestamp).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{conf.text}</p>
                        {conf.imageUrl && <div className="mb-4 rounded-lg overflow-hidden border border-gray-900 bg-black aspect-video" onClick={() => setViewImage(conf.imageUrl || null)}><img src={conf.imageUrl} className="w-full h-full object-cover" /></div>}

                        {conf.type === 'poll' && conf.pollOptions && (
                            <div className="mb-4 space-y-2 bg-gray-900/30 p-3 rounded-lg border border-gray-900">
                                {conf.pollOptions.map(option => {
                                    const total = conf.pollOptions?.reduce((a, b) => a + b.votes, 0) || 0;
                                    const pct = total > 0 ? Math.round((option.votes / total) * 100) : 0;
                                    return (
                                        <button key={option.id} onClick={() => handlePollVote(conf.id, option.id)} disabled={!!conf.userVote} className="w-full relative h-9 rounded border border-gray-800 overflow-hidden">
                                            <div className="absolute top-0 left-0 h-full bg-gray-800" style={{ width: `${pct}%` }} />
                                            <div className="absolute inset-0 flex items-center justify-between px-3 z-10"><span className="text-xs font-medium text-gray-400">{option.text}</span>{conf.userVote && <span className="text-[10px] font-bold text-gray-500">{pct}%</span>}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex flex-col gap-2 border-t border-gray-900 pt-3">
                            {conf.reactions && Object.values(conf.reactions).some(v => v > 0) && (
                                <div className="flex flex-wrap gap-1.5 mb-2">{Object.entries(conf.reactions).map(([e, c]) => c > 0 && <span key={e} className="inline-flex items-center gap-1 bg-gray-900 text-[10px] px-2 py-0.5 rounded-full text-gray-400 border border-gray-800">{e} <b>{c}</b></span>)}</div>
                            )}
                            <div className="flex items-center gap-3">
                                <button onClick={(e) => handleReactionClick(e, conf.id)} className="flex items-center gap-2 text-gray-500 hover:text-white text-xs px-2 py-1 rounded-md hover:bg-gray-900"><SmilePlus className="w-4 h-4" /> React</button>
                                <button onClick={() => toggleComments(conf.id)} className="flex items-center gap-2 text-gray-500 hover:text-blue-400 text-xs px-2 py-1 rounded-md hover:bg-gray-900"><MessageCircle className="w-4 h-4" /> {conf.comments?.length || 0}</button>
                            </div>
                        </div>

                        {expandedComments[conf.id] && (
                            <div className="mt-3 pt-3 border-t border-gray-900">
                                <div className="space-y-2 mb-3 max-h-96 overflow-y-auto">
                                    {conf.comments?.map(c => <div key={c.id} className="bg-gray-900/40 p-2 rounded-lg"><div className="flex justify-between mb-1"><span className="text-[10px] font-bold text-gray-500">{c.userId}</span></div><p className="text-xs text-gray-300">{c.text}</p></div>)}
                                </div>
                                <div className="flex gap-2"><input className="flex-1 bg-black border border-gray-800 rounded-lg px-3 py-2 text-xs text-white" placeholder="Comment..." value={commentInputs[conf.id] || ''} onChange={e => setCommentInputs(p => ({ ...p, [conf.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleCommentSubmit(conf.id)} /><button onClick={() => handleCommentSubmit(conf.id)} className="p-2 bg-gray-800 text-white rounded-lg"><Send className="w-3.5 h-3.5" /></button></div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Loading More Spinner */}
                {hasMore && <div ref={observerTarget} className="flex justify-center p-4"><Loader2 className="w-6 h-6 text-neon animate-spin" /></div>}
            </div>

            {/* Input Area */}
            <div className="fixed bottom-20 md:bottom-0 left-0 right-0 z-30 p-3 pointer-events-none flex justify-center w-full bg-gradient-to-t from-black via-black to-transparent pb-6 pt-10">
                <div className="max-w-xl w-full pointer-events-auto">
                    <div className="bg-black border border-gray-800 rounded-full p-2 shadow-2xl flex items-center gap-2">
                        {newImage && !isPollMode && <div className="relative w-10 h-10 ml-1"><img src={newImage} className="w-full h-full object-cover rounded-lg" /><button onClick={() => setNewImage(null)} className="absolute -top-1 -right-1 bg-gray-800 rounded-full p-0.5"><X className="w-2.5 h-2.5" /></button></div>}
                        <button onClick={() => { setIsPollMode(!isPollMode); setNewImage(null); }} className={`p-2 rounded-full ${isPollMode ? 'text-white bg-gray-900' : 'text-gray-500'}`}><BarChart2 className="w-5 h-5" /></button>
                        <div className="h-4 w-px bg-gray-800"></div>
                        <input id="confession-image-input" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <button onClick={() => document.getElementById('confession-image-input')?.click()} disabled={isPollMode} className="p-2 text-gray-500"><ImageIcon className="w-5 h-5" /></button>
                        <input value={newText} onChange={e => setNewText(e.target.value)} placeholder={isPollMode ? "Poll question..." : "Confess anonymously..."} className="flex-1 bg-transparent text-white px-2 outline-none text-xs font-medium" />
                        <button onClick={handlePost} disabled={isPosting || (!newText.trim() && !newImage)} className="p-2.5 bg-white rounded-full text-black hover:bg-gray-200">{isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button>
                    </div>
                    {isPollMode && (
                        <div className="mt-2 bg-black border border-gray-800 rounded-xl p-3 mx-2">
                            {pollOptions.map((opt, i) => <input key={i} className="w-full bg-gray-900 border border-gray-800 text-white text-xs px-3 py-2 rounded-lg mb-2" placeholder={`Option ${i + 1}`} value={opt} onChange={e => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }} />)}
                            {pollOptions.length < 4 && <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-[10px] text-gray-500 font-bold w-full text-center">+ Add Option</button>}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {activeReactionMenu && (<><div className="fixed inset-0 z-40 bg-transparent" onClick={() => { setActiveReactionMenu(null); setMenuPosition(null); }}></div><div className="fixed z-50 bg-black/80 backdrop-blur-md border border-gray-800 rounded-2xl p-2" style={menuPosition ? { top: menuPosition.top, left: menuPosition.left } : {}}><div className="flex gap-1">{REACTIONS.map(emoji => <button key={emoji} onClick={() => handleReaction(activeReactionMenu, emoji)} className="text-2xl hover:scale-125 transition-transform p-2">{emoji}</button>)}</div></div></>)}
            {viewImage && <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4" onClick={() => setViewImage(null)}><img src={viewImage} className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} /></div>}
        </div>
    );
};
