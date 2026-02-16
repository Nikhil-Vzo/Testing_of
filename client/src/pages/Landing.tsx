
import React, { useEffect, useRef, useState } from 'react';
import { Ghost, Heart, Shield, ArrowRight, Instagram, Twitter, Sparkles } from 'lucide-react';
import { NeonButton } from '../components/Common';
import { useNavigate, Link } from 'react-router-dom';
import { LiquidBackground } from '../components/LiquidBackground';
import { HeartCursor } from '../components/HeartCursor';
import { useAuth } from '../context/AuthContext';

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

  // Dynamic Text State
  const ROLES = ['OTHRHALFF', 'STUDY PARTNER', 'DUO CODER', 'MOVIE MATE', 'GYM BRO', 'CHILL MATE'];
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimatingOut(true);
      setTimeout(() => {
        setCurrentRoleIndex((prev) => (prev + 1) % ROLES.length);
        setIsAnimatingOut(false);
      }, 500); // match transition duration
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  // Scroll-triggered animations for feature cards
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const featuresRef = useRef<HTMLElement>(null);

  // Text reveal animation (keep existing for initial load)
  const [textRevealed, setTextRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTextRevealed(true), 100);
    return () => clearTimeout(timer);
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

  return (
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-black text-white font-sans selection:bg-neon selection:text-white relative flex flex-col">
      {/* WebGL Liquid Background */}
      <LiquidBackground />

      {/* Heart Cursor */}
      <HeartCursor />

      {/* Subtle noise overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none z-[1]"></div>

      <nav aria-label="Main navigation" className="relative z-20 px-4 sm:px-6 py-4 sm:py-8 flex justify-between items-center max-w-7xl mx-auto w-full">
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

        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-2 sm:mb-6 tracking-tighter leading-none perspective-1000 flex flex-col items-center gap-1 sm:gap-4">
          <span className="block" style={{ opacity: textRevealed ? 1 : 0, transition: 'opacity 0.5s ease-out 0.2s' }}>
            FIND YOUR
          </span>

          <div className="relative h-[1.2em] overflow-hidden drop-shadow-[0_0_30px_rgba(255,0,127,0.5)]">
            <span
              className={`block bg-clip-text text-transparent bg-gradient-to-r from-neon via-purple-500 to-blue-500 bg-[length:200%_200%] transition-all duration-500 ease-in-out ${isAnimatingOut ? 'opacity-0 blur-sm translate-y-8' : 'opacity-100 blur-0 translate-y-0'
                }`}
            >
              {ROLES[currentRoleIndex]}
            </span>
          </div>
        </h1>

        <p
          className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mb-8 sm:mb-12 leading-relaxed px-2"
          style={{
            opacity: textRevealed ? 1 : 0,
            transform: textRevealed ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease-out 1.2s',
          }}
        >
          The anonymous connection platform designed for campus life.
          <br className="hidden sm:block" />
          <span className="text-gray-300"> Find your vibe—from study partners to late-night dates. Connect safely, verify with .edu, and reveal when you're ready.</span>
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

        <section
          id="features"
          ref={featuresRef}
          className="mt-16 sm:mt-32 max-w-6xl mx-auto w-full px-4"
          aria-label="Features"
        >
          <h2 className="sr-only">Why Students Love OthrHalff</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature Card 1 */}
            <div
              className={`group relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-8 rounded-3xl transition-all duration-700 cursor-default overflow-hidden ${featuresVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-12'
                }`}
              style={{ transitionDelay: featuresVisible ? '0ms' : '0ms' }}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-neon/0 via-neon/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 border border-neon/0 group-hover:border-neon/50 rounded-3xl transition-all duration-500" />

              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-800 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-neon/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Shield className="w-6 h-6 sm:w-7 sm:h-7 group-hover:text-neon transition-colors" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 group-hover:text-neon transition-colors">College Students Only</h3>
                <p className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 transition-colors">A place where college students connects on vibes. No outsiders allowed.</p>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div
              className={`group relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-8 rounded-3xl transition-all duration-700 cursor-default overflow-hidden ${featuresVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-12'
                }`}
              style={{ transitionDelay: featuresVisible ? '150ms' : '0ms' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 border border-purple-500/0 group-hover:border-purple-500/50 rounded-3xl transition-all duration-500" />

              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-800 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-purple-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                  <Ghost className="w-6 h-6 sm:w-7 sm:h-7 group-hover:text-purple-400 transition-colors" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 group-hover:text-purple-400 transition-colors">Total Anonymity</h3>
                <p className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 transition-colors">Your photos and name stay hidden. Chat, vibe, and reveal only when you trust them.</p>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div
              className={`group relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-8 rounded-3xl transition-all duration-700 cursor-default overflow-hidden ${featuresVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-12'
                }`}
              style={{ transitionDelay: featuresVisible ? '300ms' : '0ms' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 border border-blue-500/0 group-hover:border-blue-500/50 rounded-3xl transition-all duration-500" />

              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-800 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Heart className="w-6 h-6 sm:w-7 sm:h-7 group-hover:text-blue-400 group-hover:animate-pulse transition-colors" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 group-hover:text-blue-400 transition-colors">Vibe-Based Matching</h3>
                <p className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 transition-colors">Our AI analyzes your goals and interests to find exactly who you're looking for—whether that's a late-night coder, a gym spotter, or a romantic match.</p>
              </div>
            </div>
          </div>
        </section>
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
                <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-neon hover:text-white hover:scale-110 hover:rotate-6 transition-all duration-300">
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
              Built with <Heart className="w-3 h-3 text-neon fill-current animate-pulse" /> by The Dev Team
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
