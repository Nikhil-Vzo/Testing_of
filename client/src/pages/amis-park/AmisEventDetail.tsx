import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, CheckCircle2, Circle, Send, Loader2, Flame } from 'lucide-react';
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
      <div className="h-full bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center text-gray-500">
        <p className="text-lg mb-4">Event not found</p>
        <button onClick={() => navigate('/amis-park/events')} className="text-orange-400 underline text-sm">Back to Events</button>
      </div>
    );
  }

  const meta = CATEGORY_META[event.category];

  const getCrowdLevel = (count: number) => {
    if (count >= 20) return { label: 'Packed 🔥🔥🔥', color: 'text-red-400' };
    if (count >= 10) return { label: 'Hot 🔥🔥', color: 'text-orange-400' };
    if (count >= 3) return { label: 'Warm 🔥', color: 'text-yellow-400' };
    return { label: 'Chill ✨', color: 'text-green-400' };
  };
  const crowd = getCrowdLevel(checkinCount);

  return (
    <div className="h-full bg-black text-white overflow-y-auto overflow-x-hidden pb-24 md:pb-8">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]" style={{ background: meta.bgGlow, opacity: 0.4 }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-tl from-purple-600/10 to-transparent blur-[100px]" />
      </div>

      <div className="relative z-10 px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto">
        {/* Back button */}
        <button onClick={() => navigate('/amis-park/events')} className="flex items-center gap-2 text-gray-500 hover:text-white mb-6 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </button>

        {/* Event Header */}
        <div className="mb-8">
          {/* Category + Zone */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r ${meta.gradient} text-white text-xs font-bold shadow-md`}>
              <span>{meta.emoji}</span>
              <span>{meta.label}</span>
            </div>
            {event.zone && (
              <div className="flex items-center gap-1 text-gray-500 text-xs font-bold">
                <MapPin className="w-3.5 h-3.5" />
                Zone {event.zone}
              </div>
            )}
            {event.is_trending && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-[10px] font-bold uppercase tracking-wider">
                <Flame className="w-3 h-3" /> Trending
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3 leading-tight">
            {event.name}
          </h1>

          {/* Description */}
          <p className="text-gray-400 text-base leading-relaxed mb-6">
            {event.description}
          </p>

          {/* Tags */}
          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {event.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-gray-900 border border-gray-800 rounded-full text-gray-400 text-xs font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
              <Users className="w-4 h-4" />
              Crowd Level
            </div>
            <p className={`text-2xl font-black ${crowd.color}`}>{crowd.label}</p>
            <p className="text-gray-600 text-sm mt-1">{checkinCount} checked in</p>
          </div>
          <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
              ⚡ Reactions
            </div>
            <p className="text-2xl font-black text-white">{Object.values(reactionCounts).reduce((a, b) => a + b, 0)}</p>
            <p className="text-gray-600 text-sm mt-1">total vibes</p>
          </div>
        </div>

        {/* Check-in Button */}
        <div className="mb-8">
          <button
            onClick={toggleCheckin}
            className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all duration-300 border ${
              userCheckedIn
                ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                : `bg-gradient-to-r ${meta.gradient} text-white border-transparent hover:shadow-lg hover:scale-[1.01]`
            }`}
          >
            {userCheckedIn ? (
              <><CheckCircle2 className="w-5 h-5" /> Checked In ✓</>
            ) : (
              <><Circle className="w-5 h-5" /> Check In Here</>
            )}
          </button>
        </div>

        {/* Reactions Bar */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">React to this event</h3>
          <div className="flex gap-2 flex-wrap">
            {REACTION_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all duration-300 ${
                  userReaction === emoji
                    ? 'bg-orange-500/20 border-orange-500/40 text-white scale-110 shadow-lg'
                    : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-600 hover:scale-105'
                }`}
              >
                <span className="text-lg">{emoji}</span>
                {reactionCounts[emoji] ? <span className="text-xs">{reactionCounts[emoji]}</span> : null}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-900 my-8" />

        {/* Post Form */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            💬 Say something about this event
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Your anonymous name..."
              value={anonName}
              onChange={(e) => setAnonName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-900/80 border border-gray-800 focus:border-orange-500/50 focus:outline-none text-white placeholder:text-gray-600 text-sm"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="What's the vibe?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePost()}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-900/80 border border-gray-800 focus:border-orange-500/50 focus:outline-none text-white placeholder:text-gray-600 text-sm"
              />
              <button
                onClick={handlePost}
                disabled={posting || !postContent.trim() || !anonName.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Live Feed */}
        <div>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            📰 Live Feed
            {posts.length > 0 && <span className="text-gray-600 text-xs font-normal">({posts.length} posts)</span>}
          </h3>
          {posts.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/40 rounded-2xl border border-gray-800 border-dashed">
              <p className="text-gray-600 text-sm">No posts yet. Be the first to share your vibe!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{post.anonymous_name.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-300">{post.anonymous_name}</span>
                    <span className="text-gray-700 text-xs ml-auto">
                      {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed pl-9">{post.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AmisEventDetail;
