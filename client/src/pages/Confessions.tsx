import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Confession } from '../types'; // Ensure types are updated if needed
import { NeonButton } from '../components/Common';
import { ArrowLeft, Image as ImageIcon, Send, Heart, Crown, MessageCircle, X, Loader2, ChevronDown, ChevronUp, ZoomIn, SlidersHorizontal, SmilePlus, Plus, BarChart2 } from 'lucide-react';
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
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
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
        if (currentUser?.isPremium) {
            document.getElementById('confession-image-input')?.click();
        } else {
            setIsPremiumModalOpen(true);
        }
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

    const buyPremium = () => {
        setIsPremiumModalOpen(false);
        updateProfile({ isPremium: true });
        alert("Welcome to Premium!");
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



    return (
        <div className="h-full bg-transparent text-white flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-900 flex items-center justify-between bg-black z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/home')} className="p-2 hover:bg-gray-800 rounded-full transition-colors hidden md:block">
                        <ArrowLeft className="w-6 h-6 text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            Global Confessions
                        </h1>
                        <p className="text-xs text-gray-500 font-mono truncate max-w-[180px]">All Universities</p>
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
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-24 md:pb-32">
                {sortedConfessions.length === 0 ? (
                    <div className="text-center py-20 text-gray-600">
                        <p>No confessions yet. Be the first to spill the tea! ☕</p>
                    </div>
                ) : (
                    sortedConfessions.map(conf => (
                        <div key={conf.id} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 animate-fade-in-up">
                            <div className="flex gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                                    <span className="text-sm font-bold text-gray-500">?</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-200">{conf.userId}</span>
                                        <span className="text-[10px] text-gray-600 ml-2 whitespace-nowrap">{new Date(conf.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate w-full">{conf.university}</p>
                                </div>
                            </div>

                            <p className="text-gray-200 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{conf.text}</p>

                            {conf.imageUrl && (
                                <div
                                    className="mb-4 rounded-xl overflow-hidden border border-gray-800 aspect-video cursor-pointer group relative bg-black"
                                    onClick={() => setViewImage(conf.imageUrl || null)}
                                >
                                    <img src={conf.imageUrl} alt="Confession" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                                        <ZoomIn className="w-8 h-8 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            )}

                            {/* Poll Rendering */}
                            {conf.type === 'poll' && conf.pollOptions && (
                                <div className="mb-4 space-y-2">
                                    {conf.pollOptions.map(option => {
                                        const totalVotes = conf.pollOptions?.reduce((acc, curr) => acc + curr.votes, 0) || 0;
                                        const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                                        const isSelected = conf.userVote === option.id;

                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => handlePollVote(conf.id, option.id)}
                                                disabled={!!conf.userVote}
                                                className={`w-full relative h-10 rounded-lg overflow-hidden border transition-all ${isSelected ? 'border-neon' : 'border-gray-800 hover:border-gray-700'}`}
                                            >
                                                <div className={`absolute top-0 left-0 h-full transition-all duration-500 ${isSelected ? 'bg-neon/20' : 'bg-gray-800/50'}`} style={{ width: `${percentage}%` }} />
                                                <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
                                                    <span className={`text-sm font-medium ${isSelected ? 'text-neon' : 'text-gray-300'}`}>{option.text}</span>
                                                    {conf.userVote && (
                                                        <span className="text-xs text-gray-500 font-mono">{percentage}%</span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                    <p className="text-xs text-gray-600 text-right mt-1">
                                        {conf.pollOptions.reduce((acc, curr) => acc + curr.votes, 0)} votes
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-2 border-t border-gray-800/50 pt-2">
                                {/* Reactions Display */}
                                <div className="flex flex-wrap gap-2 mb-1">
                                    {conf.reactions && Object.entries(conf.reactions).map(([emoji, count]) => (
                                        (count as number) > 0 && (
                                            <span key={emoji} className="inline-flex items-center gap-1 bg-gray-800/50 text-xs px-2 py-1 rounded-full text-gray-300 border border-gray-700">
                                                <span>{emoji}</span>
                                                <span className="font-bold">{count as number}</span>
                                            </span>
                                        )
                                    ))}
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 relative">
                                        <div className="relative">
                                            <button
                                                onClick={(e) => handleReactionClick(e, conf.id)}
                                                className="flex items-center gap-2 text-gray-500 hover:text-neon transition-colors text-xs font-bold group"
                                            >
                                                <SmilePlus className="w-4 h-4 group-hover:text-neon" />
                                                <span>React</span>
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => toggleComments(conf.id)}
                                            className="flex items-center gap-2 text-gray-500 hover:text-blue-400 transition-colors text-xs font-bold"
                                        >
                                            <MessageCircle className="w-4 h-4" /> {conf.comments?.length || 0} Comments
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Comments Section */}
                            {expandedComments[conf.id] && (
                                <div className="mt-4 pt-4 border-t border-gray-800/30 animate-fade-in">
                                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                        {conf.comments && conf.comments.length > 0 ? (
                                            conf.comments.map(comment => (
                                                <div key={comment.id} className="bg-gray-800/30 p-3 rounded-xl">
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <span className="text-xs font-bold text-gray-400">{comment.userId}</span>
                                                        <span className="text-[10px] text-gray-600">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-300">{comment.text}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-gray-600 text-center py-2">No comments yet. Be the first!</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-white focus:border-neon outline-none"
                                            placeholder="Add a comment..."
                                            value={commentInputs[conf.id] || ''}
                                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [conf.id]: e.target.value }))}
                                            onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(conf.id)}
                                        />
                                        <button
                                            onClick={() => handleCommentSubmit(conf.id)}
                                            disabled={!commentInputs[conf.id]?.trim()}
                                            className="p-2 bg-neon/10 text-neon rounded-full hover:bg-neon hover:text-white transition-colors disabled:opacity-30"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Input Area (Same as before, simplified for brevity) */}
            <div className="p-4 bg-black border-t border-gray-900 shrink-0 z-20 mb-20 md:mb-0">
                <div className="bg-gray-900 rounded-2xl p-2 border border-gray-800 focus-within:border-neon transition-colors">
                    {newImage && !isPollMode && (
                        <div className="relative w-20 h-20 mb-2 ml-2">
                            <img src={newImage} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                            <button onClick={() => setNewImage(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg">
                                <X className="w-3 h-3 text-white" />
                            </button>
                        </div>
                    )}

                    {isPollMode && (
                        <div className="mb-4 ml-2 mr-2 space-y-2 animate-fade-in">
                            {pollOptions.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-neon"
                                        placeholder={`Option ${i + 1}`}
                                        value={opt}
                                        onChange={(e) => {
                                            const newOpts = [...pollOptions];
                                            newOpts[i] = e.target.value;
                                            setPollOptions(newOpts);
                                        }}
                                    />
                                    {pollOptions.length > 2 && (
                                        <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-gray-500 hover:text-red-500">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {pollOptions.length < 4 && (
                                <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-xs text-neon font-bold flex items-center gap-1 hover:underline mt-1">
                                    <Plus className="w-3 h-3" /> Add Option
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2 items-end">
                        <textarea
                            value={newText}
                            onChange={e => setNewText(e.target.value)}
                            placeholder={isPollMode ? "Ask a question..." : "Type your confession anonymously..."}
                            className="flex-1 bg-transparent text-white px-4 py-3 outline-none resize-none h-14 text-sm"
                        />
                        <div className="flex items-center gap-2 pb-2 pr-2">
                            <button onClick={() => { setIsPollMode(!isPollMode); setNewImage(null); }} className={`p-2 rounded-full transition-colors ${isPollMode ? 'bg-neon/20 text-neon' : 'hover:bg-gray-800 text-gray-400'}`}>
                                <BarChart2 className="w-5 h-5" />
                            </button>
                            <button onClick={handleImageClick} disabled={isPollMode} className={`p-2 rounded-full transition-colors hover:bg-gray-800 ${isPollMode ? 'opacity-30 cursor-not-allowed' : ''}`}>
                                <ImageIcon className={`w-5 h-5 ${currentUser?.isPremium ? 'text-gray-400 hover:text-white' : 'text-yellow-500/70'}`} />
                            </button>
                            <input id="confession-image-input" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            <button onClick={handlePost} disabled={(isPollMode ? (pollOptions.filter(o => o.trim()).length < 2 || !newText.trim()) : (!newText.trim() && !newImage)) || isPosting} className="p-2 bg-neon rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-neon-sm">
                                {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reuse existing Premium & Image Modal JSX */}
            {activeReactionMenu && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" onClick={() => { setActiveReactionMenu(null); setMenuPosition(null); }}></div>
                    <div
                        className={`fixed z-50 bg-gray-900 border border-gray-800 shadow-2xl overflow-hidden animate-fade-in-up 
                            ${menuPosition ? 'rounded-xl' : 'bottom-0 left-0 right-0 rounded-t-3xl border-b-0 pb-8'}
                        `}
                        style={menuPosition ? { top: menuPosition.top, left: menuPosition.left } : {}}
                    >
                        <div className="flex items-center gap-1 p-2 border-b border-gray-800 bg-black/50 overflow-x-auto custom-scrollbar md:max-w-[300px]">
                            {REACTIONS.map(emoji => (
                                <button key={emoji} onClick={() => handleReaction(activeReactionMenu, emoji)} className="text-2xl md:text-xl hover:scale-125 transition-transform p-3 md:p-1 shrink-0">{emoji}</button>
                            ))}
                        </div>
                        <div className="w-full md:w-[300px] h-[350px]">
                            <EmojiPicker onEmojiClick={(data) => handleExtendedReaction(activeReactionMenu, data)} theme={Theme.DARK} width="100%" height="350px" searchDisabled={false} previewConfig={{ showPreview: false }} />
                        </div>
                    </div>
                </>
            )}

            {/* ... Premium Modal ... */}
            {/* ... Image Lightbox ... */}
            {/* (Keep the rest of the file logic the same) */}
            {isPremiumModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    {/* ... (Existing Premium Modal Code) ... */}
                    <div className="bg-gray-900 border border-yellow-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(234,179,8,0.1)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
                        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/50">
                            <Crown className="w-8 h-8 text-yellow-500" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">Unlock Premium</h3>
                        <p className="text-gray-400 text-sm mb-8">Post image confessions, see who liked your profile, and get unlimited swipes.</p>
                        <div className="space-y-3">
                            <button onClick={buyPremium} className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-xl font-bold text-black hover:scale-105 transition-transform shadow-lg uppercase tracking-wide">Get Premium - ₹9/week</button>
                            <button onClick={() => setIsPremiumModalOpen(false)} className="w-full py-3 text-gray-500 hover:text-white text-sm font-medium">Maybe Later</button>
                        </div>
                    </div>
                </div>
            )}
            {viewImage && (
                <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewImage(null)}>
                    <button className="absolute top-6 right-6 p-3 bg-gray-800/50 rounded-full hover:bg-gray-700 text-white transition-colors" onClick={() => setViewImage(null)}>
                        <X className="w-6 h-6" />
                    </button>
                    <img src={viewImage || undefined} alt="Full Size" className="max-w-full max-h-full object-contain rounded-md shadow-2xl" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
};