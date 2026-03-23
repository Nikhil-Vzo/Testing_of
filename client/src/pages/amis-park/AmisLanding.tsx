import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MapPin, Radio, ArrowRight, Flame } from 'lucide-react';

export const AmisLanding: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    { label: 'Explore Events', desc: 'Browse all fest events by category', icon: Sparkles, path: '/amis-park/events' },
    { label: 'See Live Crowd', desc: 'Check which zones are buzzing', icon: Radio, path: '/amis-park/events?filter=trending' },
    { label: 'Jump to Feed', desc: 'See what people are saying', icon: MapPin, path: '/amis-park/events' },
  ];

  return (
    <div className="h-full bg-black text-white overflow-y-auto overflow-x-hidden pb-24 md:pb-8">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-25%] left-[-15%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-orange-500/20 via-red-500/10 to-transparent blur-[140px]" style={{ animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full bg-gradient-to-tl from-purple-600/15 via-pink-500/10 to-transparent blur-[120px]" style={{ animation: 'pulse 10s ease-in-out infinite' }} />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[30%] h-[30%] rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 blur-[100px]" style={{ animation: 'pulse 6s ease-in-out infinite' }} />
      </div>

      <div className="relative z-10 px-4 md:px-8 py-12 md:py-20 max-w-4xl mx-auto flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-medium mb-8 animate-pulse" style={{ animationDuration: '3s' }}>
          <Flame className="w-4 h-4" />
          <span>Live Now</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-center leading-[0.9] mb-6">
          <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">AMIS</span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">PARK</span>
        </h1>

        {/* Subtitle */}
        <p className="text-gray-400 text-center text-lg md:text-xl max-w-lg mb-4 leading-relaxed">
          Your digital festival map. Explore events, feel the crowd energy, and find your vibe.
        </p>
        <p className="text-gray-600 text-sm text-center mb-12 tracking-widest uppercase font-bold">
          Powered by OthrHalff
        </p>

        {/* Action Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="group relative bg-gray-900/60 backdrop-blur-xl border border-gray-800 hover:border-orange-500/40 rounded-2xl p-6 text-left transition-all duration-500 hover:scale-[1.03] overflow-hidden"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    {action.label}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-orange-400" />
                  </h3>
                  <p className="text-gray-500 text-sm">{action.desc}</p>
                </div>

                {/* Corner decoration */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </button>
            );
          })}
        </div>

        {/* Bottom tag */}
        <p className="mt-16 text-gray-700 text-xs tracking-[0.3em] uppercase font-bold text-center">
          🎪 Walk through a digital festival map
        </p>
      </div>
    </div>
  );
};

export default AmisLanding;
