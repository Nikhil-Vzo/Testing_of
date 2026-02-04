
import React from 'react';
import { Ghost, Heart, Shield, Zap, ArrowRight } from 'lucide-react';
import { NeonButton } from './Common';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-neon selection:text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-neon opacity-20 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600 opacity-10 blur-[150px] rounded-full" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(50, 50, 50, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(50, 50, 50, 0.5) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

      {/* Navbar */}
      <nav className="relative z-20 px-6 py-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Ghost className="w-8 h-8 text-neon" />
          <span className="text-2xl font-black tracking-tighter">OTHR<span className="text-neon">HALFF</span></span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-bold text-gray-400 uppercase tracking-widest">
          <a href="#features" className="hover:text-neon transition-colors">Features</a>
          <a href="/developers" className="hover:text-neon transition-colors">Meet the Developers</a>
          <a href="#safety" className="hover:text-neon transition-colors">Safety</a>
        </div>
        <NeonButton onClick={onEnter} variant="secondary" className="text-xs px-6">
          Log In
        </NeonButton>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/80 border border-neon/30 mb-8 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Exclusively for University Students</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-none animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          FIND YOUR <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon via-purple-500 to-blue-500 drop-shadow-[0_0_30px_rgba(255,0,127,0.5)]">
            OTHRHALFF
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          The anonymous dating experience designed for campus life.
          Connect based on vibes, verify with email, reveal when you're ready.
        </p>

        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={onEnter}
            className="group relative px-10 py-6 bg-neon text-white font-black text-xl uppercase tracking-widest rounded-full overflow-hidden hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,0,127,0.6)]"
          >
            <span className="relative z-10 flex items-center gap-3">
              Find Your Othrhalff <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 max-w-6xl mx-auto w-full px-4">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-8 rounded-3xl hover:border-neon/50 transition-all group">
            <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-neon/20 group-hover:text-neon transition-colors">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Verified Students Only</h3>
            <p className="text-gray-400">No bots, no randoms. We verify every user via their official .edu email address.</p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-8 rounded-3xl hover:border-neon/50 transition-all group">
            <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-neon/20 group-hover:text-neon transition-colors">
              <Ghost className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Total Anonymity</h3>
            <p className="text-gray-400">Your photos and name stay hidden. Chat, vibe, and reveal only when you trust them.</p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-8 rounded-3xl hover:border-neon/50 transition-all group">
            <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-neon/20 group-hover:text-neon transition-colors">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Smart Matching</h3>
            <p className="text-gray-400">Our AI analyzes interests and campus vibes to find someone you'll actually click with.</p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-gray-900 mt-20 py-10 text-center">
        <p className="text-gray-600 text-sm">&copy; 2024 Othrhalff. Made for University Students.</p>
      </footer>
    </div>
  );
};
