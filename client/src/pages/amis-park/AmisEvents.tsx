import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft, Loader2, Ghost, MapPin, Users, Flame, X } from 'lucide-react';
import { useAmisEvents } from './useAmisData';
import { EventCategory, CATEGORY_META } from './types';

const ALL_CATEGORIES: (EventCategory | 'all')[] = ['all', 'experience', 'intellectual', 'cultural', 'gaming', 'entertainment', 'special'];

const BLOCKS = [
  { id: 'A', name: 'Main Building', emoji: '🏛️', accent: 'from-rose-500 to-orange-500' },
  { id: 'B', name: 'Architecture Building', emoji: '🏗️', accent: 'from-blue-500 to-cyan-500' },
  { id: 'C', name: 'ABS', emoji: '🎓', accent: 'from-violet-500 to-purple-500' },
];

export const AmisEvents: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter');
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<EventCategory | 'all'>(
    initialFilter === 'gaming' ? 'gaming' : 'all'
  );

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const { events, loading } = useAmisEvents(activeCategory, searchQuery);

  const filteredEvents = useMemo(() => events, [events]);

  const isFilterActive = activeCategory !== 'all' || searchQuery.trim().length > 0;

  return (
    <div className="h-full w-full bg-transparent text-white flex flex-col relative overflow-hidden">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-25%] right-[-15%] w-[55%] h-[55%] rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(circle, rgba(255,0,127,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[45%] h-[45%] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)' }} />
      </div>

      {/* === COMPACT HEADER === */}
      <div className="flex-none px-4 pt-4 pb-2 z-40 sticky top-0 bg-black/70 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-3xl mx-auto">
          {/* Top row: back + title + search toggle */}
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate('/amis-park')} className="p-2 rounded-full bg-white/[0.04] border border-white/[0.06] hover:border-neon/30 hover:text-neon transition-all shrink-0">
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-black tracking-tight">
                Explore <span className="text-neon">Events</span>
              </h1>
            </div>
            <button
              onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery(''); }}
              className={`p-2 rounded-full border transition-all shrink-0 ${searchOpen ? 'bg-neon/10 border-neon/30 text-neon' : 'bg-white/[0.04] border-white/[0.06] text-gray-400 hover:text-white'}`}
            >
              {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
          </div>

          {/* Search bar (expandable) */}
          {searchOpen && (
            <div className="mb-3">
              <input
                autoFocus
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] focus:border-neon/30 focus:outline-none text-white placeholder:text-gray-600 text-xs font-medium transition-all"
              />
            </div>
          )}

          {/* Category pills — single scrollable row */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {ALL_CATEGORIES.map(cat => {
              const isActive = activeCategory === cat;
              const meta = cat === 'all' ? { label: 'All', emoji: '✦' } : CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 text-white border border-white/15'
                      : 'text-gray-500 hover:text-gray-300 border border-transparent'
                  }`}
                >
                  <span className="text-xs">{meta.emoji}</span>
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* === SCROLLABLE CONTENT === */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10">
        <div className="px-4 py-5 max-w-3xl mx-auto pb-28 md:pb-8">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-7 h-7 text-neon animate-spin" />
              <p className="text-gray-600 text-[10px] uppercase tracking-widest font-bold">Loading events...</p>
            </div>
          )}

          {/* Events */}
          {!loading && (
            <>
              {isFilterActive ? (
                /* Filtered: flat list */
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-2">
                    {filteredEvents.length} result{filteredEvents.length !== 1 ? 's' : ''}
                  </p>
                  {filteredEvents.map((event, i) => (
                    <EventCard key={event.id} event={event} i={i} mounted={mounted} navigate={navigate} />
                  ))}
                </div>
              ) : (
                /* Default: grouped by block — accordion style */
                <div className="space-y-6">
                  {BLOCKS.map(block => {
                    const blockEvents = filteredEvents.filter(e => e.zone === block.id);
                    if (blockEvents.length === 0) return null;
                    return (
                      <BlockSection
                        key={block.id}
                        block={block}
                        events={blockEvents}
                        mounted={mounted}
                        navigate={navigate}
                      />
                    );
                  })}

                  {/* Unassigned events */}
                  {(() => {
                    const noBlockEvents = filteredEvents.filter(e => !e.zone);
                    if (noBlockEvents.length === 0) return null;
                    return (
                      <BlockSection
                        block={{ id: '?', name: 'Other Events', emoji: '📌', accent: 'from-gray-500 to-gray-600' }}
                        events={noBlockEvents}
                        mounted={mounted}
                        navigate={navigate}
                      />
                    );
                  })()}
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!loading && filteredEvents.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-14 h-14 bg-gray-900/50 rounded-full flex items-center justify-center mb-4 border border-gray-800">
                <Ghost className="w-7 h-7 text-gray-700" />
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

/* ─── Block Section ─── */
interface BlockSectionProps {
  block: { id: string; name: string; emoji: string; accent: string };
  events: any[];
  mounted: boolean;
  navigate: (path: string) => void;
}

const BlockSection: React.FC<BlockSectionProps> = ({ block, events, mounted, navigate }) => {
  return (
    <div>
      {/* Block header — compact pill style */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${block.accent} flex items-center justify-center text-sm shadow-lg`}>
          {block.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black text-white tracking-tight">{block.name}</h2>
        </div>
        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest shrink-0">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Events — clean list */}
      <div className="space-y-2.5">
        {events.map((event, i) => (
          <EventCard key={event.id} event={event} i={i} mounted={mounted} navigate={navigate} compact />
        ))}
      </div>
    </div>
  );
};

/* ─── Event Card ─── */
interface EventCardProps {
  event: any;
  i: number;
  mounted: boolean;
  navigate: (path: string) => void;
  compact?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, i, mounted, navigate, compact }) => {
  const meta = CATEGORY_META[event.category as EventCategory];
  const crowd = getCrowdLevel(event.checkin_count || 0);

  return (
    <button
      onClick={() => navigate(`/amis-park/event/${event.id}`)}
      className={`group w-full text-left relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.1] rounded-xl transition-all duration-300 overflow-hidden ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${compact ? 'p-3.5' : 'p-4'}`}
      style={{ transitionDelay: `${Math.min(i, 8) * 40}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* Left: category badge */}
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-sm shadow-md shrink-0 mt-0.5`}>
          {meta.emoji}
        </div>

        {/* Middle: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-[13px] font-bold text-white truncate leading-tight">{event.name}</h3>
            {event.is_trending && (
              <span className="shrink-0 flex items-center gap-0.5 text-neon text-[8px] font-black uppercase tracking-wider">
                <Flame className="w-2.5 h-2.5" /> Hot
              </span>
            )}
          </div>
          {!compact && event.description && (
            <p className="text-gray-500 text-[11px] line-clamp-1 leading-relaxed mb-1">{event.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-[9px] font-bold ${crowd.color} flex items-center gap-0.5`}>
              {crowd.flames} {crowd.label}
            </span>
            {event.zone && (
              <span className="text-[9px] font-bold text-gray-600 flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" /> Block {event.zone}
              </span>
            )}
            <span className="text-[9px] font-bold text-gray-700 flex items-center gap-0.5">
              <Users className="w-2.5 h-2.5" /> {event.checkin_count || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Hover accent */}
      <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${meta.gradient} opacity-0 group-hover:opacity-[0.04] rounded-bl-full transition-opacity duration-300`} />
    </button>
  );
};

/* ─── Helpers ─── */
function getCrowdLevel(count: number) {
  if (count >= 20) return { label: 'Packed', color: 'text-red-400', flames: '🔥🔥🔥' };
  if (count >= 10) return { label: 'Hot', color: 'text-orange-400', flames: '🔥🔥' };
  if (count >= 3) return { label: 'Warm', color: 'text-yellow-400', flames: '🔥' };
  return { label: 'Chill', color: 'text-emerald-400', flames: '✨' };
}

export default AmisEvents;
