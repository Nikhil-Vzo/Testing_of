
import React, { useEffect, useRef, useState } from 'react';
import { Ghost, Heart, Shield, ArrowRight, Instagram, Twitter, Sparkles, MessageSquarePlus, Zap, MapPin, Users, PlaySquare, Music } from 'lucide-react';
import { NeonButton } from '../components/Common';
import { useNavigate, Link } from 'react-router-dom';
import { LiquidBackground } from '../components/LiquidBackground';
import { ChromaKeyVideo } from '../components/ChromaKeyVideo';
import { HeartCursor } from '../components/HeartCursor';
import { useAuth } from '../context/AuthContext';

const ScrollReveal = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.2 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-[1200ms] transform ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'} ${className}`}>
      {children}
    </div>
  );
};

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const onEnter = () => navigate('/login');

  // Redirect authenticated users to home
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Scroll-triggered animations for feature cards
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Text reveal animation
  const [textRevealed, setTextRevealed] = useState(false);
  
  // Page loader
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    // Trigger text reveal after mount
    const timer = setTimeout(() => setTextRevealed(true), 100);
    // Dismiss loader after a brief branded reveal
    const loaderTimer = setTimeout(() => setPageLoaded(true), 1600);
    return () => { clearTimeout(timer); clearTimeout(loaderTimer); };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFeaturesVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Letter-by-letter animation component
  const AnimatedText = ({ text, delay = 0, className = '', isGradient = false }: { text: string; delay?: number; className?: string; isGradient?: boolean }) => (
    <span className={className}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className={`inline-block transition-all duration-500 ${isGradient
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-neon via-purple-500 to-blue-500'
            : ''
            }`}
          style={{
            opacity: textRevealed ? 1 : 0,
            transform: textRevealed ? 'translateY(0) rotateX(0)' : 'translateY(40px) rotateX(-90deg)',
            transitionDelay: `${delay + i * 40}ms`,
            backgroundSize: isGradient ? '200% 200%' : undefined,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );

  return (
    <div className="h-screen bg-black text-white font-sans selection:bg-neon selection:text-white relative overflow-y-auto overflow-x-hidden flex flex-col">
      {/* WebGL Liquid Background */}
      <LiquidBackground />

      {/* Heart Cursor */}
      <HeartCursor />

      {/* Branded Loader */}
      <div 
        className={`fixed inset-0 z-[9999] bg-[#05000a] flex flex-col items-center justify-center transition-all duration-700 ${
          pageLoaded ? 'opacity-0 pointer-events-none scale-110' : 'opacity-100'
        }`}
      >
        <div className="flex items-center gap-2 mb-6">
          <Ghost className="w-8 h-8 text-neon animate-pulse" />
          <span className="font-black tracking-tighter text-3xl text-white">
            <span>OTHR</span><span className="text-neon">HALFF</span>
          </span>
        </div>
        <div className="w-48 h-[2px] bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-neon to-purple-500 rounded-full animate-[loading_1.4s_ease-in-out_infinite]" />
        </div>
        <style>{`
          @keyframes loading {
            0% { width: 0%; transform: translateX(0); }
            50% { width: 100%; transform: translateX(0); }
            100% { width: 100%; transform: translateX(100%); }
          }
        `}</style>
      </div>

      {/* Subtle noise overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none z-[1]"></div>
      
      {/* Premium Cinematic Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-neon/10 blur-[150px] rounded-full mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-purple-600/10 blur-[150px] rounded-full mix-blend-screen" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[20%] w-[40vw] h-[40vw] bg-blue-600/5 blur-[150px] rounded-full mix-blend-screen animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      <nav className="relative z-20 px-4 sm:px-6 py-4 sm:py-8 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
          <Ghost className="w-6 h-6 sm:w-8 sm:h-8 text-neon group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
          <span className="text-xl sm:text-2xl font-black tracking-tighter">
            <span className="group-hover:text-neon transition-colors">OTHR</span>
            <span className="text-neon group-hover:text-white transition-colors">HALFF</span>
          </span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-bold text-gray-400 uppercase tracking-widest">
          <a href="#features" className="hover:text-neon transition-colors relative group">
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neon group-hover:w-full transition-all duration-300" />
          </a>
          <Link to="/blog" className="hover:text-neon transition-colors relative group">
            Blog
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neon group-hover:w-full transition-all duration-300" />
          </Link>
          <Link to="/developers" className="hover:text-neon transition-colors relative group">
            Meet the Developers
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neon group-hover:w-full transition-all duration-300" />
          </Link>
          <Link to="/safety" className="hover:text-neon transition-colors relative group">
            Safety
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neon group-hover:w-full transition-all duration-300" />
          </Link>
        </div>
        <NeonButton onClick={onEnter} variant="secondary" className="text-xs px-4 sm:px-6 hover:shadow-[0_0_20px_rgba(255,0,127,0.5)] transition-shadow">
          Log In
        </NeonButton>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-12 sm:py-20">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/80 border border-neon/30 mb-8 hover:border-neon/60 hover:bg-gray-900 transition-all duration-300 cursor-default group"
          style={{
            opacity: textRevealed ? 1 : 0,
            transform: textRevealed ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'all 0.5s ease-out',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider group-hover:text-white transition-colors">
            Exclusively for University Students
          </span>
          <Sparkles className="w-3 h-3 text-neon opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-4 sm:mb-6 tracking-tighter leading-none perspective-1000">
          <AnimatedText text="FIND YOUR" delay={200} />
          <br />
          <span className="drop-shadow-[0_0_30px_rgba(255,0,127,0.5)]">
            <AnimatedText text="OTHRHALFF" delay={600} isGradient />
          </span>
        </h1>

        <p
          className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mb-8 sm:mb-12 leading-relaxed px-2"
          style={{
            opacity: textRevealed ? 1 : 0,
            transform: textRevealed ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease-out 1.2s',
          }}
        >
          The exclusive network mapped to your exact campus.
          <br className="hidden sm:block" />
          <span className="text-gray-300"> Connect with the people who pass you every day. No randoms. Just chemistry.</span>
        </p>

        <div
          style={{
            opacity: textRevealed ? 1 : 0,
            transform: textRevealed ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
            transition: 'all 0.6s ease-out 1.5s',
          }}
        >
          <button
            onClick={onEnter}
            className="group px-5 py-3 sm:px-6 sm:py-4 md:px-16 md:py-8 bg-neon text-white font-black text-base sm:text-lg md:text-3xl uppercase tracking-wider sm:tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_40px_rgba(255,0,127,0.6)] hover:shadow-[0_0_80px_rgba(255,0,127,0.9)]"
          >
            <span className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:inline">Find Your Othrhalff</span>
              <span className="sm:hidden">Find Your Match</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 group-hover:translate-x-2 transition-transform duration-300" />
            </span>
          </button>
        </div>

        <div className="mt-16 sm:mt-32 md:mt-48 w-full relative z-10 flex flex-col gap-24 sm:gap-32 md:gap-48 pb-16 md:pb-32">
          
          {/* Main Video Reveal */}
          <ScrollReveal>
            <div className="max-w-[100rem] mx-auto px-4 sm:px-6 w-full relative">
              <div 
                className="relative w-full aspect-[4/5] sm:aspect-video lg:aspect-[2.5/1] group"
              >
                
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  preload="none"
                  src="/blog/go-beyond-dating.mp4" 
                  style={{ borderRadius: '40px' }}
                  className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)]" 
                />
              </div>
            </div>
          </ScrollReveal>

          {/* Creative Layout 1: Sticky Typography + Campus Radar (The Pulse) */}
          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-24 flex flex-col md:flex-row items-center justify-between gap-12 md:gap-16">
            <div className="w-full md:w-1/2 md:pr-12 pointer-events-none">
              <h3 className="text-[clamp(3rem,6vw,5rem)] font-black text-white leading-none tracking-tighter relative z-20">
                <span className="text-neon block text-lg sm:text-2xl mb-4 font-bold tracking-widest uppercase">01 / The Pulse</span>
                Campus <br/>Heatmap.
              </h3>
              <p className="mt-8 text-xl md:text-2xl text-gray-400 font-light max-w-md leading-relaxed">
                Know exactly what's buzzing on the ground in real-time. Live event streams, anonymous confessions, and dynamic campus polls.
              </p>
            </div>
            
            <div className="w-full md:w-1/2 flex justify-center items-center">
              <ScrollReveal className="w-full">
                <div className="relative w-full aspect-square max-w-md mx-auto rounded-full border border-white/10 bg-black/60 backdrop-blur-2xl flex items-center justify-center overflow-hidden shadow-[0_0_80px_rgba(59,130,246,0.15)] group">
                  {/* Radar Sweep Effect */}
                  <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_70%,rgba(59,130,246,0.3)_100%)] animate-[spin_4s_linear_infinite] rounded-full opacity-50" />
                  <div className="absolute w-full h-[1px] bg-blue-500/20 top-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  <div className="absolute h-full w-[1px] bg-blue-500/20 left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  
                  {/* Concentric circles */}
                  <div className="absolute w-3/4 h-3/4 rounded-full border border-blue-500/10" />
                  <div className="absolute w-1/2 h-1/2 rounded-full border border-blue-500/10" />
                  
                  <MapPin className="w-10 h-10 text-blue-400 relative z-10 animate-pulse drop-shadow-[0_0_20px_rgba(59,130,246,1)]" />
                  
                  {/* Pings */}
                  <div className="absolute w-4 h-4 rounded-full bg-neon/80 top-[20%] left-[30%] animate-ping" style={{ animationDelay: '0s', animationDuration: '3s' }} />
                  <div className="absolute w-3 h-3 rounded-full bg-purple-500/80 bottom-[30%] right-[20%] animate-ping" style={{ animationDelay: '1.5s', animationDuration: '3s' }} />
                  <div className="absolute w-5 h-5 rounded-full bg-blue-400/80 top-[60%] right-[15%] animate-ping" style={{ animationDelay: '2.5s', animationDuration: '3s' }} />
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* Creative Layout 2: Massive Background Typography (Ghost Mode) */}
          <div className="relative w-full py-20 md:py-32 overflow-hidden flex items-center justify-center min-h-[500px] isolate">
            {/* Gigantic BG Text */}
            <h2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(5rem,20vw,30rem)] font-black text-white/[0.06] tracking-tighter leading-none select-none pointer-events-none whitespace-nowrap z-0">
              GHOST
            </h2>
            
            <ScrollReveal className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center">
              <div className="w-full max-w-3xl backdrop-blur-3xl bg-purple-900/5 border border-purple-500/10 p-6 sm:p-12 md:p-24 rounded-3xl md:rounded-[3rem] text-center shadow-[0_0_100px_rgba(168,85,247,0.1)] hover:bg-purple-900/10 transition-colors duration-700 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <Ghost className="w-16 h-16 sm:w-20 sm:h-20 text-purple-400 mx-auto mb-8 sm:mb-12 drop-shadow-[0_0_30px_rgba(168,85,247,0.8)] group-hover:-translate-y-4 transition-transform duration-700 relative z-10" />
                <h3 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black text-white tracking-tight leading-none mb-6 relative z-10">
                  Chemistry <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">First.</span>
                </h3>
                <p className="text-gray-400 text-lg sm:text-2xl font-light leading-relaxed relative z-10">
                  Identity locked. Visuals hidden. Connect strictly through shared aesthetics and raw conversation. Reveal your face only when the trust is truly earned.
                </p>
              </div>
            </ScrollReveal>
          </div>

          {/* Creative Layout 3: Horizontal Asymmetry (Virtual Dates) */}
          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32 md:py-48">
            <div className="flex flex-col md:flex-row items-center gap-16 md:gap-8">
              <ScrollReveal className="w-full md:w-5/12 z-20">
                <div className="relative border-l-4 border-neon pl-8 md:pl-12">
                  <span className="text-neon block text-lg sm:text-2xl mb-4 font-bold tracking-widest uppercase">03 / Experience</span>
                  <h3 className="text-[clamp(3rem,6vw,5rem)] font-black text-white tracking-tighter leading-none mb-8">
                    Virtual <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-purple-500">Dates.</span>
                  </h3>
                  <p className="text-gray-400 text-xl md:text-2xl font-light leading-relaxed max-w-md">
                    Don't just text into the void. Step into synchronized virtual auditoriums. Share a cinematic movie night or a high-fidelity music stream right in the app.
                  </p>
                </div>
              </ScrollReveal>
              
              <div className="w-full md:w-7/12 relative min-h-[400px] sm:min-h-[500px]">
                <ScrollReveal className="absolute right-0 bottom-0 w-[80%] aspect-[4/3] rounded-2xl md:rounded-[2rem] bg-gradient-to-br from-purple-900/40 to-[#05000a] border border-purple-500/30 backdrop-blur-xl flex items-center justify-center overflow-hidden z-10 shadow-[0_20px_80px_rgba(168,85,247,0.3)] transform sm:translate-y-12 transition-transform hover:scale-105 duration-700">
                  <PlaySquare className="w-20 h-20 text-purple-400 drop-shadow-xl" />
                </ScrollReveal>
                <ScrollReveal className="absolute left-0 top-0 w-[60%] aspect-square rounded-3xl md:rounded-[3rem] bg-gradient-to-tr from-neon/40 to-[#05000a] border border-neon/40 backdrop-blur-2xl flex items-center justify-center overflow-hidden z-20 shadow-[0_20px_80px_rgba(255,0,127,0.3)] hover:-translate-y-4 hover:-rotate-3 transition-transform duration-700">
                  <Music className="w-20 h-20 text-white drop-shadow-2xl" />
                </ScrollReveal>
              </div>
            </div>
          </div>

          {/* Creative Layout 4: Double Opposing Infinite Marquees (True Edge-to-Edge) */}
          <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] pb-12 overflow-hidden flex flex-col items-center">
            <style>{`
              @keyframes marquee-left {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
              @keyframes marquee-right {
                0% { transform: translateX(-50%); }
                100% { transform: translateX(0%); }
              }
              .animate-marquee-left {
                animation: marquee-left 40s linear infinite;
                display: inline-flex;
              }
              .animate-marquee-right {
                animation: marquee-right 40s linear infinite;
                display: inline-flex;
              }
            `}</style>
            
            <div className="w-[110vw] transform -rotate-2 bg-[#ff007f]/5 backdrop-blur-md border-y border-neon/30 py-6 sm:py-10 shadow-[0_0_80px_rgba(255,0,127,0.1)] z-10">
              <div className="flex whitespace-nowrap overflow-hidden py-2 border-y border-neon/10">
                <div className="animate-marquee-left text-white/90 font-black text-5xl sm:text-7xl md:text-9xl uppercase tracking-tighter block">
                  <span className="mx-8 drop-shadow-[0_0_15px_rgba(255,0,127,0.8)]">FIND YOUR GYM SPOTTER • <span className="text-neon/70">ROW 2</span> LECTURE PARTNER • LATE NIGHT STUDY BUDDY •</span>
                  <span className="mx-8 drop-shadow-[0_0_15px_rgba(255,0,127,0.8)]">FIND YOUR GYM SPOTTER • <span className="text-neon/70">ROW 2</span> LECTURE PARTNER • LATE NIGHT STUDY BUDDY •</span>
                </div>
              </div>
            </div>

            <div className="w-[110vw] transform rotate-1 -mt-8 sm:-mt-12 bg-blue-900/10 backdrop-blur-lg border-y border-blue-500/30 py-4 sm:py-8 shadow-[0_0_80px_rgba(59,130,246,0.1)] z-0 mix-blend-screen">
              <div className="flex whitespace-nowrap overflow-hidden py-2 border-y border-blue-500/10">
                <div className="animate-marquee-right text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-light italic text-4xl sm:text-6xl md:text-8xl uppercase tracking-widest block">
                  <span className="mx-12">THE MICROSCOPIC GEOGRAPHY OF COLLEGE •</span>
                  <span className="mx-12">THE MICROSCOPIC GEOGRAPHY OF COLLEGE •</span>
                  <span className="mx-12">THE MICROSCOPIC GEOGRAPHY OF COLLEGE •</span>
                  <span className="mx-12">THE MICROSCOPIC GEOGRAPHY OF COLLEGE •</span>
                </div>
              </div>
            </div>
            
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 mt-16 sm:mt-24 relative z-20 text-center">
              <ScrollReveal>
                <div className="w-24 h-24 rounded-3xl mx-auto bg-[#05000a] border border-neon/30 flex items-center justify-center mb-8 shadow-[0_20px_60px_rgba(255,0,127,0.2)] rotate-3">
                  <Users className="w-10 h-10 text-neon drop-shadow-[0_0_20px_rgba(255,0,127,0.8)]" />
                </div>
                <h3 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black text-white tracking-tighter leading-none mb-8">
                  Hyper-Local <br className="sm:hidden" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-purple-500">Synergy.</span>
                </h3>
                <p className="text-gray-400 text-xl md:text-3xl font-light max-w-3xl mx-auto leading-relaxed">
                  We meticulously map the microscopic geography of your daily college life. We don't ask for generic profiles—we look at the spaces you inhabit. The perfect connection isn't oceans away. It's right in your lecture hall.
                </p>
              </ScrollReveal>
            </div>
          </div>

          {/* Massive Final Call To Action */}
          <ScrollReveal className="mt-4">
            <div className="max-w-3xl mx-auto px-4 w-full flex flex-col items-center justify-center pb-16">
              
              {/* Ticket Asset — hero centerpiece */}
              <div className="relative w-full max-w-md mx-auto mb-2 z-10">
                <ChromaKeyVideo 
                  src="/blog/ticket-rip.webm" 
                  className="w-full h-auto"
                  rThreshold={100}
                />
                {/* Subtle glow behind the ticket */}
                <div className="absolute inset-0 bg-neon/10 blur-[80px] rounded-full pointer-events-none -z-10" />
              </div>

              {/* Divider */}
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-neon/60 to-transparent mb-6" />

              {/* Tagline */}
              <p className="text-gray-400 text-xs sm:text-sm font-medium tracking-[0.25em] uppercase mb-8 text-center">
                Our biggest, baddest & loveliest updates are yet to arrive.
              </p>
              
              {/* CTA Button — brand-matched */}
              <button
                onClick={onEnter}
                className="group relative px-10 py-4 sm:px-14 sm:py-5 bg-gradient-to-r from-neon to-purple-600 text-white font-bold text-base sm:text-lg uppercase tracking-[0.2em] rounded-full hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_40px_rgba(255,0,127,0.35)] hover:shadow-[0_0_60px_rgba(255,0,127,0.5)] overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <span className="flex items-center gap-3 relative z-10">
                  Enter Othrhalff
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </button>
            </div>
          </ScrollReveal>
        </div>
      </main>

      {/* Footer Section */}
      <footer className="relative z-10 border-t border-gray-900 bg-black/80 backdrop-blur-xl pt-10 sm:pt-16 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center gap-2 mb-3 sm:mb-4 cursor-pointer group" onClick={() => navigate('/')}>
                <Ghost className="w-5 h-5 sm:w-6 sm:h-6 text-neon group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                <span className="font-black tracking-tighter text-lg sm:text-xl text-white">
                  <span className="group-hover:text-neon transition-colors">OTHR</span>
                  <span className="text-neon group-hover:text-white transition-colors">HALFF</span>
                </span>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed max-w-sm mb-4 sm:mb-6">
                The safest way to meet people on campus. Built for students, by students.
                Find your vibe without the pressure.
              </p>
              <div className="flex gap-3 sm:gap-4">
                <a href="https://www.instagram.com/othrhalff/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-neon hover:text-white hover:scale-110 hover:rotate-6 transition-all duration-300">
                  <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-neon hover:text-white hover:scale-110 hover:-rotate-6 transition-all duration-300">
                  <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <Link to="/about" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-neon hover:text-white hover:scale-110 hover:rotate-6 transition-all duration-300">
                  <Ghost className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs sm:text-sm mb-4 sm:mb-6">Company</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-500">
                <li><Link to="/about" className="hover:text-neon hover:translate-x-1 inline-block transition-all">About Us</Link></li>
                <li><Link to="/developers" className="hover:text-neon hover:translate-x-1 inline-block transition-all">Developers</Link></li>
                <li><Link to="/careers" className="hover:text-neon hover:translate-x-1 inline-block transition-all">Careers</Link></li>
                <li><Link to="/contact" className="hover:text-neon hover:translate-x-1 inline-block transition-all">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs sm:text-sm mb-4 sm:mb-6">Legal</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-500">
                <li><Link to="/privacy" className="hover:text-neon hover:translate-x-1 inline-block transition-all">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-neon hover:translate-x-1 inline-block transition-all">Terms</Link></li>
                <li><Link to="/safety" className="hover:text-neon hover:translate-x-1 inline-block transition-all">Safety</Link></li>
                <li><Link to="/guidelines" className="hover:text-neon hover:translate-x-1 inline-block transition-all">Guidelines</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-xs">&copy; {new Date().getFullYear()} Othrhalff Inc. All rights reserved.</p>
            <p className="text-gray-500 text-xs font-medium flex items-center gap-1">
              Built with <Heart className="w-3 h-3 text-neon fill-current animate-pulse" /> to help find what you'd love
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
