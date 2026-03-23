import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Flame, Zap, Gamepad2, MapPin, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { useAmisEvents } from './useAmisData';
import { EventCategory, CATEGORY_META } from './types';

const ALL_CATEGORIES: (EventCategory | 'all')[] = ['all', 'experience', 'intellectual', 'cultural', 'gaming', 'entertainment', 'special'];

const QUICK_FILTERS = [
  { id: 'trending', label: '🔥 Trending', icon: Flame },
  { id: 'intense', label: '😱 Most Intense', icon: Zap },
  { id: 'gaming', label: '🎮 Gaming Only', icon: Gamepad2 },
];

export const AmisEvents: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter');

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
    if (count >= 20) return { label: 'Packed', color: 'text-red-400', flames: '🔥🔥🔥' };
    if (count >= 10) return { label: 'Hot', color: 'text-orange-400', flames: '🔥🔥' };
    if (count >= 3) return { label: 'Warm', color: 'text-yellow-400', flames: '🔥' };
    return { label: 'Chill', color: 'text-green-400', flames: '✨' };
  };

  return (
    <div className="h-full bg-black text-white overflow-y-auto overflow-x-hidden pb-24 md:pb-8">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-bl from-orange-500/15 to-transparent blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-purple-600/10 to-transparent blur-[100px]" />
      </div>

      <div className="relative z-10 px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/amis-park')} className="p-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-orange-500/40 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Events</span> Explorer
            </h1>
            <p className="text-gray-500 text-sm">{filteredEvents.length} events found</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setQuickFilter(null); }}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-900/80 border border-gray-800 focus:border-orange-500/50 focus:outline-none text-white placeholder:text-gray-600 text-sm transition-colors backdrop-blur-xl"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {QUICK_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => {
                setQuickFilter(quickFilter === f.id ? null : f.id);
                if (f.id === 'gaming') setActiveCategory(quickFilter === f.id ? 'all' : 'gaming');
              }}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300 ${
                quickFilter === f.id
                  ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                  : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Category Tabs — Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {ALL_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat;
            const meta = cat === 'all' ? { label: 'All', emoji: '🌐', gradient: 'from-gray-400 to-gray-500' } : CATEGORY_META[cat];
            return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setQuickFilter(null); }}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all duration-300 ${
                  isActive
                    ? `bg-gradient-to-r ${meta.gradient} text-white border-transparent shadow-lg`
                    : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        )}

        {/* Event Cards Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredEvents.map((event, i) => {
              const meta = CATEGORY_META[event.category];
              const crowd = getCrowdLevel(event.checkin_count || 0);

              return (
                <div
                  key={event.id}
                  onClick={() => navigate(`/amis-park/event/${event.id}`)}
                  className="group relative bg-gray-900/70 backdrop-blur-xl border border-gray-800 hover:border-gray-600 rounded-2xl p-5 cursor-pointer transition-all duration-500 hover:scale-[1.02] overflow-hidden"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl -z-10" style={{ background: meta.bgGlow, transform: 'scale(1.1)' }} />

                  {/* Trending badge */}
                  {event.is_trending && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-[10px] font-bold uppercase tracking-wider">
                      <Flame className="w-3 h-3" /> Trending
                    </div>
                  )}

                  {/* Category badge */}
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r ${meta.gradient} text-white text-xs font-bold mb-3 shadow-sm`}>
                    <span>{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </div>

                  {/* Event name */}
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-white transition-colors leading-tight">
                    {event.name}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>

                  {/* Stats row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Crowd level */}
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{crowd.flames}</span>
                        <span className={`text-xs font-bold ${crowd.color}`}>{crowd.label}</span>
                      </div>

                      {/* Zone */}
                      {event.zone && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span className="text-xs font-bold">Zone {event.zone}</span>
                        </div>
                      )}
                    </div>

                    {/* Checkin count */}
                    <div className="flex items-center gap-1 text-gray-500">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{event.checkin_count || 0}</span>
                    </div>
                  </div>

                  {/* Corner decoration */}
                  <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl ${meta.gradient} opacity-[0.03] group-hover:opacity-[0.08] rounded-bl-full transition-opacity duration-500`} />
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredEvents.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-2">No events found</p>
            <p className="text-gray-600 text-sm">Try a different search or category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmisEvents;
