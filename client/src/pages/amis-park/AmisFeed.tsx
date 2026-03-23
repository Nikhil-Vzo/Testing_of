import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Image as ImageIcon, X, Loader2, MessageCircle, SmilePlus, MapPin, Ghost, ChevronDown } from 'lucide-react';
import { useAmisFeed, REACTIONS } from './useAmisFeed';
import { useAmisEvents } from './useAmisData';

const BLOCK_OPTIONS = [
  { value: '', label: 'No tag' },
  { value: 'A', label: '📍 Block A' },
  { value: 'B', label: '📍 Block B' },
  { value: 'C', label: '📍 Block C' },
];

export const AmisFeed: React.FC = () => {
  const navigate = useNavigate();
  const { posts, loading, loadingMore, hasMore, loadMore, createPost, toggleReaction, addComment, fetchFullComments } = useAmisFeed();
  const { events } = useAmisEvents('all', '');
  const [mounted, setMounted] = useState(false);

  // Post composer state
  const [newText, setNewText] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const [blockTag, setBlockTag] = useState('');
  const [eventId, setEventId] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [showEventPicker, setShowEventPicker] = useState(false);

  // Interaction state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [filterBlock, setFilterBlock] = useState<string>('');

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore();
    }, { threshold: 1.0 });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const handlePost = async () => {
    if (!newText.trim() && !newImage) return;
    setIsPosting(true);
    await createPost(newText.trim(), newImage, blockTag || null, eventId || null);
    setNewText('');
    setNewImage(null);
    setBlockTag('');
    setEventId('');
    setIsPosting(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleToggleComments = async (postId: string) => {
    const isExpanding = !expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: isExpanding }));
    if (isExpanding) await fetchFullComments(postId);
  };

  const handleCommentSubmit = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text?.trim()) return;
    await addComment(postId, text.trim());
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setExpandedComments(prev => ({ ...prev, [postId]: true }));
  };

  const filteredPosts = filterBlock ? posts.filter(p => p.block_tag === filterBlock) : posts;

  // Filtered events by selected block for event picker
  const filteredEvents = blockTag ? events.filter(e => e.zone === blockTag) : events;

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="h-full w-full bg-transparent text-white flex flex-col relative overflow-hidden">

      {/* === BACKGROUND === */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-25%] right-[-15%] w-[55%] h-[55%] rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(circle, rgba(255,0,127,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[45%] h-[45%] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '256px 256px' }} />
      </div>

      {/* === HEADER === */}
      <div className="flex-none p-4 md:px-8 border-b border-gray-800/50 bg-black/40 backdrop-blur-2xl z-40 sticky top-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate('/amis-park')} className="p-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 hover:border-neon/30 hover:text-neon transition-all">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">
                Fest <span className="text-neon">Feed</span>
              </h1>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Share your fest moments</p>
            </div>
            <Ghost className="w-6 h-6 text-neon/30" />
          </div>

          {/* Block Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setFilterBlock('')}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 ${
                !filterBlock ? 'bg-neon/10 border-neon/30 text-neon' : 'bg-black/40 border-white/[0.06] text-gray-500 hover:text-gray-400'
              }`}
            >
              All Posts
            </button>
            {['A', 'B', 'C'].map(b => (
              <button
                key={b}
                onClick={() => setFilterBlock(filterBlock === b ? '' : b)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 ${
                  filterBlock === b ? 'bg-neon/10 border-neon/30 text-neon' : 'bg-black/40 border-white/[0.06] text-gray-500 hover:text-gray-400'
                }`}
              >
                📍 Block {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* === SCROLLABLE FEED === */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10">
        <div className="px-4 md:px-8 py-4 max-w-2xl mx-auto pb-48 md:pb-8">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-neon animate-spin" />
              <p className="text-gray-600 text-xs uppercase tracking-widest font-bold">Loading feed...</p>
            </div>
          )}

          {/* Empty */}
          {!loading && filteredPosts.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-900/50 rounded-full flex items-center justify-center mb-4 border border-gray-800">
                <Ghost className="w-8 h-8 text-gray-700" />
              </div>
              <p className="text-gray-500 text-sm font-bold mb-1">No posts yet</p>
              <p className="text-gray-700 text-xs">Be the first to share your fest experience!</p>
            </div>
          )}

          {/* Feed Cards */}
          {!loading && (
            <div className="space-y-4">
              {filteredPosts.map((post, i) => {
                const totalReactions = Object.values(post.reactions).reduce((a, b) => a + b, 0);
                
                return (
                  <div
                    key={post.id}
                    className={`bg-black/40 backdrop-blur-2xl border border-white/[0.06] rounded-2xl overflow-hidden transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                    style={{ transitionDelay: `${Math.min(i, 10) * 50}ms` }}
                  >
                    {/* Post Header */}
                    <div className="flex items-center gap-3 p-4 pb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0">
                        <Ghost className="w-5 h-5 text-neon/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-gray-300">Anonymous</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] text-gray-600 font-mono">{getTimeAgo(post.created_at)}</span>
                          {post.block_tag && (
                            <span className="text-[9px] font-bold text-neon/70 uppercase bg-neon/10 px-1.5 py-0.5 rounded-md border border-neon/20">
                              📍 Block {post.block_tag}
                            </span>
                          )}
                          {post.event_name && (
                            <span className="text-[9px] font-bold text-purple-400/70 uppercase bg-purple-500/10 px-1.5 py-0.5 rounded-md border border-purple-500/20 truncate max-w-[120px]">
                              🎪 {post.event_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    {post.content && (
                      <p className="text-gray-200 text-sm leading-relaxed px-4 pb-2 whitespace-pre-wrap">{post.content}</p>
                    )}

                    {/* Image */}
                    {post.image_url && (
                      <div className="mx-4 mb-3 rounded-xl overflow-hidden border border-white/[0.06] cursor-pointer" onClick={() => setViewImage(post.image_url)}>
                        <img src={post.image_url} alt="Post" className="w-full max-h-[400px] object-cover" />
                      </div>
                    )}

                    {/* Reactions Display */}
                    {totalReactions > 0 && (
                      <div className="flex flex-wrap gap-1.5 px-4 pb-2">
                        {Object.entries(post.reactions).map(([emoji, count]) => count > 0 && (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(post.id, emoji)}
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                              post.userReaction === emoji
                                ? 'bg-neon/10 border-neon/30 text-neon'
                                : 'bg-black/40 border-white/[0.06] text-gray-500 hover:bg-white/5'
                            }`}
                          >
                            {emoji} <b>{count}</b>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Comment Preview */}
                    {!expandedComments[post.id] && post.comments.length > 0 && (
                      <div className="mx-4 mb-2 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04] cursor-pointer" onClick={() => handleToggleComments(post.id)}>
                        <p className="text-[10px] font-bold text-gray-500 mb-0.5">Latest</p>
                        <p className="text-xs text-gray-400 truncate italic">"{post.comments[post.comments.length - 1]?.text}"</p>
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex items-center gap-1 px-3 py-2.5 border-t border-white/[0.04]">
                      <button
                        onClick={() => setActiveReactionMenu(activeReactionMenu === post.id ? null : post.id)}
                        className="flex items-center gap-1.5 text-gray-500 hover:text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-all"
                      >
                        <SmilePlus className="w-4 h-4" /> React
                      </button>
                      <button
                        onClick={() => handleToggleComments(post.id)}
                        className="flex items-center gap-1.5 text-gray-500 hover:text-blue-400 text-[11px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-all"
                      >
                        <MessageCircle className="w-4 h-4" /> {post.commentCount}
                      </button>
                    </div>

                    {/* Reaction Picker */}
                    {activeReactionMenu === post.id && (
                      <div className="px-4 pb-3">
                        <div className="flex gap-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-2 w-fit">
                          {REACTIONS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => { toggleReaction(post.id, emoji); setActiveReactionMenu(null); }}
                              className={`text-xl hover:scale-125 transition-transform p-1.5 rounded-lg ${post.userReaction === emoji ? 'bg-neon/10' : 'hover:bg-white/5'}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expanded Comments */}
                    {expandedComments[post.id] && (
                      <div className="px-4 pb-4 border-t border-white/[0.04] pt-3">
                        <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
                          {post.comments.map(c => (
                            <div key={c.id} className="bg-white/[0.03] p-2.5 rounded-xl">
                              <div className="flex justify-between mb-0.5">
                                <span className="text-[10px] font-bold text-gray-500">Anonymous</span>
                                <span className="text-[9px] text-gray-700 font-mono">{getTimeAgo(c.created_at)}</span>
                              </div>
                              <p className="text-xs text-gray-300">{c.text}</p>
                            </div>
                          ))}
                          {post.comments.length === 0 && (
                            <p className="text-xs text-gray-700 text-center py-2">No comments yet</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            className="flex-1 bg-black/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-700 focus:border-neon/30 focus:outline-none transition-all"
                            placeholder="Add a comment..."
                            value={commentInputs[post.id] || ''}
                            onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleCommentSubmit(post.id)}
                          />
                          <button
                            onClick={() => handleCommentSubmit(post.id)}
                            className="p-2.5 bg-white text-black rounded-xl hover:bg-gray-200 transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          {hasMore && <div ref={observerTarget} className="flex justify-center p-4"><Loader2 className="w-6 h-6 text-neon animate-spin" /></div>}
        </div>
      </div>

      {/* === COMPOSER (Fixed Bottom) === */}
      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 z-30 pointer-events-none flex justify-center w-full bg-gradient-to-t from-black via-black to-transparent pb-6 pt-10">
        <div className="max-w-2xl w-full pointer-events-auto px-4">
          {/* Tags row */}
          {(blockTag || eventId) && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {blockTag && (
                <span className="text-[9px] font-bold text-neon bg-neon/10 px-2 py-1 rounded-lg border border-neon/20 flex items-center gap-1">
                  📍 Block {blockTag}
                  <button onClick={() => { setBlockTag(''); setEventId(''); }} className="ml-1"><X className="w-3 h-3" /></button>
                </span>
              )}
              {eventId && (
                <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20 flex items-center gap-1">
                  🎪 {events.find(e => e.id === eventId)?.name || 'Event'}
                  <button onClick={() => setEventId('')} className="ml-1"><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* Image preview */}
          {newImage && (
            <div className="relative w-20 h-20 mb-2 rounded-xl overflow-hidden border border-white/10">
              <img src={newImage} className="w-full h-full object-cover" alt="Preview" />
              <button onClick={() => setNewImage(null)} className="absolute top-1 right-1 bg-black/80 rounded-full p-0.5"><X className="w-3 h-3 text-white" /></button>
            </div>
          )}

          {/* Main composer bar */}
          <div className="bg-black border border-gray-800 rounded-full p-2 shadow-2xl flex items-center gap-2">
            {/* Block tag button */}
            <div className="relative">
              <button
                onClick={() => { setShowBlockPicker(!showBlockPicker); setShowEventPicker(false); }}
                className={`p-2 rounded-full transition-all ${blockTag ? 'text-neon bg-neon/10' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <MapPin className="w-5 h-5" />
              </button>
              {showBlockPicker && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowBlockPicker(false)} />
                  <div className="absolute bottom-12 left-0 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-20 w-44 overflow-hidden">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-3 pt-2 pb-1">Tag a Block</p>
                    {BLOCK_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setBlockTag(opt.value); setShowBlockPicker(false); if (!opt.value) setEventId(''); }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-800 transition-colors ${blockTag === opt.value ? 'text-neon font-bold' : 'text-gray-400'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                    {blockTag && (
                      <>
                        <div className="border-t border-gray-800" />
                        <button
                          onClick={() => { setShowBlockPicker(false); setShowEventPicker(true); }}
                          className="w-full text-left px-3 py-2 text-xs text-purple-400 hover:bg-gray-800 font-bold"
                        >
                          🎪 Tag an Event →
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Event picker dropdown */}
              {showEventPicker && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowEventPicker(false)} />
                  <div className="absolute bottom-12 left-0 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-20 w-56 max-h-60 overflow-y-auto">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-3 pt-2 pb-1 sticky top-0 bg-gray-900">
                      {blockTag ? `Block ${blockTag} Events` : 'All Events'}
                    </p>
                    <button
                      onClick={() => { setEventId(''); setShowEventPicker(false); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-800 ${!eventId ? 'text-neon font-bold' : 'text-gray-400'}`}
                    >
                      No event tag
                    </button>
                    {filteredEvents.map(event => (
                      <button
                        key={event.id}
                        onClick={() => { setEventId(event.id); setShowEventPicker(false); }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-800 transition-colors ${eventId === event.id ? 'text-purple-400 font-bold' : 'text-gray-400'}`}
                      >
                        {event.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="h-4 w-px bg-gray-800" />

            {/* Image upload */}
            <input id="feed-image-input" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <button onClick={() => document.getElementById('feed-image-input')?.click()} className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Text input */}
            <input
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePost()}
              placeholder="What's happening at the fest?"
              className="flex-1 bg-transparent text-white px-2 outline-none text-xs font-medium placeholder:text-gray-600"
            />

            {/* Send */}
            <button
              onClick={handlePost}
              disabled={isPosting || (!newText.trim() && !newImage)}
              className="p-2.5 bg-neon rounded-full text-white hover:bg-pink-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,0,127,0.3)]"
            >
              {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {viewImage && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <img src={viewImage} className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} alt="Full" />
        </div>
      )}
    </div>
  );
};

export default AmisFeed;
