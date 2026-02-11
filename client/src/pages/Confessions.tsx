import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Confession } from '../types'; // Ensure types are updated if needed
import { NeonButton } from '../components/Common';
import { ArrowLeft, Image as ImageIcon, Send, Heart, Crown, MessageCircle, X, Loader2, ChevronDown, ChevronUp, ZoomIn, SlidersHorizontal, SmilePlus, Plus, BarChart2, Ghost } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Use real DB

type SortOption = 'newest' | 'oldest' | 'popular' | 'discussed';

const REACTIONS = ['❤️', '😂', '🔥', '😮', '😢', '👀'];

export const Confessions: React.FC = () => {
    const { currentUser, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [confessions, setConfessions] = useState<Confession[]>([]);
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

    // Comments State
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

    // Reaction State
    const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

    // Fetch Confessions from Supabase
    useEffect(() => {
        if (!currentUser || !supabase) return;
        fetchConfessions();
    }, [currentUser]);

    const fetchConfessions = async () => {
        if (!currentUser || !supabase) return;

        // 1. Fetch Basic Confessions
        const { data: posts, error } = await supabase
            .from('confessions')
            .select(`
                *,
                poll_options (*),
                confession_reactions (emoji, user_id),
                confession_comments (id)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching confessions:', error);
            return;
        }

        // 2. Fetch User's Poll Votes (to see if I already voted)
        const { data: myVotes } = await supabase
            .from('poll_votes')
            .select('confession_id, option_id')
            .eq('user_id', currentUser.id);

        const myVoteMap = new Map();
        myVotes?.forEach(v => myVoteMap.set(v.confession_id, v.option_id));

        // 3. Transform Data to match App Types
        const formatted: Confession[] = posts.map((p: any) => {
            // Aggregate reactions
            const reactionCounts: Record<string, number> = {};
            p.confession_reactions.forEach((r: any) => {
                reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
            });

            return {
                id: p.id,
                userId: 'Anonymous', // Keep strictly anon for display
                text: p.text || '',
                imageUrl: p.image_url,
                timestamp: new Date(p.created_at).getTime(),
                likes: p.confession_reactions.length,
                reactions: reactionCounts,
                comments: p.confession_comments || [], // IDs only for count, fetch full on expand
                university: p.university,
                type: p.type as 'text' | 'poll',
                pollOptions: p.poll_options?.map((opt: any) => ({
                    id: opt.id,
                    text: opt.text,
                    votes: opt.vote_count
                })),
                userVote: myVoteMap.get(p.id)
            };
        });

        setConfessions(formatted);
    };

    // --- Dynamic Sorting ---
    const getSortedConfessions = () => {
        const sorted = [...confessions];
        switch (sortType) {
            case 'newest': return sorted.sort((a, b) => b.timestamp - a.timestamp);
            case 'oldest': return sorted.sort((a, b) => a.timestamp - b.timestamp);
            case 'popular': return sorted.sort((a, b) => b.likes - a.likes);
            case 'discussed': return sorted.sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0));
            default: return sorted;
        }
    };

    // --- Handlers ---

    const handleReactionClick = (e: React.MouseEvent, id: string) => {
        if (activeReactionMenu === id) {
            setActiveReactionMenu(null);
            setMenuPosition(null);
        } else {
            if (window.innerWidth >= 768) {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                let top = rect.top - 400 - 10;
                if (rect.top < 400) top = rect.bottom + 10;

                let left = rect.left;
                if (left + 320 > window.innerWidth) left = window.innerWidth - 340;

                setMenuPosition({ top, left });
            } else {
                setMenuPosition(null);
            }
            setActiveReactionMenu(id);
        }
    };

    const handlePost = async () => {
        if (!isPollMode && !newText.trim() && !newImage) return;
        if (isPollMode && (pollOptions.filter(o => o.trim()).length < 2 || !newText.trim())) return;
        if (!currentUser || !supabase) return;

        setIsPosting(true);

        try {
            // 0. CHECK RATE LIMITS
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const { data: dailyPosts, error: limitError } = await supabase
                .from('confessions')
                .select('type, image_url')
                .eq('user_id', currentUser.id)
                .gte('created_at', startOfDay.toISOString());

            if (limitError) throw limitError;

            const totalPosts = dailyPosts?.length || 0;
            const totalPolls = dailyPosts?.filter(p => p.type === 'poll').length || 0;
            const totalImages = dailyPosts?.filter(p => p.image_url).length || 0;

            if (totalPosts >= 3) {
                alert("You've reached your daily limit of 3 confessions!");
                setIsPosting(false);
                return;
            }

            if (isPollMode && totalPolls >= 1) {
                alert("You can only post 1 poll per day!");
                setIsPosting(false);
                return;
            }

            if (!isPollMode && newImage && totalImages >= 1) {
                alert("You can only post 1 image per day!");
                setIsPosting(false);
                return;
            }

            // 1. Insert Confession
            const { data: post, error } = await supabase
                .from('confessions')
                .insert({
                    user_id: currentUser.id,
                    university: currentUser.university,
                    text: newText,
                    image_url: newImage, // In prod, upload to Storage and get URL
                    type: isPollMode ? 'poll' : 'text'
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Insert Poll Options (if poll)
            if (isPollMode && post) {
                const optionsToInsert = pollOptions
                    .filter(o => o.trim())
                    .map(text => ({
                        confession_id: post.id,
                        text: text
                    }));

                await supabase.from('poll_options').insert(optionsToInsert);
            }

            // 3. Reset & Refresh
            setNewText('');
            setNewImage(null);
            setIsPollMode(false);
            setPollOptions(['', '']);
            await fetchConfessions();
            setSortType('newest');

        } catch (err) {
            console.error('Post error:', err);
            alert('Failed to post confession.');
        } finally {
            setIsPosting(false);
        }
    };

    const handlePollVote = async (confessionId: string, optionId: string) => {
        if (!currentUser || !supabase) return;

        // Optimistic Update
        setConfessions(prev => prev.map(c => {
            if (c.id !== confessionId || !c.pollOptions) return c;
            if (c.userVote) return c;
            return {
                ...c,
                userVote: optionId,
                pollOptions: c.pollOptions.map(opt =>
                    opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
                )
            };
        }));

        // DB Update
        try {
            const { error } = await supabase.from('poll_votes').insert({
                confession_id: confessionId,
                option_id: optionId,
                user_id: currentUser.id
            });
            if (error) throw error;
        } catch (err) {
            console.error('Vote error:', err);
            fetchConfessions(); // Revert on error
        }
    };

    const handleReaction = async (id: string, emoji: string) => {
        setActiveReactionMenu(null);
        setMenuPosition(null);

        // DB Insert
        try {
            await supabase.from('confession_reactions').insert({
                confession_id: id,
                user_id: currentUser!.id,
                emoji: emoji
            });
            fetchConfessions();
        } catch (err: any) {
            // Ignore unique violation (user reacted same emoji twice)
            if (err.code !== '23505') console.error('React error:', err);
        }
    };

    const handleExtendedReaction = (id: string, emojiData: EmojiClickData) => {
        handleReaction(id, emojiData.emoji);
    };

    const handleImageClick = () => {
        document.getElementById('confession-image-input')?.click();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Pinned OthrHalff welcome confession (always shown at top)
    const othrhalffPost: Confession = {
        id: 'othrhalff-welcome',
        userId: 'OthrHalff Team',
        text: 'Hey, thanks for using our services! 💜 We will be soon expanding into other colleges too. Stay tuned and keep confessing! 🚀',
        timestamp: Date.now(),
        likes: 0,
        reactions: {},
        comments: [],
        university: 'OthrHalff',
        type: 'text'
    };

    // Load comments when expanded
    const toggleComments = async (id: string) => {
        const isExpanding = !expandedComments[id];
        setExpandedComments(prev => ({ ...prev, [id]: isExpanding }));

        if (isExpanding) {
            // Fetch real comments
            const { data } = await supabase!
                .from('confession_comments')
                .select(`id, text, created_at, user_id, profiles(anonymous_id)`)
                .eq('confession_id', id)
                .order('created_at', { ascending: true });

            if (data) {
                setConfessions(prev => prev.map(c => {
                    if (c.id !== id) return c;
                    return {
                        ...c,
                        comments: data.map((com: any) => ({
                            id: com.id,
                            userId: com.profiles?.anonymous_id || 'Anonymous',
                            text: com.text,
                            timestamp: new Date(com.created_at).getTime()
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
            await supabase!.from('confession_comments').insert({
                confession_id: confessionId,
                user_id: currentUser.id,
                text: text.trim()
            });

            setCommentInputs(prev => ({ ...prev, [confessionId]: '' }));
            toggleComments(confessionId); // Refresh comments
        } catch (err) {
            console.error('Comment error:', err);
        }
    };

    const sortedConfessions = getSortedConfessions();

    // Amity-only gate
    const isAmityStudent = currentUser?.university?.toLowerCase().includes('amity');

    if (!isAmityStudent) {
        return (
            <div className="h-full bg-transparent text-white flex flex-col relative overflow-hidden">
                <div className="p-4 border-b border-gray-900 flex items-center justify-between bg-black z-20 shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/home')} className="p-2 hover:bg-gray-800 rounded-full transition-colors hidden md:block">
                            <ArrowLeft className="w-6 h-6 text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tight">Campus Confessions</h1>
                            <p className="text-xs text-gray-500 font-mono">Coming Soon</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center px-6">
                    <div className="text-center max-w-md animate-fade-in">
                        <div className="w-20 h-20 bg-neon/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-neon/30">
                            <MessageCircle className="w-10 h-10 text-neon" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-3">Amity Exclusive — For Now</h2>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Campus Confessions is currently available only for <span className="text-neon font-bold">Amity University</span> students.
                            We're working on bringing this to your campus soon!
                        </p>
                        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 mb-6">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Your Campus</p>
                            <p className="text-sm text-gray-300 font-medium">{currentUser?.university || 'Unknown'}</p>
                        </div>
                        <button
                            onClick={() => navigate('/home')}
                            className="px-8 py-3 bg-neon text-white font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,0,127,0.4)]"
                        >
                            Back to Home
                        </button>
                        <p className="text-xs text-gray-600 mt-4">Enrolling other colleges soon 🚀</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-black text-white flex flex-col relative overflow-hidden selection:bg-neon selection:text-white font-sans">

            {/* === ANIMATED BACKGROUND === */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full blur-[100px] bg-gradient-to-r from-neon/10 to-purple-900/10 animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] bg-blue-900/10" />
            </div>

            {/* Header */}
            <div className="flex-none p-4 border-b border-gray-800/60 bg-black/80 backdrop-blur-md flex items-center justify-between z-40 sticky top-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/home')} className="p-2 hover:bg-gray-800 rounded-full transition-colors hidden md:block">
                        <ArrowLeft className="w-6 h-6 text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            Campus Confessions
                        </h1>
                        <p className="text-xs text-gray-500 font-mono truncate max-w-[180px]">Amity University</p>
                    </div>
                </div>

                {/* Sort Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowSortMenu(!showSortMenu)}
                        className={`p-2 rounded-full transition-colors ${showSortMenu ? 'bg-neon text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                        <SlidersHorizontal className="w-5 h-5" />
                    </button>

                    {showSortMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)}></div>
                            <div className="absolute right-0 top-12 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-20 overflow-hidden animate-fade-in">
                                <div className="p-2 space-y-1">
                                    {['newest', 'oldest', 'popular', 'discussed'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => { setSortType(type as SortOption); setShowSortMenu(false); }}
                                            className={`w-full text-left px-4 py-2 rounded-lg text-sm font-bold capitalize ${sortType === type ? 'bg-neon/20 text-neon' : 'text-gray-400 hover:bg-gray-800'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-40 md:pb-32 relative z-10">
                {/* Pinned OthrHalff Welcome Post */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-neon to-purple-600 rounded-[18px] opacity-75 blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-black/80 backdrop-blur-xl border border-gray-800/60 rounded-2xl p-5 shadow-2xl">
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5 text-yellow-500 drop-shadow-md" />
                            <span className="text-[10px] font-black uppercase text-yellow-500 tracking-wider">Official</span>
                        </div>
                        <div className="flex gap-4 mb-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon to-purple-600 p-[1px] shadow-lg shadow-neon/20">
                                <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                                    <Ghost className="w-6 h-6 text-neon" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-black text-white tracking-tight">OthrHalff Team</span>
                                    <div className="bg-neon/10 border border-neon/20 px-1.5 py-0.5 rounded text-[9px] font-bold text-neon uppercase tracking-wider">MOD</div>
                                </div>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">Admin Announcement</p>
                            </div>
                        </div>
                        <p className="text-gray-200 text-sm leading-relaxed mb-4 font-medium">Hey, thanks for using our services! 💜 We will be soon expanding into other colleges too. Stay tuned and keep confessing! 🚀</p>
                        <div className="flex flex-col gap-2 border-t border-gray-800/50 pt-3">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={(e) => handleReactionClick(e, othrhalffPost.id)}
                                    className="flex items-center gap-2 text-gray-400 hover:text-neon transition-all text-xs font-bold group bg-gray-900/50 px-3 py-1.5 rounded-full hover:bg-neon/10 border border-transparent hover:border-neon/20"
                                >
                                    <SmilePlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    <span>React</span>
                                </button>
                                <button
                                    onClick={() => toggleComments(othrhalffPost.id)}
                                    className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-all text-xs font-bold bg-gray-900/50 px-3 py-1.5 rounded-full hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20"
                                >
                                    <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    <span>Comments</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {sortedConfessions.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 bg-gray-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-800 animate-float">
                            <Ghost className="w-10 h-10 text-gray-700" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-300 mb-2">It's quiet in here...</h2>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">No confessions yet. Be the first to break the silence!</p>
                    </div>
                ) : (
                    sortedConfessions.map(conf => (
                        <div key={conf.id} className="group relative">
                            {/* Hover Glow */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon/20 to-blue-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur-sm"></div>

                            <div className="relative bg-gray-900/40 backdrop-blur-md border border-gray-800 hover:border-gray-700/80 rounded-2xl p-5 transition-all duration-300">
                                <div className="flex gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 shadow-inner">
                                        <span className="text-sm font-black text-gray-500">?</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-200 group-hover:text-neon transition-colors">{conf.userId}</span>
                                            <span className="text-[10px] text-gray-600 bg-black/30 px-2 py-0.5 rounded-full border border-gray-800/50">{new Date(conf.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-0.5 w-full truncate">{conf.university}</p>
                                    </div>
                                </div>

                                <p className="text-gray-200 text-sm leading-relaxed mb-4 whitespace-pre-wrap pl-1 border-l-2 border-gray-800 pl-3 group-hover:border-neon/30 transition-colors">{conf.text}</p>

                                {conf.imageUrl && (
                                    <div
                                        className="mb-4 rounded-xl overflow-hidden border border-gray-800 aspect-video cursor-pointer group/img relative bg-black shadow-lg"
                                        onClick={() => setViewImage(conf.imageUrl || null)}
                                    >
                                        <img src={conf.imageUrl} alt="Confession" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-black/40 group-hover/img:bg-black/20 transition-colors flex items-center justify-center backdrop-blur-[1px] group-hover/img:backdrop-blur-none">
                                            <div className="bg-black/50 p-3 rounded-full border border-white/10 backdrop-blur-md group-hover/img:scale-110 transition-transform">
                                                <ZoomIn className="w-6 h-6 text-white/90" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Poll Rendering */}
                                {conf.type === 'poll' && conf.pollOptions && (
                                    <div className="mb-4 space-y-2 bg-black/20 p-3 rounded-xl border border-gray-800/50">
                                        {conf.pollOptions.map(option => {
                                            const totalVotes = conf.pollOptions?.reduce((acc, curr) => acc + curr.votes, 0) || 0;
                                            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                                            const isSelected = conf.userVote === option.id;

                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => handlePollVote(conf.id, option.id)}
                                                    disabled={!!conf.userVote}
                                                    className={`w-full relative h-10 rounded-lg overflow-hidden border transition-all ${isSelected ? 'border-neon ring-1 ring-neon/20' : 'border-gray-800 hover:border-gray-700'}`}
                                                >
                                                    <div className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out ${isSelected ? 'bg-neon/20' : 'bg-gray-800/80'}`} style={{ width: `${percentage}%` }} />
                                                    <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
                                                        <span className={`text-sm font-medium ${isSelected ? 'text-neon' : 'text-gray-300'}`}>{option.text}</span>
                                                        {conf.userVote && (
                                                            <span className="text-xs font-bold font-mono text-gray-400">{percentage}%</span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        <div className="flex justify-end pt-1">
                                            <span className="text-[10px] uppercase font-bold text-gray-600">{conf.pollOptions.reduce((acc, curr) => acc + curr.votes, 0)} votes</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2 border-t border-gray-800/50 pt-3">
                                    {/* Reactions Display */}
                                    {conf.reactions && Object.values(conf.reactions).some(v => v > 0) && (
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {Object.entries(conf.reactions).map(([emoji, count]) => (
                                                (count as number) > 0 && (
                                                    <span key={emoji} className="inline-flex items-center gap-1.5 bg-gray-900 text-[10px] px-2.5 py-1 rounded-full text-gray-300 border border-gray-800 shadow-sm animate-fade-in">
                                                        <span className="text-xs">{emoji}</span>
                                                        <span className="font-bold text-white">{count as number}</span>
                                                    </span>
                                                )
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => handleReactionClick(e, conf.id)}
                                                className="flex items-center gap-2 text-gray-500 hover:text-neon transition-all text-xs font-bold bg-white/5 hover:bg-neon/10 px-3 py-1.5 rounded-full border border-transparent hover:border-neon/20"
                                            >
                                                <SmilePlus className="w-4 h-4" />
                                                <span>React</span>
                                            </button>

                                            <button
                                                onClick={() => toggleComments(conf.id)}
                                                className={`flex items-center gap-2 transition-all text-xs font-bold px-3 py-1.5 rounded-full border border-transparent ${expandedComments[conf.id] ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-gray-500 hover:text-blue-400 bg-white/5 hover:bg-blue-500/10 hover:border-blue-500/20'}`}
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                <span>{conf.comments?.length || 0}</span>
                                                <span className="hidden sm:inline">Comments</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Comments Section */}
                                {expandedComments[conf.id] && (
                                    <div className="mt-4 pt-4 border-t border-gray-800/30 animate-fade-in-down">
                                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar pr-2 scroll-smooth">
                                            {conf.comments && conf.comments.length > 0 ? (
                                                conf.comments.map(comment => (
                                                    <div key={comment.id} className="bg-black/40 border border-gray-800/50 p-3 rounded-xl">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-[8px] font-bold text-gray-400">?</div>
                                                                <span className="text-xs font-bold text-gray-400">{comment.userId}</span>
                                                            </div>
                                                            <span className="text-[9px] text-gray-600 font-mono">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-300 pl-6">{comment.text}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-4 bg-black/20 rounded-xl border border-dashed border-gray-800">
                                                    <p className="text-xs text-gray-500">No comments yet. Be the first!</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2 relative">
                                            <input
                                                className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-neon focus:ring-1 focus:ring-neon/20 outline-none transition-all placeholder:text-gray-600"
                                                placeholder="Add a comment..."
                                                value={commentInputs[conf.id] || ''}
                                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [conf.id]: e.target.value }))}
                                                onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(conf.id)}
                                            />
                                            <button
                                                onClick={() => handleCommentSubmit(conf.id)}
                                                disabled={!commentInputs[conf.id]?.trim()}
                                                className="p-2.5 bg-neon text-white rounded-xl hover:bg-neon/90 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 shadow-lg shadow-neon/20"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* === FIXED INPUT AREA === */}
            {/* Anchored at bottom-0 for desktop, bottom-20 (nav height) for mobile */}
            <div className="fixed bottom-20 md:bottom-0 left-0 right-0 z-30 p-4 pointer-events-none flex justify-center w-full">
                <div className="max-w-2xl w-full pointer-events-auto">

                    {/* Floating Glass Capsule */}
                    <div className="bg-black/60 backdrop-blur-xl border border-gray-700/50 rounded-[2rem] p-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] ring-1 ring-white/5 transition-all focus-within:ring-neon/30 focus-within:border-neon/30 focus-within:bg-black/80">
                        {newImage && !isPollMode && (
                            <div className="relative w-16 h-16 mb-2 ml-2 animate-fade-in-up">
                                <img src={newImage} alt="Preview" className="w-full h-full object-cover rounded-xl border border-gray-700" />
                                <button onClick={() => setNewImage(null)} className="absolute -top-2 -right-2 bg-gray-800 border border-gray-700 rounded-full p-1 shadow-lg hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors text-gray-400">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        {isPollMode && (
                            <div className="mb-2 mx-2 space-y-2 animate-fade-in border-b border-gray-800/50 pb-3 mt-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-neon uppercase tracking-wider flex items-center gap-1"><BarChart2 className="w-3 h-3" /> Poll Options</span>
                                    <button onClick={() => setIsPollMode(false)} className="text-[10px] text-gray-500 hover:text-white underline">Cancel</button>
                                </div>
                                {pollOptions.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px] text-gray-500 font-bold border border-gray-700">{i + 1}</div>
                                        <input
                                            className="flex-1 bg-gray-900/50 border border-gray-800/50 text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-neon focus:bg-gray-900 transition-colors"
                                            placeholder={`Option ${i + 1}`}
                                            value={opt}
                                            onChange={(e) => {
                                                const newOpts = [...pollOptions];
                                                newOpts[i] = e.target.value;
                                                setPollOptions(newOpts);
                                            }}
                                        />
                                        {pollOptions.length > 2 && (
                                            <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-400 p-1">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {pollOptions.length < 4 && (
                                    <button onClick={() => setPollOptions([...pollOptions, ''])} className="w-full py-1.5 text-xs text-center text-gray-500 hover:text-neon hover:bg-neon/5 rounded-lg border border-dashed border-gray-800 hover:border-neon/30 transition-all font-medium mt-1">
                                        + Add Option
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2 items-center px-1">
                            <button
                                onClick={() => { setIsPollMode(!isPollMode); setNewImage(null); }}
                                className={`p-2.5 rounded-full transition-all duration-300 ${isPollMode ? 'bg-neon text-white shadow-neon-sm' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                                title="Create Poll"
                            >
                                <BarChart2 className="w-5 h-5" />
                            </button>

                            <div className="h-6 w-px bg-gray-800 mx-0.5"></div>

                            <input id="confession-image-input" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            <button
                                onClick={handleImageClick}
                                disabled={isPollMode}
                                className={`p-2.5 rounded-full transition-all duration-300 group ${isPollMode ? 'opacity-30 cursor-not-allowed' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                                title="Upload Image"
                            >
                                <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>

                            <textarea
                                value={newText}
                                onChange={e => setNewText(e.target.value)}
                                placeholder={isPollMode ? "Ask a poll question..." : "Confess something anonymously..."}
                                className="flex-1 bg-transparent text-white px-2 py-3 outline-none resize-none h-12 max-h-32 text-sm placeholder:text-gray-500"
                                rows={1}
                            />

                            <button
                                onClick={handlePost}
                                disabled={(isPollMode ? (pollOptions.filter(o => o.trim()).length < 2 || !newText.trim()) : (!newText.trim() && !newImage)) || isPosting}
                                className="p-3 bg-gradient-to-br from-neon to-pink-600 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,0,127,0.3)] hover:scale-105 active:scale-95 transition-all"
                            >
                                {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 fill-white" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reuse existing Premium & Image Modal JSX */}
            {activeReactionMenu && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]" onClick={() => { setActiveReactionMenu(null); setMenuPosition(null); }}></div>
                    <div
                        className={`fixed z-50 bg-gray-900 border border-gray-700/50 shadow-2xl overflow-hidden animate-spring-up 
                            ${menuPosition ? 'rounded-2xl' : 'bottom-0 left-0 right-0 rounded-t-3xl border-b-0 pb-8'}
                        `}
                        style={menuPosition ? { top: menuPosition.top, left: menuPosition.left } : {}}
                    >
                        <div className="p-3 bg-black/50 border-b border-gray-800 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-2">Tap to React</span>
                        </div>
                        <div className="flex items-center justify-around gap-1 p-3 bg-gray-900/50 overflow-x-auto custom-scrollbar md:max-w-[320px]">
                            {REACTIONS.map(emoji => (
                                <button key={emoji} onClick={() => handleReaction(activeReactionMenu, emoji)} className="text-3xl md:text-2xl hover:scale-125 transition-transform p-2 shrink-0">{emoji}</button>
                            ))}
                        </div>
                        <div className="w-full md:w-[320px] h-[300px]">
                            <EmojiPicker onEmojiClick={(data) => handleExtendedReaction(activeReactionMenu, data)} theme={Theme.DARK} width="100%" height="300px" searchDisabled={false} previewConfig={{ showPreview: false }} />
                        </div>
                    </div>
                </>
            )}

            {viewImage && (
                <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewImage(null)}>
                    <button className="absolute top-6 right-6 p-3 bg-gray-800/50 rounded-full hover:bg-gray-700 text-white transition-colors backdrop-blur-md" onClick={() => setViewImage(null)}>
                        <X className="w-6 h-6" />
                    </button>
                    <img src={viewImage || undefined} alt="Full Size" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
                </div>
            )}

            <style>{`
                .animate-pulse-slow {
                    animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
            `}</style>
        </div>
    );
};