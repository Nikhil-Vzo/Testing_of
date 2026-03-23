import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, CheckCircle2, Circle, Send, Loader2, Flame, Ghost, Zap } from 'lucide-react';
import { useAmisEventDetail } from './useAmisData';
import { CATEGORY_META, REACTION_EMOJIS } from './types';

export const AmisEventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { event, posts, loading, userCheckedIn, userReaction, checkinCount, reactionCounts, toggleCheckin, toggleReaction, addPost } = useAmisEventDetail(id);

  const [postContent, setPostContent] = useState('');
  const [anonName, setAnonName] = useState('');
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!postContent.trim() || !anonName.trim()) return;
    setPosting(true);
    await addPost(postContent.trim(), anonName.trim());
    setPostContent('');
    setPosting(false);
  };

  if (loading) {
    return (
      <div className="h-full bg-transparent flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-neon animate-spin" />
        <p className="text-gray-600 text-[10px] uppercase tracking-widest font-bold">Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="h-full bg-transparent flex flex-col items-center justify-center text-gray-500 gap-4">
        <Ghost className="w-12 h-12 text-gray-700" />
        <p className="text-sm font-bold">Event not found</p>
        <button onClick={() => navigate('/amis-park/events')} className="text-neon text-xs font-bold uppercase tracking-widest hover:underline">Back to Events</button>
      </div>
    );
  }

  const meta = CATEGORY_META[event.category];

  const getCrowdLevel = (count: number) => {
    if (count >= 20) return { label: 'Packed', sublabel: '🔥🔥🔥', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
    if (count >= 10) return { label: 'Hot', sublabel: '🔥🔥', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' };
    if (count >= 3) return { label: 'Warm', sublabel: '🔥', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' };
    return { label: 'Chill', sublabel: '✨', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
  };
  const crowd = getCrowdLevel(checkinCount);
  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="h-full w-full bg-transparent text-white flex flex-col relative overflow-hidden">

      {/* === REACTIVE BACKGROUND === */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-15%] w-[55%] h-[55%] rounded-full blur-[130px]"
          style={{ background: `radial-gradient(circle, ${meta.bgGlow.replace('0.3', '0.1')} 0%, transparent 70%)` }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '256px 256px' }} />
      </div>

      {/* === STICKY HEADER === */}
      <div className="flex-none p-4 md:px-8 border-b border-gray-800/50 bg-black/40 backdrop-blur-2xl z-40 sticky top-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/amis-park/events')} className="p-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 hover:border-neon/30 hover:text-neon transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-black uppercase tracking-tight truncate">{event.name}</h1>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">{meta.label}</span>
              {event.zone && <span className="text-[9px] text-gray-700 font-bold">• Zone {event.zone}</span>}
            </div>
          </div>
          {event.is_trending && (
            <div className="flex items-center gap-1 px-2 py-1 bg-neon/10 border border-neon/20 rounded-full text-neon text-[9px] font-bold uppercase tracking-wider">
              <Flame className="w-2.5 h-2.5" /> Hot
            </div>
          )}
        </div>
      </div>

      {/* === SCROLLABLE CONTENT === */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10">
        <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto pb-28 md:pb-8">

          {/* Event Header */}
          <div className="mb-6">
            {/* Category + Zone badges */}
            <div className="flex items-center flex-wrap gap-2 mb-4">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r ${meta.gradient} text-white text-[10px] font-bold uppercase tracking-wider shadow-md`}>
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
              </div>
              {event.zone && (
                <div className="flex items-center gap-1 px-2.5 py-1.5 bg-black/40 border border-white/[0.06] rounded-lg text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  <MapPin className="w-3 h-3" />
                  Zone {event.zone}
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-black tracking-[-0.04em] mb-3 leading-[0.95] uppercase">
              {event.name}
            </h1>

            {/* Description */}
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              {event.description}
            </p>

            {/* Tags */}
            {event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {event.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-black/40 border border-white/[0.06] rounded-full text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className={`bg-black/40 backdrop-blur-xl border rounded-2xl p-4 ${crowd.bg}`}>
              <div className="flex items-center gap-1.5 text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-2">
                <Users className="w-3.5 h-3.5" />
                Crowd
              </div>
              <p className={`text-xl font-black ${crowd.color}`}>{crowd.sublabel} {crowd.label}</p>
              <p className="text-gray-600 text-[10px] mt-1 font-bold">{checkinCount} checked in</p>
            </div>
            <div className="bg-black/40 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-2">
                <Zap className="w-3.5 h-3.5" />
                Vibes
              </div>
              <p className="text-xl font-black text-white">{totalReactions}</p>
              <p className="text-gray-600 text-[10px] mt-1 font-bold">total reactions</p>
            </div>
          </div>

          {/* Check-in Button */}
          <button
            onClick={toggleCheckin}
            className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 border mb-6 ${
              userCheckedIn
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                : 'bg-neon/10 border-neon/20 text-neon hover:bg-neon/15 hover:shadow-[0_0_25px_rgba(255,0,127,0.15)]'
            }`}
          >
            {userCheckedIn ? (
              <><CheckCircle2 className="w-5 h-5" /> Checked In ✓</>
            ) : (
              <><Circle className="w-5 h-5" /> Check In Here</>
            )}
          </button>

          {/* Reactions Bar */}
          <div className="mb-6">
            <h3 className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-3">React to this event</h3>
            <div className="flex gap-2 flex-wrap">
              {REACTION_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-bold border transition-all duration-300 ${
                    userReaction === emoji
                      ? 'bg-neon/10 border-neon/30 text-white scale-110 shadow-[0_0_20px_rgba(255,0,127,0.15)]'
                      : 'bg-black/40 border-white/[0.06] text-gray-400 hover:border-white/10 hover:scale-105'
                  }`}
                >
                  <span className="text-lg">{emoji}</span>
                  {reactionCounts[emoji] ? <span className="text-[10px] font-bold text-gray-500">{reactionCounts[emoji]}</span> : null}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.04] my-6" />

          {/* Post Form */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2 uppercase tracking-tight">
              💬 Say something
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Your anonymous name..."
                value={anonName}
                onChange={(e) => setAnonName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/60 backdrop-blur-xl border border-white/[0.06] focus:border-neon/30 focus:outline-none focus:shadow-[0_0_15px_rgba(255,0,127,0.08)] text-white placeholder:text-gray-700 text-xs font-medium transition-all"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="What's the vibe?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePost()}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/60 backdrop-blur-xl border border-white/[0.06] focus:border-neon/30 focus:outline-none focus:shadow-[0_0_15px_rgba(255,0,127,0.08)] text-white placeholder:text-gray-700 text-xs font-medium transition-all"
                />
                <button
                  onClick={handlePost}
                  disabled={posting || !postContent.trim() || !anonName.trim()}
                  className="px-5 py-3 rounded-xl bg-white text-black font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 transition-all duration-300 flex items-center gap-2"
                >
                  {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Live Feed */}
          <div>
            <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-tight">
              📰 Live Feed
              {posts.length > 0 && <span className="text-gray-700 text-[10px] font-bold tracking-wider">({posts.length})</span>}
            </h3>
            {posts.length === 0 ? (
              <div className="text-center py-12 bg-black/20 rounded-2xl border border-white/[0.04] border-dashed">
                <Ghost className="w-8 h-8 text-gray-800 mx-auto mb-3" />
                <p className="text-gray-700 text-xs font-bold">No posts yet. Be the first to share your vibe!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(post => (
                  <div key={post.id} className="bg-black/30 backdrop-blur-md border border-white/[0.04] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon to-purple-500 flex items-center justify-center shadow-[0_0_10px_rgba(255,0,127,0.2)]">
                        <span className="text-white text-[10px] font-black">{post.anonymous_name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-300">{post.anonymous_name}</span>
                      <span className="text-gray-800 text-[10px] font-mono ml-auto">
                        {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed pl-9">{post.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmisEventDetail;
