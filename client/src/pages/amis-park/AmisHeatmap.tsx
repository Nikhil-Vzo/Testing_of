import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Users, MapPin, Loader2, Info, Ghost, Smartphone } from 'lucide-react';
import { useAmisEvents } from './useAmisData';

// Map structure definition — positions are relative to the map image container
const ZONES = [
  { id: 'A', name: 'High Energy', position: { top: '45%', left: '15%' }, desc: 'Main Stage & Experiences' },
  { id: 'B', name: 'Interactive', position: { top: '25%', left: '48%' }, desc: 'Creative & Interactive' },
  { id: 'C', name: 'Chill Hub', position: { top: '35%', left: '82%' }, desc: 'Cultural & Intellectual' },
];

export const AmisHeatmap: React.FC = () => {
  const navigate = useNavigate();
  const { events, loading } = useAmisEvents('all', '');
  const [mounted, setMounted] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  // Aggregate check-ins per zone
  const zoneStats = useMemo(() => {
    const stats: Record<string, { checkins: number, events: number }> = {};
    ZONES.forEach(z => stats[z.id] = { checkins: 0, events: 0 });

    events.forEach(event => {
      if (event.zone && stats[event.zone]) {
        stats[event.zone].checkins += (event.checkin_count || 0);
        stats[event.zone].events += 1;
      }
    });

    return stats;
  }, [events]);

  const getHeatStyle = (checkins: number) => {
    if (checkins >= 30) return { coreColor: '#ef4444', shadow: 'shadow-[0_0_40px_currentColor]', level: 'Packed', icon: <Flame className="w-4 h-4" /> };
    if (checkins >= 15) return { coreColor: '#f97316', shadow: 'shadow-[0_0_30px_currentColor]', level: 'Hot', icon: <Flame className="w-4 h-4 opacity-80" /> };
    if (checkins >= 5) return { coreColor: '#eab308', shadow: 'shadow-[0_0_20px_currentColor]', level: 'Warm', icon: <Flame className="w-4 h-4 opacity-60" /> };
    return { coreColor: '#10b981', shadow: 'shadow-[0_0_15px_currentColor]', level: 'Chill', icon: <MapPin className="w-4 h-4" /> };
  };

  const selectedZoneData = ZONES.find(z => z.id === selectedZone);
  const selectedZoneStats = selectedZone ? zoneStats[selectedZone] : null;

  return (
    <div className="h-full w-full bg-[#05000a] text-white flex flex-col relative overflow-hidden">

      {/* === HEADER === */}
      <div className="flex-none p-4 md:px-8 border-b border-gray-800/50 bg-black/40 backdrop-blur-2xl z-40 relative">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/amis-park')} className="p-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 hover:border-neon/30 hover:text-neon transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">
              Live <span className="text-neon">Heatmap</span>
            </h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Zone Crowd Visualization</p>
          </div>
          {loading && <Loader2 className="w-5 h-5 text-neon animate-spin" />}
        </div>
      </div>

      {/* === SCROLLABLE CONTENT === */}
      <div className="flex-1 flex flex-col relative z-10 w-full overflow-y-auto overflow-x-hidden">

        {/* Map Container — landscape-ratio box with the image and zone overlays */}
        <div className={`relative w-full transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          
          {/* Force a landscape aspect ratio so the map always looks good */}
          <div className="relative w-full" style={{ paddingBottom: '66%' }}>
            {/* Map Image */}
            <img 
              src="/map.webp" 
              alt="Campus Map" 
              className="absolute inset-0 w-full h-full object-cover opacity-80" 
            />
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#05000a]/70 via-transparent to-[#05000a]/70" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

            {/* Legend */}
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2.5 z-10 hidden sm:block">
              <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Heat Index</h3>
              <div className="space-y-2">
                {[
                  { label: 'Packed', color: 'bg-red-500' },
                  { label: 'Hot', color: 'bg-orange-500' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${l.color} shadow-[0_0_8px]`} style={{ color: l.color.replace('bg-', '') }} />
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone Markers — positioned inside the aspect-ratio container */}
            {ZONES.map((zone) => {
              const stats = zoneStats[zone.id];
              const heat = getHeatStyle(stats?.checkins || 0);
              const isSelected = selectedZone === zone.id;
              
              return (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(isSelected ? null : zone.id)}
                  className={`absolute flex flex-col items-center justify-center transition-all duration-300 ease-out z-20 hover:scale-105 active:scale-95 group -translate-x-1/2 -translate-y-1/2 ${isSelected ? 'scale-[1.15] z-30' : ''}`}
                  style={{ top: zone.position.top, left: zone.position.left }}
                >
                  {/* HUD Marker Pill */}
                  <div className={`relative flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full pr-2.5 sm:pr-3 pl-1 sm:pl-1.5 py-1 sm:py-1.5 shadow-2xl transition-all duration-300 ${isSelected ? 'bg-black/80 border-white/30 shadow-[0_10px_40px_rgba(0,0,0,0.8)]' : 'group-hover:border-white/20'}`}>
                    
                    {/* Glowing Core Dot */}
                    <div className="relative flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 rounded-full shrink-0" 
                         style={{ backgroundColor: `${heat.coreColor}20`, boxShadow: `0 0 15px ${heat.coreColor}40` }}>
                      <div className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ backgroundColor: heat.coreColor, animationDuration: '2.5s' }} />
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full relative z-10" style={{ backgroundColor: heat.coreColor, boxShadow: `0 0 10px ${heat.coreColor}` }} />
                    </div>
                    
                    {/* Zone Text Info */}
                    <div className="flex flex-col items-start pr-0.5 sm:pr-1">
                      <span className="text-[8px] sm:text-[9px] font-black tracking-widest uppercase text-white/95 leading-tight mb-0.5">BLOCK {zone.id}</span>
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" />
                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-300">{stats?.checkins || 0}</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Rotate hint for mobile */}
          <div className="flex items-center justify-center gap-2 py-3 text-gray-600 sm:hidden">
            <Smartphone className="w-3.5 h-3.5 rotate-90" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Rotate for best view</span>
          </div>
        </div>

        {/* Selected Zone Sheet */}
        {selectedZone && selectedZoneData && selectedZoneStats && (
          <div className="flex-none bg-black/80 backdrop-blur-2xl border-t border-white/[0.08] p-5 md:p-8 pb-28 md:pb-8 animate-in slide-in-from-bottom-4">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 md:items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center font-black text-xl">
                    {selectedZoneData.id}
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">{selectedZoneData.name}</h2>
                    <p className="text-gray-400 text-xs font-medium">{selectedZoneData.desc}</p>
                  </div>
                </div>
              </div>

              {(() => {
                const heatStyle = getHeatStyle(selectedZoneStats.checkins);
                return (
              <div className="flex gap-4 items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Status</span>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg">
                    <span className="flex items-center text-sm" style={{ color: heatStyle.coreColor }}>{heatStyle.icon}</span>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: heatStyle.coreColor }}>
                      {heatStyle.level}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Stats</span>
                  <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg">
                    <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-gray-400" /><span className="font-bold text-xs text-white">{selectedZoneStats.checkins}</span></div>
                    <div className="w-px h-3 bg-gray-700" />
                    <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" /><span className="font-bold text-xs text-white">{selectedZoneStats.events} events</span></div>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/amis-park/events?filter=gaming`)}
                  className="ml-auto px-5 py-3 rounded-xl bg-neon text-white font-bold text-xs uppercase tracking-widest hover:bg-pink-600 transition-colors hidden md:block shadow-[0_0_20px_rgba(255,0,127,0.3)]"
                >
                  View Events
                </button>
              </div>
              );
            })()}

              <button 
                onClick={() => navigate(`/amis-park/events`)}
                className="w-full px-5 py-3 rounded-xl bg-neon text-white font-bold text-xs uppercase tracking-widest hover:bg-pink-600 transition-colors md:hidden shadow-[0_0_20px_rgba(255,0,127,0.3)] mt-2"
              >
                View Events
              </button>
              
            </div>
          </div>
        )}
        
        {/* Placeholder when no zone selected */}
        {!selectedZone && (
          <div className="py-6 flex justify-center">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
              <Info className="w-4 h-4" /> Tap a zone to view details
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AmisHeatmap;
