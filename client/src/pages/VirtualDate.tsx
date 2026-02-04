import React, { useState } from 'react';
import { Film, Music, Gamepad2, Layers, Stars, Zap, Sparkles, Heart, ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VirtualDate: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const dates = [
    {
      id: 'cinema',
      title: 'Movie Night',
      desc: 'Watch YouTube videos or short films together in a synchronized private room.',
      icon: Film,
      gradient: 'from-rose-500 via-pink-500 to-purple-500',
      bgGlow: 'rgba(236, 72, 153, 0.3)',
      available: true,
    },
    {
      id: 'music',
      title: 'Soul Sync',
      desc: 'Listen to music in real-time with a shared visualizer and queue system.',
      icon: Music,
      gradient: 'from-violet-500 via-purple-500 to-indigo-500',
      bgGlow: 'rgba(139, 92, 246, 0.3)',
      available: false,
    },
    {
      id: 'games',
      title: 'Neon Arcade',
      desc: 'Compete in mini-games like Truth or Dare, Pictionary, and Rapid Fire.',
      icon: Gamepad2,
      gradient: 'from-emerald-400 via-green-500 to-teal-500',
      bgGlow: 'rgba(34, 197, 94, 0.3)',
      available: false,
    },
    {
      id: 'cards',
      title: 'The Deck',
      desc: 'Flip through deep conversation cards designed to spark meaningful connection.',
      icon: Layers,
      gradient: 'from-pink-500 via-rose-500 to-red-500',
      bgGlow: 'rgba(244, 63, 94, 0.3)',
      available: false,
    },
    {
      id: 'stars',
      title: 'Stargazing',
      desc: 'Relax under a digital sky. Connect stars and just talk in a lo-fi ambient room.',
      icon: Stars,
      gradient: 'from-amber-400 via-yellow-400 to-orange-400',
      bgGlow: 'rgba(251, 191, 36, 0.3)',
      available: false,
    },
  ];

  const handleDateClick = (id: string, title: string, available: boolean) => {
    if (available) {
      if (id === 'cinema') {
        navigate('/virtual-date/cinema');
      }
    }
  };

  return (
    <div className="h-full bg-black text-white overflow-y-auto overflow-x-hidden pb-24 md:pb-8">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-neon/20 to-purple-600/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-blue-600/15 to-pink-600/10 blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 md:px-8 py-8 md:py-12 max-w-6xl mx-auto">

        {/* Header Section */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neon/10 border border-neon/20 rounded-full text-neon text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Experience Connection</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
            Virtual Dates
          </h1>

          <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
            Choose an experience and create unforgettable moments together, no matter the distance.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {dates.map((date, index) => {
            const Icon = date.icon;
            const isHovered = hoveredCard === date.id;

            return (
              <div
                key={date.id}
                className={`group relative rounded-3xl overflow-hidden transition-all duration-500 ${date.available
                  ? 'cursor-pointer hover:scale-[1.02]'
                  : 'opacity-60'
                  }`}
                onMouseEnter={() => setHoveredCard(date.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleDateClick(date.id, date.title, date.available)}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Card glow effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl -z-10"
                  style={{ background: date.bgGlow, transform: 'scale(1.1)' }}
                />

                {/* Card background */}
                <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800 group-hover:border-gray-700 rounded-3xl p-6 md:p-8 h-full transition-all duration-300">

                  {/* Icon with gradient background */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${date.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Title */}
                  <h2 className="text-xl md:text-2xl font-bold mb-3 text-white group-hover:text-white transition-colors">
                    {date.title}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    {date.desc}
                  </p>

                  {/* Action Button */}
                  {date.available ? (
                    <button className={`w-full py-3 px-6 rounded-xl bg-gradient-to-r ${date.gradient} text-white font-semibold text-sm flex items-center justify-center gap-2 group-hover:shadow-lg transition-all duration-300`}>
                      <Heart className="w-4 h-4" />
                      Start Date
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </button>
                  ) : (
                    <div className="w-full py-3 px-6 rounded-xl bg-gray-800 border border-gray-700 text-gray-500 font-medium text-sm flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" />
                      Coming Soon
                    </div>
                  )}

                  {/* Decorative corner gradient */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${date.gradient} opacity-5 group-hover:opacity-10 rounded-bl-full transition-opacity duration-500`} />
                </div>
              </div>
            );
          })}

          {/* More Coming Card */}
          <div className="group relative rounded-3xl overflow-hidden opacity-50">
            <div className="relative bg-gray-900/60 backdrop-blur-xl border border-gray-800 border-dashed rounded-3xl p-6 md:p-8 h-full flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mb-5">
                <Zap className="w-7 h-7 text-gray-500" />
              </div>
              <h2 className="text-xl font-bold mb-3 text-gray-400">More Experiences</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Our love engineers are building more magical experiences for you.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom decorative text */}
        <div className="text-center mt-16 md:mt-20">
          <p className="text-gray-600 text-sm flex items-center justify-center gap-2">
            <Heart className="w-4 h-4 text-neon/50" />
            Made for meaningful connections
            <Heart className="w-4 h-4 text-neon/50" />
          </p>
        </div>
      </div>
    </div>
  );
};

export default VirtualDate;
