import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Flame, Zap, Gamepad2, MapPin, Users, ArrowLeft, Loader2, Ghost } from 'lucide-react';
import { useAmisEvents } from './useAmisData';
import { EventCategory, CATEGORY_META } from './types';

const ALL_CATEGORIES: (EventCategory | 'all')[] = ['all', 'experience', 'intellectual', 'cultural', 'gaming', 'entertainment', 'special'];

const QUICK_FILTERS = [
  { id: 'trending', label: '🔥 Trending' },
  { id: 'intense', label: '😱 Most Intense' },
  { id: 'gaming', label: '🎮 Gaming Only' },
];

export const AmisEvents: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const [activeCategory, setActiveCategory] = useState<EventCategory | 'all'>(
    initialFilter === 'gaming' ? 'gaming' : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<string | null>(initialFilter);

  const { events, loading } = useAmisEvents(activeCategory, searchQuery);

  const filteredEvents = useMemo(() => {
    let filtered = events;
    if (quickFilter === 'trending') filtered = filtered.filter(e => e.is_trending);
    if (quickFilter === 'intense') filtered = [...filtered].sort((a, b) => (b.checkin_count || 0) - (a.checkin_count || 0));
    if (quickFilter === 'gaming') filtered = filtered.filter(e => e.category === 'gaming');
    return filtered;
  }, [events, quickFilter]);

  const getCrowdLevel = (count: number) => {
    if (count >= 20) return { label: 'Packed', color: 'text-red-400', flames: '🔥🔥🔥', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]' };
    if (count >= 10) return { label: 'Hot', color: 'text-orange-400', flames: '🔥🔥', glow: 'shadow-[0_0_8px_rgba(251,146,60,0.2)]' };
    if (count >= 3) return { label: 'Warm', color: 'text-yellow-400', flames: '🔥', glow: '' };
    return { label: 'Chill', color: 'text-emerald-400', flames: '✨', glow: '' };
  };

  return (
    <div className="h-full w-full bg-transparent text-white flex flex-col relative overflow-hidden">

      {/* === REACTIVE BACKGROUND === */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-25%] right-[-15%] w-[55%] h-[55%] rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(circle, rgba(255,0,127,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[45%] h-[45%] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '256px 256px' }} />
      </div>

      {/* === STICKY HEADER === */}
      <div className="flex-none p-4 md:px-8 border-b border-gray-800/50 bg-black/40 backdrop-blur-2xl z-40 sticky top-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate('/amis-park')} className="p-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 hover:border-neon/30 hover:text-neon transition-all">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">
                Events <span className="text-neon">Explorer</span>
              </h1>
              <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">{filteredEvents.length} events found</p>
            </div>
            <Ghost className="w-6 h-6 text-neon/30" />
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setQuickFilter(null); }}
              className="w-full pl-11 pr-4 py-3 rounded-full bg-black/60 backdrop-blur-xl border border-white/[0.06] focus:border-neon/30 focus:outline-none focus:shadow-[0_0_20px_rgba(255,0,127,0.1)] text-white placeholder:text-gray-600 text-xs font-medium transition-all"
            />
          </div>

          {/* Quick Filters + Category Tabs in one row on desktop */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => {
                  setQuickFilter(quickFilter === f.id ? null : f.id);
                  if (f.id === 'gaming') setActiveCategory(quickFilter === f.id ? 'all' : 'gaming');
                }}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 ${
                  quickFilter === f.id
                    ? 'bg-neon/10 border-neon/30 text-neon shadow-[0_0_15px_rgba(255,0,127,0.15)]'
                    : 'bg-black/40 border-white/[0.06] text-gray-500 hover:border-gray-700 hover:text-gray-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* === CATEGORY TABS === */}
      <div className="flex-none px-4 md:px-8 py-3 bg-black/20 backdrop-blur-md border-b border-gray-900/50 z-30">
        <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide">
          {ALL_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat;
            const meta = cat === 'all' ? { label: 'All', emoji: '🌐', gradient: 'from-gray-400 to-gray-500' } : CATEGORY_META[cat];
            return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setQuickFilter(null); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all duration-300 ${
                  isActive
                    ? 'bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                    : 'bg-transparent border-transparent text-gray-600 hover:text-gray-400 hover:bg-white/[0.03]'
                }`}
              >
                <span className="text-sm">{meta.emoji}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* === SCROLLABLE CONTENT === */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10">
        <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto pb-28 md:pb-8">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-neon animate-spin" />
              <p className="text-gray-600 text-xs uppercase tracking-widest font-bold">Loading events...</p>
            </div>
          )}

          {/* Event Cards Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {filteredEvents.map((event, i) => {
                const meta = CATEGORY_META[event.category];
                const crowd = getCrowdLevel(event.checkin_count || 0);

                return (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/amis-park/event/${event.id}`)}
                    className={`group relative bg-black/40 backdrop-blur-2xl border border-white/[0.06] hover:border-neon/20 rounded-2xl p-5 cursor-pointer transition-all duration-500 hover:scale-[1.02] overflow-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                    style={{ transitionDelay: `${i * 50}ms` }}
                  >
                    {/* Hover glow */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                      style={{ boxShadow: `inset 0 0 40px ${meta.bgGlow.replace('0.3', '0.05')}, 0 0 50px ${meta.bgGlow.replace('0.3', '0.06')}` }}
                    />

                    {/* Trending badge */}
                    {event.is_trending && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-neon/10 border border-neon/20 rounded-full text-neon text-[9px] font-bold uppercase tracking-wider z-10">
                        <Flame className="w-2.5 h-2.5" /> Hot
                      </div>
                    )}

                    {/* Category badge */}
                    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r ${meta.gradient} text-white text-[10px] font-bold uppercase tracking-wider mb-3 shadow-sm`}>
                      <span className="text-xs">{meta.emoji}</span>
                      <span>{meta.label}</span>
                    </div>

                    {/* Event name */}
                    <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-white transition-colors leading-tight tracking-tight">
                      {event.name}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        {/* Crowd level */}
                        <div className={`flex items-center gap-1 ${crowd.glow}`}>
                          <span className="text-xs">{crowd.flames}</span>
                          <span className={`text-[10px] font-bold ${crowd.color}`}>{crowd.label}</span>
                        </div>

                        {/* Zone */}
                        {event.zone && (
                          <div className="flex items-center gap-1 text-gray-700">
                            <MapPin className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Zone {event.zone}</span>
                          </div>
                        )}
                      </div>

                      {/* Checkin count */}
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="w-3 h-3" />
                        <span className="text-[10px] font-bold">{event.checkin_count || 0}</span>
                      </div>
                    </div>

                    {/* Corner decoration */}
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${meta.gradient} opacity-[0.02] group-hover:opacity-[0.06] rounded-bl-full transition-opacity duration-500`} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredEvents.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-900/50 rounded-full flex items-center justify-center mb-4 border border-gray-800">
                <Ghost className="w-8 h-8 text-gray-700" />
              </div>
              <p className="text-gray-500 text-sm font-bold mb-1">No events found</p>
              <p className="text-gray-700 text-xs">Try a different search or category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AmisEvents;
