import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, Ghost, Sparkles, MapPin, Zap } from 'lucide-react';

interface AmisEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AmisEntryModal: React.FC<AmisEntryModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setMounted(true), 10);
      document.body.style.overflow = 'hidden';
    } else {
      setMounted(false);
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        className={`relative w-full max-w-sm bg-black/80 backdrop-blur-3xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,0,127,0.15)] transition-all duration-500 ease-out flex flex-col ${mounted ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'}`}
      >
        
        {/* Animated Gradient Background */}
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_50%_0%,rgba(255,0,127,0.15)_0%,transparent_50%)] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.1)_0%,transparent_50%)] pointer-events-none" />
        
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

        {/* Header Ribbon */}
        <div className="relative pt-6 px-6 pb-2 text-center z-10">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-neon/10 border border-neon/20 shadow-[0_0_15px_rgba(255,0,127,0.2)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-neon" />
            </span>
            <span className="text-neon text-[9px] font-bold uppercase tracking-widest">Live Now</span>
          </div>

          <div className="relative inline-block mb-1">
            <Ghost className="w-16 h-16 text-neon drop-shadow-[0_0_15px_rgba(255,0,127,0.4)] mx-auto mb-3" strokeWidth={1.5} />
            <Sparkles className="w-5 h-5 text-white absolute -top-1 -right-2 animate-pulse" />
          </div>

          <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-1">
            <span className="text-white">AMI</span>
            <span className="bg-gradient-to-r from-neon to-purple-500 bg-clip-text text-transparent">SPARK</span>
          </h2>
          <p className="text-gray-400 text-xs font-semibold">The Ultimate College Fest</p>
        </div>

        {/* Feature List */}
        <div className="px-6 py-4 space-y-3 z-10 relative">
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 p-3 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <p className="text-white text-xs font-bold uppercase tracking-wide">Explore Events</p>
              <p className="text-gray-500 text-[10px]">Browse categories & lineups</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 p-3 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-white text-xs font-bold uppercase tracking-wide">Live Heatmap</p>
              <p className="text-gray-500 text-[10px]">See which zones are packed</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 p-3 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-white text-xs font-bold uppercase tracking-wide">Vote & React</p>
              <p className="text-gray-500 text-[10px]">Impact live polls & event vibes</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-6 pt-4 z-10 relative">
          <button 
            onClick={() => {
              onClose();
              navigate('/amis-park');
            }}
            className="w-full relative group overflow-hidden rounded-2xl p-[1px]"
          >
            {/* Animated Border */}
            <span className="absolute inset-0 bg-gradient-to-r from-neon via-purple-500 to-neon bg-[length:200%_auto] animate-[gradient_2s_linear_infinite]" />
            
            {/* Button Surface */}
            <div className="relative w-full bg-black hover:bg-black/80 px-4 py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors">
              <span className="text-white font-black uppercase text-sm tracking-widest">Enter Fest</span>
              <ArrowRight className="w-4 h-4 text-neon group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};
