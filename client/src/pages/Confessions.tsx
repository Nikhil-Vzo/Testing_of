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

            {/* Header */}
            <div className="flex-none p-4 border-b border-gray-900 bg-black z-40 sticky top-0 flex items-center justify-between">
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
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 pb-32 md:pb-24 relative z-10">
                {sortedConfessions.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-800">
                            <Ghost className="w-10 h-10 text-gray-700" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-300 mb-2">It's quiet in here...</h2>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">No confessions yet. Be the first to break the silence!</p>
                    </div>
                ) : (
                    sortedConfessions.map(conf => (
                        <div key={conf.id} className="group relative">
                            <div className="relative bg-black border border-gray-900 rounded-xl p-4 transition-all duration-300 hover:border-gray-800">
                                <div className="flex gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center shrink-0">
                                        <span className="text-sm font-black text-gray-600">?</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-300">{conf.userId}</span>
                                            <span className="text-[10px] text-gray-600 font-mono">{new Date(conf.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-600 uppercase tracking-wider font-bold mt-0.5 w-full truncate">{conf.university}</p>
                                    </div>
                                </div>

                                <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap pl-3 border-l-2 border-gray-800">{conf.text}</p>

                                {conf.imageUrl && (
                                    <div
                                        className="mb-4 rounded-lg overflow-hidden border border-gray-900 aspect-video cursor-pointer relative bg-black"
                                        onClick={() => setViewImage(conf.imageUrl || null)}
                                    >
                                        <img src={conf.imageUrl} alt="Confession" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                {/* Poll Rendering */}
                                {conf.type === 'poll' && conf.pollOptions && (
                                    <div className="mb-4 space-y-2 bg-gray-900/30 p-3 rounded-lg border border-gray-900">
                                        {conf.pollOptions.map(option => {
                                            const totalVotes = conf.pollOptions?.reduce((acc, curr) => acc + curr.votes, 0) || 0;
                                            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                                            const isSelected = conf.userVote === option.id;

                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => handlePollVote(conf.id, option.id)}
                                                    disabled={!!conf.userVote}
                                                    className={`w-full relative h-9 rounded overflow-hidden border transition-all ${isSelected ? 'border-neon/50' : 'border-gray-800 hover:border-gray-700'}`}
                                                >
                                                    <div className={`absolute top-0 left-0 h-full transition-all duration-500 ${isSelected ? 'bg-neon/10' : 'bg-gray-800'}`} style={{ width: `${percentage}%` }} />
                                                    <div className="absolute inset-0 flex items-center justify-between px-3 z-10">
                                                        <span className={`text-xs font-medium ${isSelected ? 'text-neon' : 'text-gray-400'}`}>{option.text}</span>
                                                        {conf.userVote && (
                                                            <span className="text-[10px] font-bold font-mono text-gray-500">{percentage}%</span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        <div className="flex justify-end pt-1">
                                            <span className="text-[10px] uppercase font-bold text-gray-700">{conf.pollOptions.reduce((acc, curr) => acc + curr.votes, 0)} votes</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2 border-t border-gray-900 pt-3">
                                    {/* Reactions Display */}
                                    {conf.reactions && Object.values(conf.reactions).some(v => v > 0) && (
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {Object.entries(conf.reactions).map(([emoji, count]) => (
                                                (count as number) > 0 && (
                                                    <span key={emoji} className="inline-flex items-center gap-1 bg-gray-900 text-[10px] px-2 py-0.5 rounded-full text-gray-400 border border-gray-800">
                                                        <span>{emoji}</span>
                                                        <span className="font-bold">{count as number}</span>
                                                    </span>
                                                )
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => handleReactionClick(e, conf.id)}
                                                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-bold px-2 py-1 rounded-md hover:bg-gray-900"
                                            >
                                                <SmilePlus className="w-4 h-4" />
                                                <span>React</span>
                                            </button>

                                            <button
                                                onClick={() => toggleComments(conf.id)}
                                                className={`flex items-center gap-2 transition-colors text-xs font-bold px-2 py-1 rounded-md ${expandedComments[conf.id] ? 'text-blue-400 bg-blue-900/10' : 'text-gray-500 hover:text-blue-400 hover:bg-gray-900'}`}
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                <span>{conf.comments?.length || 0}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Comments Section */}
                                {expandedComments[conf.id] && (
                                    <div className="mt-3 pt-3 border-t border-gray-900 animate-fade-in-down">
                                        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                            {conf.comments && conf.comments.length > 0 ? (
                                                conf.comments.map(comment => (
                                                    <div key={comment.id} className="bg-gray-900/50 p-2 rounded-lg">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[10px] font-bold text-gray-500">{comment.userId}</span>
                                                            <span className="text-[9px] text-gray-700 font-mono">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-300">{comment.text}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-center text-gray-600 py-2">No comments yet.</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                className="flex-1 bg-black border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:border-gray-600 outline-none transition-colors placeholder:text-gray-700"
                                                placeholder="Add a comment..."
                                                value={commentInputs[conf.id] || ''}
                                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [conf.id]: e.target.value }))}
                                                onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(conf.id)}
                                            />
                                            <button
                                                onClick={() => handleCommentSubmit(conf.id)}
                                                disabled={!commentInputs[conf.id]?.trim()}
                                                className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-30"
                                            >
                                                <Send className="w-3.5 h-3.5" />
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
            <div className="fixed bottom-20 md:bottom-0 left-0 right-0 z-30 p-3 pointer-events-none flex justify-center w-full bg-gradient-to-t from-black via-black to-transparent pb-6 pt-10">
                <div className="max-w-2xl w-full pointer-events-auto">

                    {/* Simplified Input Capsule */}
                    <div className="bg-black border border-gray-800 rounded-full p-2 shadow-2xl flex items-center gap-2">
                        {newImage && !isPollMode && (
                            <div className="relative w-10 h-10 ml-1">
                                <img src={newImage} alt="Preview" className="w-full h-full object-cover rounded-lg border border-gray-800" />
                                <button onClick={() => setNewImage(null)} className="absolute -top-1 -right-1 bg-gray-800 rounded-full p-0.5 text-white">
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => { setIsPollMode(!isPollMode); setNewImage(null); }}
                            className={`p-2 rounded-full transition-colors ${isPollMode ? 'text-neon' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <BarChart2 className="w-5 h-5" />
                        </button>

                        <div className="h-4 w-px bg-gray-800"></div>

                        <input id="confession-image-input" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <button
                            onClick={handleImageClick}
                            disabled={isPollMode}
                            className={`p-2 rounded-full transition-colors ${isPollMode ? 'opacity-30 cursor-not-allowed' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <ImageIcon className="w-5 h-5" />
                        </button>

                        <input
                            value={newText}
                            onChange={e => setNewText(e.target.value)}
                            placeholder={isPollMode ? "Poll question..." : "Confess anonymously..."}
                            className="flex-1 bg-transparent text-white px-2 outline-none text-[10px] md:text-xs placeholder:text-gray-600 font-medium"
                        />

                        <button
                            onClick={handlePost}
                            disabled={(isPollMode ? (pollOptions.filter(o => o.trim()).length < 2 || !newText.trim()) : (!newText.trim() && !newImage)) || isPosting}
                            className="p-2.5 bg-neon rounded-full text-black disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500"
                        >
                            {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 font-bold" />}
                        </button>
                    </div>

                    {/* Poll Option Inputs (Only show if Poll Mode) */}
                    {isPollMode && (
                        <div className="mt-2 bg-black border border-gray-800 rounded-xl p-3 animate-fade-in-up mx-2">
                            <div className="space-y-2">
                                {pollOptions.map((opt, i) => (
                                    <input
                                        key={i}
                                        className="w-full bg-gray-900 border border-gray-800 text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-gray-600"
                                        placeholder={`Option ${i + 1}`}
                                        value={opt}
                                        onChange={(e) => {
                                            const newOpts = [...pollOptions];
                                            newOpts[i] = e.target.value;
                                            setPollOptions(newOpts);
                                        }}
                                    />
                                ))}
                                {pollOptions.length < 4 && (
                                    <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-[10px] text-neon hover:underline font-bold w-full text-center py-1">
                                        + Add Option
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Reaction Modal */}
            {activeReactionMenu && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/50" onClick={() => { setActiveReactionMenu(null); setMenuPosition(null); }}></div>
                    <div
                        className={`fixed z-50 bg-gray-900 border border-gray-800 shadow-xl overflow-hidden
                            ${menuPosition ? 'rounded-xl' : 'bottom-0 left-0 right-0 rounded-t-xl border-b-0 pb-6'}
                        `}
                        style={menuPosition ? { top: menuPosition.top, left: menuPosition.left } : {}}
                    >
                        <div className="flex items-center justify-around gap-1 p-2 bg-black overflow-x-auto custom-scrollbar md:max-w-[300px]">
                            {REACTIONS.map(emoji => (
                                <button key={emoji} onClick={() => handleReaction(activeReactionMenu, emoji)} className="text-2xl hover:scale-110 transition-transform p-2">{emoji}</button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {viewImage && (
                <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
                    <img src={viewImage || undefined} alt="Full Size" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
};