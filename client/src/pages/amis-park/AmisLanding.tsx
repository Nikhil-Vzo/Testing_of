import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MapPin, Radio, ArrowRight, Flame, Ghost, Zap } from 'lucide-react';

export const AmisLanding: React.FC = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const actions = [
    { label: 'Explore Events', desc: 'Browse all fest events by category', icon: Sparkles, path: '/amis-park/events', accentClass: 'from-neon to-pink-600', glow: 'rgba(255,0,127,0.4)' },
    { label: 'See Live Crowd', desc: 'Check which zones are buzzing right now', icon: Radio, path: '/amis-park/events?filter=trending', accentClass: 'from-purple-500 to-indigo-500', glow: 'rgba(139,92,246,0.4)' },
    { label: 'Jump to Feed', desc: 'See what people are saying live', icon: MapPin, path: '/amis-park/events', accentClass: 'from-blue-500 to-cyan-500', glow: 'rgba(59,130,246,0.4)' },
  ];

  return (
    <div className="h-full w-full bg-transparent text-white flex flex-col relative overflow-y-auto overflow-x-hidden select-none">

      {/* === REACTIVE BACKGROUND === */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Main neon blob */}
        <div
          className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] rounded-full blur-[150px] animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(255,0,127,0.12) 0%, transparent 70%)', animationDuration: '8s' }}
        />
        {/* Secondary purple blob */}
        <div
          className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[60%] rounded-full blur-[120px] animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', animationDuration: '10s' }}
        />
        {/* Warm accent for festival feel */}
        <div
          className="absolute top-[30%] left-[40%] w-[35%] h-[35%] rounded-full blur-[100px] animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.08) 0%, transparent 70%)', animationDuration: '6s' }}
        />

        {/* Floating particles */}
        <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-neon/40 rounded-full animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }} />
        <div className="absolute top-[25%] right-[25%] w-0.5 h-0.5 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute top-[60%] left-[15%] w-1 h-1 bg-blue-400/30 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        <div className="absolute top-[45%] right-[10%] w-0.5 h-0.5 bg-neon/30 rounded-full animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
        <div className="absolute top-[70%] left-[60%] w-1 h-1 bg-orange-400/20 rounded-full animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }} />

        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '256px 256px' }} />
      </div>

      {/* === CONTENT === */}
      <div className="relative z-10 px-5 md:px-8 py-10 md:py-16 max-w-4xl mx-auto flex flex-col items-center w-full pb-28 md:pb-12">

        {/* Live Badge */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 bg-neon/10 border border-neon/20 rounded-full text-neon text-xs font-bold uppercase tracking-widest mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon" />
          </span>
          Live Now
        </div>

        {/* Hero Title */}
        <div className={`text-center mb-3 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h1 className="text-6xl md:text-9xl font-black tracking-[-0.06em] leading-[0.85] uppercase">
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(255,255,255,0.1)]">AMIS</span>
          </h1>
          <h1 className="text-6xl md:text-9xl font-black tracking-[-0.06em] leading-[0.85] uppercase">
            <span className="bg-gradient-to-r from-neon via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_60px_rgba(255,0,127,0.3)]">PARK</span>
          </h1>
        </div>

        {/* Subtitle */}
        <p className={`text-gray-400 text-center text-base md:text-lg max-w-md mb-2 leading-relaxed transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          Your digital festival map. Explore events, feel the crowd energy, and find your vibe.
        </p>
        <div className={`flex items-center gap-2 mb-12 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Ghost className="w-3.5 h-3.5 text-neon/50" />
          <p className="text-gray-600 text-[10px] tracking-[0.3em] uppercase font-bold">
            Powered by OthrHalff
          </p>
        </div>

        {/* Action Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`group relative bg-black/40 backdrop-blur-2xl border border-white/[0.06] hover:border-neon/30 rounded-2xl p-6 text-left transition-all duration-500 hover:scale-[1.03] overflow-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${400 + i * 120}ms` }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${action.glow.replace('0.4', '0.08')} 0%, transparent 70%)` }}
                />

                {/* Hover border glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: `inset 0 0 30px ${action.glow.replace('0.4', '0.05')}, 0 0 40px ${action.glow.replace('0.4', '0.08')}` }}
                />

                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.accentClass} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-[0_0_25px] transition-all duration-300`}
                    style={{ '--tw-shadow-color': action.glow } as React.CSSProperties}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2 tracking-tight">
                    {action.label}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-neon" />
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{action.desc}</p>
                </div>

                {/* Corner accent */}
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${action.accentClass} opacity-[0.03] group-hover:opacity-[0.08] rounded-bl-full transition-opacity duration-500`} />
              </button>
            );
          })}
        </div>

        {/* Stats strip */}
        <div className={`w-full mt-10 flex items-center justify-center gap-8 transition-all duration-700 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {[
            { label: 'Events', value: '20+', icon: Zap },
            { label: 'Zones', value: '4', icon: MapPin },
            { label: 'Categories', value: '6', icon: Flame },
          ].map(stat => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <stat.icon className="w-4 h-4 text-gray-600" />
              <span className="text-xl font-black text-white">{stat.value}</span>
              <span className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom tag */}
        <p className={`mt-12 text-gray-700 text-[10px] tracking-[0.3em] uppercase font-bold text-center transition-all duration-700 delay-[800ms] ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          🎪 Walk through a digital festival map
        </p>
      </div>

      {/* Inline CSS for custom animations */}
      <style>{`
        @keyframes float-dot {
          0%, 100% { transform: translateY(0px); opacity: 0.4; }
          50% { transform: translateY(-15px); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default AmisLanding;
