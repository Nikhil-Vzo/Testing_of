import React, { useState } from 'react';
import { Film, Music, Gamepad2, Layers, Stars, Zap, Heart, ArrowRight, Lock, Sparkles, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VirtualDate: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const dates = [
    {
      id: 'cinema',
      title: 'Movie Night',
      desc: 'Watch YouTube videos or short films together in a synchronized private room. Feel the magic of cinema from anywhere.',
      icon: Film,
      gradient: 'from-[#ff007f] to-[#7928ca]',
      borderColor: 'group-hover:border-[#ff007f]/50',
      glow: 'rgba(255, 0, 127, 0.4)',
      available: true,
      bentoClass: 'md:col-span-2 lg:col-span-2 md:row-span-1',
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: 'music',
      title: 'Soul Sync',
      desc: 'Create a private room and sing like karaoke with live synced lyrics.',
      icon: Music,
      gradient: 'from-[#8a2be2] to-[#4b0082]',
      borderColor: 'group-hover:border-[#8a2be2]/50',
      glow: 'rgba(138, 43, 226, 0.4)',
      available: true,
      bentoClass: 'md:col-span-2 lg:col-span-2 md:row-span-1',
      image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'games',
      title: 'Neon Arcade',
      desc: 'Compete in fast-paced mini-games.',
      icon: Gamepad2,
      gradient: 'from-[#00f2fe] to-[#4facfe]',
      borderColor: 'group-hover:border-[#00f2fe]/50',
      glow: 'rgba(0, 242, 254, 0.4)',
      available: false,
      bentoClass: 'md:col-span-1 lg:col-span-1 md:row-span-1',
    },
    {
      id: 'cards',
      title: 'The Deck',
      desc: 'Spark meaningful deep conversations.',
      icon: Layers,
      gradient: 'from-[#ff0844] to-[#ffb199]',
      borderColor: 'group-hover:border-[#ff0844]/50',
      glow: 'rgba(255, 8, 68, 0.4)',
      available: false,
      bentoClass: 'md:col-span-1 lg:col-span-1 md:row-span-1',
    },

  ];

  const handleDateClick = (id: string, available: boolean) => {
    if (available) {
      navigate(`/virtual-date/${id}`);
    }
  };

  return (
    <div className="h-full bg-[#03000a] text-white overflow-y-auto overflow-x-hidden pb-24 md:pb-12 virtual-date-container">
      {/* Ambient background orbs - Optimized for performance */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle_at_center,_rgba(79,70,229,0.15)_0%,_transparent_70%)] will-change-transform animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(circle_at_center,_rgba(219,39,119,0.15)_0%,_transparent_70%)] will-change-transform animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle_at_center,_rgba(91,33,182,0.15)_0%,_transparent_70%)] will-change-transform animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 px-4 md:px-8 py-12 md:py-20 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col items-center md:items-start mb-16 text-center md:text-left">

          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500">
            Virtual Dates
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed font-light">
            Transcend distance. Share synchronized cinema, music, and interactive spaces together.
          </p>
        </div>

        {/* Bento Box Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-[minmax(240px,auto)]">
          {dates.map((date, index) => {
            const Icon = date.icon;
            const isHovered = hoveredCard === date.id;
            const isCinema = date.id === 'cinema';
            const isHero = date.id === 'cinema' || date.id === 'music';

            return (
              <div
                key={date.id}
                className={`group relative rounded-[2rem] overflow-hidden transition-all duration-300 ${date.available ? 'cursor-pointer hover:scale-[1.01]' : 'opacity-70'} ${date.bentoClass}`}
                onMouseEnter={() => setHoveredCard(date.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleDateClick(date.id, date.available)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Background Image/Overlay for larger cards */}
                {date.image && (
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <img 
                      src={date.image} 
                      alt={date.title} 
                      className="w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050012] via-[#050012]/80 to-transparent" />
                  </div>
                )}

                {/* Card glow effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl -z-10"
                  style={{ background: date.glow }}
                />

                {/* Glass Background */}
                <div className={`relative z-10 w-full h-full bg-white/5 backdrop-blur-xl border border-white/10 group-hover:bg-white/10 ${date.borderColor} p-8 flex flex-col transition-all duration-300`}>
                  
                  {/* Top Header: Icon & Title */}
                  <div className="flex items-start justify-between mb-auto">
                    <div className="flex flex-col gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${date.gradient} p-[1px] shadow-2xl group-hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300`}>
                        <div className="w-full h-full bg-[#050012]/80 backdrop-blur-md rounded-2xl flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <h2 className={`font-bold tracking-tight text-white ${isHero ? 'text-4xl' : 'text-2xl'}`}>
                        {date.title}
                      </h2>
                    </div>
                    {date.available ? (
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 delay-100">
                        <ArrowRight className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5 text-xs font-medium text-white/50 backdrop-blur-md">
                        <Lock className="w-3 h-3" />
                        SOON
                      </div>
                    )}
                  </div>

                  {/* Bottom Content: Desc & CTA */}
                  <div className="mt-6">
                    <p className={`text-white/60 font-light leading-relaxed mb-6 group-hover:text-white/80 transition-colors ${isHero ? 'text-lg max-w-md' : 'text-sm'}`}>
                      {date.desc}
                    </p>
                    
                    {date.available && date.id === 'cinema' && (
                      <button className="flex w-max items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all duration-300">
                        <Play className="w-4 h-4 fill-white" />
                        Enter Theatre
                      </button>
                    )}
                    {date.available && date.id === 'music' && (
                      <button className="flex w-max items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all duration-300">
                        <Music className="w-4 h-4 text-white" />
                        Enter Studio
                      </button>
                    )}
                    {date.available && !isHero && (
                      <button className="flex w-max items-center gap-2 text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
                        Launch Experience <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Subtle decorative gradient slash */}
                  <div className={`absolute -bottom-24 -right-24 w-48 h-48 bg-gradient-to-br ${date.gradient} rounded-full blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
                </div>
              </div>
            );
          })}

          {/* More Coming Bento Box */}
          <div className="group relative rounded-[2rem] overflow-hidden md:col-span-2 lg:col-span-2 md:row-span-1 border border-white/5 bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
            <div className="relative z-10 text-center p-8 flex flex-col items-center">
               <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                 <Zap className="w-5 h-5 text-white/40" />
               </div>
               <h3 className="text-xl font-bold text-white/60 tracking-tight mb-2">More Dimensions Expanding</h3>
               <p className="text-white/40 text-sm">Our engineers are synthesizing new experiences.</p>
            </div>
          </div>

        </div>

        <div className="text-center mt-20 pb-8 flex items-center justify-center gap-3 opacity-50">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-white/30" />
          <Heart className="w-4 h-4 text-white" />
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white/30" />
        </div>
      </div>
    </div>
  );
};

export default VirtualDate;
