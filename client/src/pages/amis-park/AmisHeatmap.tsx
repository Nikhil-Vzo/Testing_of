import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Users, MapPin, Loader2, Info, Ghost } from 'lucide-react';
import { useAmisEvents } from './useAmisData';

// Map structure definition
const ZONES = [
  { id: 'A', name: 'Zone A', position: 'top-[10%] left-[10%]', size: 'w-40 h-40', desc: 'Main Stage & Experiences' },
  { id: 'B', name: 'Zone B', position: 'top-[15%] right-[10%]', size: 'w-32 h-32', desc: 'Intellectual & Tech' },
  { id: 'C', name: 'Zone C', position: 'bottom-[20%] left-[15%]', size: 'w-36 h-36', desc: 'Cultural & Performing' },
  { id: 'D', name: 'Zone D', position: 'bottom-[15%] right-[20%]', size: 'w-28 h-28', desc: 'Gaming & Fun' },
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
    if (checkins >= 30) return { coreColor: '#ef4444', shadow: 'shadow-[0_0_40px_currentColor]', level: 'Packed', icon: '🔥🔥🔥' };
    if (checkins >= 15) return { coreColor: '#f97316', shadow: 'shadow-[0_0_30px_currentColor]', level: 'Hot', icon: '🔥🔥' };
    if (checkins >= 5) return { coreColor: '#eab308', shadow: 'shadow-[0_0_20px_currentColor]', level: 'Warm', icon: '🔥' };
    return { coreColor: '#10b981', shadow: 'shadow-[0_0_15px_currentColor]', level: 'Chill', icon: '✨' };
  };

  const selectedZoneData = ZONES.find(z => z.id === selectedZone);
  const selectedZoneStats = selectedZone ? zoneStats[selectedZone] : null;

  return (
    <div className="h-full w-full bg-transparent text-white flex flex-col relative overflow-hidden">
      
      {/* === BACKGROUND === */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-black">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '128px 128px' }} />
        {/* Animated grid lines mimicking a radar/map */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

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

      {/* === CONTENT === */}
      <div className="flex-1 flex flex-col relative z-10 w-full max-w-4xl mx-auto">
        
        {/* Interactive Map Area (Viewport relative) */}
        <div className={`relative flex-1 min-h-[400px] w-full transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          
          {/* Legend */}
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 z-10 hidden sm:block">
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

          {/* Zones */}
          {ZONES.map((zone) => {
            const stats = zoneStats[zone.id];
            const heat = getHeatStyle(stats?.checkins || 0);
            const isSelected = selectedZone === zone.id;
            
            return (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(isSelected ? null : zone.id)}
                className={`absolute ${zone.position} ${zone.size} flex flex-col items-center justify-center transition-all duration-500 ease-out z-20 hover:scale-110 active:scale-95 group ${isSelected ? 'scale-110 z-30' : ''}`}
              >
                {/* Mascot Background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Ghost 
                    className={`w-full h-full opacity-40 group-hover:opacity-60 transition-all duration-500 ${isSelected ? 'animate-pulse opacity-80' : ''}`} 
                    style={{ 
                        color: heat.coreColor,
                        filter: `drop-shadow(0 0 15px currentColor) drop-shadow(0 0 30px currentColor)`
                    }}
                    strokeWidth={1}
                  />
                </div>
                
                {/* Intense Core Glow for selected */}
                {isSelected && (
                  <div className="absolute inset-0 rounded-full blur-2xl opacity-40 transition-opacity duration-500 pointer-events-none" style={{ backgroundColor: heat.coreColor }} />
                )}

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center mt-4">
                  <span className="text-4xl font-black drop-shadow-[0_4px_8px_rgba(0,0,0,1)] text-white/90">
                    {zone.id}
                  </span>
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-xl mt-1">
                    <Users className="w-3.5 h-3.5 text-gray-300" />
                    <span className="text-xs font-bold text-white tracking-widest">{stats?.checkins || 0}</span>
                  </div>
                </div>
              </button>
            )
          })}
          
          {/* Connection lines (decorative SVG background) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none">
            <polyline points="20%,25% 85%,30%" stroke="white" strokeWidth="1" strokeDasharray="4 4" fill="none" />
            <polyline points="20%,25% 25%,85%" stroke="white" strokeWidth="1" strokeDasharray="4 4" fill="none" />
            <polyline points="85%,30% 70%,85%" stroke="white" strokeWidth="1" strokeDasharray="4 4" fill="none" />
          </svg>
        </div>

        {/* Selected Zone Sheet (Bottom) */}
        <div className={`flex-none bg-black/80 backdrop-blur-2xl border-t border-white/[0.08] p-5 md:p-8 transition-transform duration-500 ease-out relative pb-28 md:pb-8 ${selectedZone ? 'translate-y-0' : 'translate-y-full absolute bottom-0 left-0 right-0 invisible'}`}>
          {selectedZoneData && selectedZoneStats && (
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
                    <span className="text-sm">{heatStyle.icon}</span>
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
                  onClick={() => navigate(`/amis-park/events?filter=gaming`)} // Simplified for MVP since we don't have a zone filter param yet. In real app, we'd pass ?zone=A
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
          )}
        </div>
        
        {/* Placeholder when no zone selected */}
        {!selectedZone && (
          <div className="absolute bottom-28 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse max-w-[80vw] mx-auto z-10">
            <Info className="w-4 h-4" /> Tap a zone to view details
          </div>
        )}

      </div>
    </div>
  );
};

export default AmisHeatmap;
