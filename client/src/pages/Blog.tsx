import React, { useEffect, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ghost, ArrowLeft, TrendingUp, Users, Eye, Zap, Quote, Rocket, Sparkles, ArrowRight, Instagram, Linkedin, Github } from 'lucide-react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { trackPageView } from '../utils/analytics';

gsap.registerPlugin(ScrollTrigger);

// --- Component TextReveal ---
// Automatically splits text into span tags hidden within overflow containers for CodeGrid-style staggers.
const TextReveal: React.FC<{ text: string; className?: string; itemClass?: string; type?: 'words' | 'chars'; style?: React.CSSProperties }> = ({ text, className = "", itemClass = "", type = "words", style }) => {
  const elements = type === 'chars' ? text.split('') : text.split(' ');
  return (
    <span className={className} style={{ ...style, display: 'inline-block' }}>
      {elements.map((el, i) => (
        <span key={i} className="inline-block overflow-hidden py-1 align-bottom">
          <span className={`inline-block ${itemClass}`} style={{ transformOrigin: 'top left' }}>
            {el === ' ' ? '\u00A0' : el}{(type === 'words' && i < elements.length - 1) ? '\u00A0' : ''}
          </span>
        </span>
      ))}
    </span>
  );
};

export const Blog: React.FC = () => {
  const outerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Track page view in Google Analytics
  useEffect(() => {
    trackPageView('/blog', 'OTHRHALFF Blog');
  }, []);

  // Initialize Lenis for smooth scrolling
  useEffect(() => {
    if (!mainRef.current || !contentRef.current) return;

    const lenis = new Lenis({
      wrapper: mainRef.current,
      content: contentRef.current,
      lerp: 0.08,
      smoothWheel: true,
    });
    
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
    return () => lenis.destroy();
  }, []);

  // Set up GSAP animations
  useLayoutEffect(() => {
    if (!mainRef.current) return;
    const scroller = mainRef.current;
    
    // Set default scroller to work with custom scroll container
    ScrollTrigger.defaults({ scroller });

    let ctx = gsap.context(() => {

      // --- 1. Preloader & Hero Sequence (Code Grid Style) ---
      gsap.set('.hero-word', { y: '120%', rotate: 5, opacity: 0 });
      gsap.set('.hero-intro', { y: '100%', opacity: 0 });
      gsap.set('.hero-bg-text', { y: '120%', opacity: 0 });
      gsap.set('.global-nav', { y: '-100%', opacity: 0 });

      const tl = gsap.timeline();

      tl.to('.loader-text', { yPercent: -100, opacity: 0, duration: 1, ease: 'power4.inOut', delay: 0.3 })
        .to('.loader-overlay', { height: 0, duration: 1.5, ease: 'power4.inOut' })
        // Animate Container Unmasking
        .fromTo('.hero-video-container',
          { clipPath: 'polygon(30% 40%, 70% 40%, 70% 60%, 30% 60%)', scale: 1.1 },
          { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', scale: 1, duration: 2, ease: 'power4.inOut' },
          '-=1.2'
        )
        // Sweep up background volume text
        .to('.hero-bg-text', { y: '0%', opacity: 0.2, duration: 1.8, ease: 'power4.out' }, '-=1.5')
        // Sweeping staggers for words
        .to('.hero-word', { y: '0%', rotate: 0, opacity: 1, duration: 1.2, stagger: 0.05, ease: 'power4.out' }, '-=1.2')
        .to('.hero-intro', { y: '0%', opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.1 }, '-=0.9')
        .to('.global-nav', { y: '0%', opacity: 1, duration: 1, ease: 'power4.out' }, '-=0.8');

      // Hero Animated Orbs
      gsap.to('.hero-orb-1', {
        x: 'random(-100, 100, 5)',
        y: 'random(-50, 50, 5)',
        scale: 'random(0.8, 1.3)',
        duration: 12,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      });
      gsap.to('.hero-orb-2', {
        x: 'random(-50, 50, 5)',
        y: 'random(-100, 100, 5)',
        scale: 'random(0.9, 1.4)',
        duration: 15,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      });

      // Hero Parallax Scrolling
      gsap.to('.hero-video-container', {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
      gsap.to('.hero-bg-text', {
        yPercent: -50,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      // --- 2. Parallax Origin Image ---
      gsap.fromTo('.origin-img', 
        { yPercent: -10 },
        {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: {
            trigger: '.origin-section',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        }
      );

      gsap.from('.origin-text', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        scrollTrigger: {
          trigger: '.origin-section',
          start: 'top 80%'
        }
      });

      // --- 3. Staggered Thoughts (The Struggle) ---
      const thoughtWords = gsap.utils.toArray<HTMLElement>('.struggle-word');
      gsap.fromTo(thoughtWords, 
        { opacity: 0.1, color: '#333' },
        {
          opacity: 1,
          color: '#fff',
          stagger: 0.5,
          scrollTrigger: {
            trigger: '.struggle-section',
            start: 'top 95%',  // Start earlier
            end: 'center 60%', // Fill faster
            scrub: 1
          }
        }
      );

      // --- 4. Counter Animation (Growth Explosion) ---
      ScrollTrigger.create({
        trigger: '.growth-section',
        start: 'top 75%',
        onEnter: () => {
          gsap.to({ val: 0 }, {
            val: 35000,
            duration: 2.5,
            ease: 'power3.out',
            onUpdate: function() {
              const counter = document.getElementById('view-counter');
              if(counter) counter.innerText = Math.floor(this.targets()[0].val).toLocaleString() + '+ Views';
            }
          });
        },
        once: true
      });

      // --- 5. Floating cards (Launch) ---
      gsap.from('.launch-card', {
        scrollTrigger: {
          trigger: '.launch-section',
          start: 'top 85%'
        },
        y: 60,
        opacity: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: 'back.out(1.2)'
      });

      // --- 6. Mentor spotlight pulse ---
      gsap.fromTo('.mentor-glow', 
        { scale: 0.8, opacity: 0 },
        {
          scale: 1, opacity: 0.8,
          duration: 3,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
          scrollTrigger: {
            trigger: '.mentor-section',
            start: 'top 80%'
          }
        }
      );

      // --- 7. The Tease background pulse ---
      gsap.to('.tease-bg', {
        scale: 1.05,
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: 'none'
      });
      
    }, outerRef);
    
    return () => {
      ctx.revert();
      ScrollTrigger.defaults({ scroller: window }); // reset on unmount
    };
  }, []);

  // Typography helper styles
  const fontPlayfair = { fontFamily: "'Playfair Display', serif" };
  const fontInstrument = { fontFamily: "'Instrument Serif', serif" };

  return (
    <div ref={outerRef} className="bg-[#05000a] text-white selection:bg-neon selection:text-white relative font-sans overflow-hidden h-screen w-full">
      
      {/* 0. Code Grid Preloader Screen */}
      <div className="loader-overlay fixed inset-0 z-[100] bg-black flex items-center justify-center transform origin-top">
        <div className="overflow-hidden">
          <span className="loader-text font-sans text-xs sm:text-sm tracking-[0.5em] text-gray-400 uppercase inline-block font-bold">
            <span className="text-neon">Loading</span> Experience
          </span>
        </div>
      </div>

      {/* Universal Grain Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.05]" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      ></div>

      {/* Global Nav - Fixed top */}
      <nav className="global-nav fixed top-0 w-full z-40 bg-transparent mix-blend-difference pointer-events-none p-6 md:p-10 flex items-start justify-between">
        <Link to="/" className="pointer-events-auto flex items-center gap-3 group hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-full border border-white/20 flex flex-col items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowLeft className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium tracking-widest text-xs uppercase hidden sm:block">Back</span>
        </Link>
        <div className="pointer-events-auto flex flex-col items-end">
          <Ghost className="w-6 h-6 text-white mb-2" />
          <span className="text-[10px] text-neon uppercase tracking-[0.3em] font-bold">Othrhalff</span>
        </div>
      </nav>

      {/* Lenis scroll wrapper */}
      <div ref={mainRef} className="h-screen w-full overflow-y-auto overflow-x-hidden relative z-10 bg-gradient-to-b from-[#05000a] via-[#020005] to-[#05000a]">
        <div ref={contentRef} className="w-full relative min-h-full">
          <main>
            {/* 1. ADVANCED HERO SECTION */}
            <section className="hero-section relative min-h-[100svh] flex flex-col justify-center sm:justify-end pb-12 sm:pb-24 px-6 md:px-16 overflow-hidden z-0">
              
              {/* Parallax Outline Background Text (Moved Behind Everything) */}
              <div className="absolute top-[35%] sm:top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[-2] w-full text-center blend-exclusion">
                <div className="overflow-hidden inline-block pb-2">
                  <h1 className="hero-bg-text text-[40vw] sm:text-[25vw] font-black tracking-tighter uppercase leading-none whitespace-nowrap opacity-20" style={{ ...fontPlayfair, WebkitTextStroke: '2px rgba(255, 255, 255, 0.4)', color: 'transparent' }}>
                    Vol. 1
                  </h1>
                </div>
              </div>

              {/* Masked Abstract Orbs Background container */}
              <div className="hero-video-container absolute inset-0 z-[-1] overflow-hidden bg-black/80">
                {/* Glowing Animated Orbs for Mobile & Desktop */}
                <div className="hero-orb-1 absolute top-0 -left-1/4 w-[120vw] sm:w-[60vw] h-[120vw] sm:h-[60vw] rounded-full bg-pink-500/40 sm:bg-pink-500/30 mix-blend-screen blur-[80px] sm:blur-[120px] opacity-80" />
                <div className="hero-orb-2 absolute bottom-0 -right-1/4 w-[140vw] sm:w-[70vw] h-[140vw] sm:h-[70vw] rounded-full bg-purple-600/30 sm:bg-purple-600/20 mix-blend-screen blur-[100px] sm:blur-[150px] opacity-80" />
                <div className="absolute top-1/2 left-1/4 w-[100vw] sm:w-[40vw] h-[100vw] sm:h-[40vw] rounded-full bg-cyan-500/20 mix-blend-screen blur-[100px] sm:blur-[150px] opacity-60 animate-[pulse_4s_ease-in-out_infinite]" />
                
                {/* Vignette Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] pointer-events-none opacity-80" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
              </div>
              
              <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-start pt-[12vh] sm:pt-0 mt-8 sm:mt-10">
                <div className="overflow-hidden mb-8 w-full pl-0 sm:pl-0">
                  <p className="hero-intro text-neon text-xs sm:text-sm font-bold uppercase tracking-[0.4em] flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-neon animate-pulse flex-shrink-0 drop-shadow-[0_0_8px_rgba(255,0,127,1)]" /> The Prologue
                  </p>
                </div>

                <div className="text-[clamp(4.2rem,14vw,11rem)] leading-[0.95] font-black tracking-tighter w-full max-w-7xl flex flex-col justify-center gap-2 sm:gap-2" style={fontPlayfair}>
                  <div className="self-start lg:pl-0">
                    <TextReveal text="THE STORY" itemClass="hero-word text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" />
                  </div>
                  <div className="self-end sm:self-end lg:pr-24 lg:-mt-4">
                    <span className="italic font-light text-gray-300 block drop-shadow-lg" style={fontInstrument}>
                      <TextReveal type="words" text="BEGAN AS A" itemClass="hero-word" />
                    </span>
                  </div>
                  <div className="self-center sm:self-center lg:pl-32 lg:-mt-4">
                    <TextReveal text="FEELING." itemClass="hero-word text-neon drop-shadow-[0_0_25px_rgba(255,0,127,0.5)]" />
                  </div>
                </div>
                
                <div className="mt-16 sm:mt-16 overflow-hidden max-w-[85%] sm:max-w-md self-start sm:self-end text-left sm:text-right pr-4">
                  <p className="hero-intro text-gray-300 font-light text-[clamp(1rem,4vw,1.1rem)] sm:text-[clamp(1rem,1.2vw,1.1rem)] tracking-wide leading-relaxed">
                    No pitch deck. No whiteboard. Just a thought—that's all it takes.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. ORIGIN STORY */}
            <section className="origin-section relative py-16 sm:py-28 px-6 sm:px-12 md:px-24 max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
                <div className="order-2 md:order-1 origin-text relative z-10">
                  <h2 className="text-4xl text-gray-600 uppercase tracking-widest text-xs font-bold mb-10 flex items-center gap-4">
                    <span className="w-8 h-[1px] bg-gray-600"></span> 01 // The Inspiration
                  </h2>
                  <p className="text-[clamp(1.5rem,3vw,2.5rem)] font-light leading-snug mb-10 text-white" style={fontPlayfair}>
                    "We took the raw, electric energy of an <i style={fontInstrument} className="text-neon drop-shadow-[0_0_10px_rgba(255,0,127,0.4)]">immoral idea</i> and rebuilt it with a moral compass."
                  </p>
                  <div className="space-y-6 text-[clamp(1rem,1.2vw,1.125rem)] leading-relaxed font-light relative pt-2">
                    <div className="absolute -left-6 top-2 bottom-2 w-[2px] bg-gradient-to-b from-blue-600 via-neon to-transparent rounded-full opacity-50"></div>
                    <p className="text-gray-300 pl-2">
                      We (Nikhil and Avneesh), engineering students at Amity University, Raipur, were deeply inspired by the movie <em>The Social Network</em> (2010). We wanted to create something with that same iconic, disruptive energy that Mark Zuckerberg unleashed in his college dorm room.
                    </p>
                    <div className="bg-gradient-to-br from-gray-900/60 to-black border border-white/5 rounded-2xl p-6 lg:p-8 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] group hover:border-neon/30 transition-all duration-700 ml-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-neon/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-neon/20 transition-colors duration-700" />
                      <p className="text-gray-400 relative z-10">
                        Zuckerberg's initial dorm project was built on the infamous concept of rating girls. We took that viral magnetic pull and completely flipped the script to build an uplifting, moral platform. We called it <strong className="text-white font-bold group-hover:text-neon transition-colors duration-500 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">OTHRHALFF</strong>—because what you're looking for isn't a perfect match; it's the other half of a story you haven't written yet.
                      </p>
                    </div>
                    
                    {/* Dev Link moved to bottom */}
                  </div>
                </div>
                
                <div className="origin-img order-1 md:order-2 relative w-full group flex items-center justify-center pointer-events-none">
                  {/* Naked video element with curved corners and shadow directly applied */}
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    src="/blog/go-beyond-dating.mp4"
                    className="w-full h-auto rounded-3xl object-contain opacity-90 transition-all duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105 group-hover:opacity-100 shadow-[0_20px_40px_rgba(255,0,127,0.15)] group-hover:shadow-[0_30px_60px_rgba(255,0,127,0.3)]" 
                  />
                </div>
              </div>
            </section>

            {/* 3. THE STRUGGLE */}
            <section className="struggle-section bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-950/30 via-[#020005] to-[#020005] py-24 sm:py-32 border-y border-rose-900/20 relative">
              <div className="max-w-5xl mx-auto px-6 text-center">
                <h2 className="text-[clamp(2.5rem,5vw,5rem)] font-light leading-[1.2] text-gray-700" style={fontPlayfair}>
                  {'We wrote the code. But a network without a pulse is just a blank screen.'.split(' ').map((word, i) => (
                    <span key={i} className="struggle-word inline-block mr-[0.3em] mb-2">{word}</span>
                  ))}
                </h2>
                <div className="mt-24 max-w-2xl mx-auto origin-text">
                  <div className="w-[1px] h-24 bg-gradient-to-b from-gray-600 to-transparent mx-auto mb-10" />
                  <p className="text-[clamp(1.125rem,2vw,1.5rem)] text-gray-400 font-light leading-relaxed">
                    The tech was ready and the late nights had paid off. But building an app in your dorm is completely different from actually getting your peers to care. We were just two students sitting on a finished platform, wondering how to wake up the rest of the campus.
                  </p>
                </div>
              </div>
            </section>

            {/* 4. GROWTH EXPLOSION */}
            <section className="growth-section py-20 px-6 max-w-7xl mx-auto relative z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
              <div className="flex flex-col items-center justify-center text-center mb-16 sm:mb-24 origin-text">
                <h2 className="text-xs uppercase tracking-[0.5em] text-neon font-bold mb-8 flex items-center gap-3">
                  The Turning Point <Zap className="w-4 h-4 text-yellow-500" />
                </h2>
                <p className="text-[clamp(2rem,4vw,3.5rem)] font-light" style={fontPlayfair}>Then the true crew assembled.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 lg:gap-10 mb-16">
                <div className="bg-[#050505] border border-white/5 rounded-3xl p-10 lg:p-16 flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-neon/15 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-neon/30 transition-colors duration-1000 ease-out"></div>
                  <h3 id="view-counter" className="text-[clamp(3.5rem,6vw,5.5rem)] font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-700 tracking-tighter mb-6 relative z-10 w-full drop-shadow-lg">
                    0+ Views
                  </h3>
                  <p className="text-gray-400 text-[clamp(1rem,1.2vw,1.125rem)] font-light relative z-10">
                    We brought in a highly creative force to ignite the spark. Ashutosh drove relentless, massive numbers on IG, flanked by Shreyy Sharma locking down our striking posters and social tactics. Then, Tushar Shendey gave the brand a heartbeat with elite motion graphics. Together, we generated viral, organic reach within 20 days. No paid ads. Just raw, collective momentum.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-6 lg:gap-10">
                   <div className="bg-[#050505] border border-white/5 rounded-3xl p-8 lg:p-10 flex flex-col justify-between origin-text group hover:border-gray-700 transition-colors">
                      <Users className="w-8 h-8 text-gray-600 mb-8 group-hover:text-white transition-colors" />
                      <div>
                        <p className="text-4xl lg:text-5xl font-bold mb-2 tracking-tight">431</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Active Users</p>
                      </div>
                   </div>
                   <div className="bg-[#050505] border border-white/5 rounded-3xl p-8 lg:p-10 flex flex-col justify-between origin-text group hover:border-neon/50 transition-colors">
                      <TrendingUp className="w-8 h-8 text-neon/50 mb-8 group-hover:text-neon transition-colors drop-shadow-[0_0_10px_rgba(255,0,127,0.4)] group-hover:drop-shadow-[0_0_20px_rgba(255,0,127,0.8)]" />
                      <div>
                        <p className="text-4xl lg:text-5xl font-bold mb-2 tracking-tight text-white">720</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Ref Sessions</p>
                      </div>
                   </div>
                   <div className="bg-[#050505] border border-white/5 rounded-3xl p-8 lg:p-10 flex flex-col justify-between col-span-2 origin-text group">
                      <Zap className="w-8 h-8 text-yellow-500/50 mb-8 group-hover:text-yellow-500 transition-colors drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]" />
                      <div className="flex flex-row items-end justify-between">
                        <div>
                          <p className="text-4xl lg:text-5xl font-bold mb-2 tracking-tight">32,000+</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">In-App Events</p>
                        </div>
                        <p className="text-xs text-gray-600 hidden sm:block">Fired and handled effortlessly.</p>
                      </div>
                   </div>
                </div>
              </div>
            </section>

            {/* 5. LAUNCH */}
            <section className="launch-section bg-gradient-to-b from-[#020005] to-indigo-950/20 py-20 sm:py-32 border-t border-blue-900/20 px-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full pointer-events-none"></div>
              <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 sm:mb-20 gap-8">
                  <h2 className="text-[clamp(3rem,6vw,5.5rem)] font-light leading-none" style={fontPlayfair}>
                    Feb 12<span className="text-neon">.</span><br/>
                    <span className="text-gray-500 italic" style={fontInstrument}>The quiet invasion.</span>
                  </h2>
                  <p className="text-gray-400 font-light max-w-sm text-sm sm:text-base border-l border-neon/30 pl-6">We didn't pick Valentine's Day—too obvious. We launched two days prior. To plant the seed, we stuck unauthorized posters across campus in the dead of night. Sometimes doing illegal things is exactly what paves the way. People noticed. The quiet invasion had begun.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 px-4 sm:px-0">
                  {[
                    { img: '/blog/home-screen.png', title: 'Discover', desc: 'The starting point.' },
                    { img: '/blog/confessions.png', title: 'Confessions', desc: 'Whispers made loud.' },
                    { img: '/blog/notifications.png', title: 'Connections', desc: 'Real-time sparks.' },
                    { img: '/blog/virtual-dates.jpeg', title: 'Virtual Dates', desc: 'Movie nights synced.' }
                  ].map((card, idx) => (
                    <div key={idx} className="launch-card group relative overflow-visible aspect-auto bg-transparent flex flex-col items-center">
                      <div className="w-full aspect-[4/5] sm:aspect-[3/4] relative pointer-events-none drop-shadow-2xl">
                        <img src={card.img} alt={card.title} className="absolute inset-0 w-full h-full object-contain transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105 group-hover:-translate-y-4 filter drop-shadow-[0_20px_30px_rgba(255,0,127,0.15)]" />
                      </div>
                      <div className="w-full mt-8 text-center transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 relative z-10">
                        <div className="w-8 h-[2px] bg-neon mx-auto mb-4 transform scale-x-0 group-hover:scale-x-100 origin-center transition-transform duration-500" />
                        <h3 className="text-xl font-bold tracking-wide mb-2 text-white">{card.title}</h3>
                        <p className="text-xs text-gray-500 font-medium tracking-widest uppercase">{card.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 6. MENTORSHIP */}
            <section className="mentor-section relative py-24 sm:py-32 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 mentor-glow bg-blue-600/10 blur-[150px] rounded-full w-[100vw] h-[100vh] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-screen" />
              
              <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                <Quote className="w-10 h-10 text-neon/40 mx-auto mb-16" />
                <p className="text-[clamp(1.5rem,3.5vw,3rem)] font-light leading-[1.3] mb-16 text-gray-200" style={fontPlayfair}>
                  "Build for six to twelve months. Watch how people <i style={fontInstrument} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">actually</i> use it. The product will tell you what it wants to become."
                </p>
                <div className="inline-block border border-white/10 rounded-full px-10 py-5 bg-white/5 backdrop-blur-xl relative overflow-hidden group">
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent transform -translate-x-full group-hover:translate-x-full duration-1000 ease-in-out" />
                  <p className="text-xs uppercase tracking-[0.2em] text-white font-bold mb-1">Shrideep Tamboli</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">AI Engineer, AI Ready School</p>
                </div>
              </div>
            </section>

            {/* 7. THE TEASE */}
            <section className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-indigo-950/20 to-[#05000a] text-center min-h-[60vh] flex flex-col justify-center">
              <div className="absolute inset-0 tease-bg opacity-40 pointer-events-none" style={{
                background: 'radial-gradient(circle at center, rgba(255,0,127,0.2) 0%, rgba(5,0,10,1) 60%)'
              }} />
              
              <div className="relative z-10 px-6 max-w-4xl mx-auto origin-text">
                <Rocket className="w-8 h-8 text-neon outline-none mx-auto mb-10 drop-shadow-[0_0_20px_rgba(255,0,127,0.5)]" />
                <h2 className="text-[clamp(3.5rem,7vw,7rem)] font-black tracking-tighter mb-10 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-gray-600 leading-none">
                  Something <br className="sm:hidden" /><span className="text-neon block sm:inline mt-2 sm:mt-0" style={fontPlayfair}>Bigger</span> Is Coming.
                </h2>
                <p className="text-[clamp(1rem,1.5vw,1.25rem)] text-gray-400 font-light mb-16 max-w-2xl mx-auto leading-relaxed">
                  Next month, the rules change. We can't say what it is yet, but if you thought OTHRHALFF was just about swiping—prepare to unlearn.
                </p>
                
                {/* Magnetic-style button placeholder */}
                <button className="relative px-10 py-5 rounded-full border border-white/10 text-white font-bold uppercase tracking-widest text-xs hover:border-neon transition-all duration-500 backdrop-blur-sm group overflow-hidden bg-white/5">
                  <div className="absolute inset-0 bg-neon scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] z-[-1]" />
                  <span className="relative flex items-center justify-center gap-4 group-hover:text-black transition-colors duration-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon group-hover:bg-black group-hover:animate-none animate-pulse" />
                    Stay on the radar
                  </span>
                </button>
              </div>
            </section>

            {/* 8. THE CORE TEAM */}
            <section className="team-section relative py-20 sm:py-32 overflow-hidden bg-gradient-to-b from-[#05000a] text-center to-[#020005] z-10 border-t border-white/5">
              <div className="max-w-6xl mx-auto px-6">
                <h2 className="text-[clamp(2.5rem,5vw,5rem)] font-black text-white uppercase tracking-tighter mb-4">
                  The <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-purple-500">Core Team</span>
                </h2>
                <p className="text-gray-500 font-mono text-sm tracking-widest uppercase mb-16">The minds behind the pulse</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 mb-8 text-left">
                  {[
                    { name: "Nikhil Yadav", title: "Developer", ig: "https://www.instagram.com/nikhil_on_clouds?igsh=MTVscTYwd3VtbzlhZw==", linkedin: "https://www.linkedin.com/in/nikhil1yadav/", github: "https://github.com/Nikhil-Vzo", gradient: "from-neon/20 to-purple-600/20", border: "border-neon/30 hover:border-neon/60", iconColor: "text-neon" },
                    { name: "Avneesh Kumar Jha", title: "Developer", ig: "https://www.instagram.com/its_avneesh_15?igsh=bjJuOWFoM2hidzZ0", linkedin: "https://www.linkedin.com/in/avneesh-kumar-jha-443034319?utm_source=share_via&utm_content=profile&utm_medium=member_android", github: "https://github.com/techninja15", gradient: "from-blue-600/20 to-cyan-600/20", border: "border-blue-500/30 hover:border-blue-500/60", iconColor: "text-blue-400" }
                  ].map((dev, i) => (
                    <div key={i} className={`relative bg-gray-900/40 backdrop-blur-xl border ${dev.border} rounded-[2rem] p-8 transition-all hover:scale-[1.02] hover:bg-gray-900/60 group`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${dev.gradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] pointer-events-none`} />
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <h2 className="text-3xl font-bold text-white mb-2">{dev.name}</h2>
                        <p className={`text-xs uppercase tracking-widest font-bold mb-8 ${dev.iconColor}`}>{dev.title}</p>
                        <div className="flex gap-4 mb-4">
                          {dev.ig && <a href={dev.ig} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-full transition-all group-hover:-translate-y-1"><Instagram className="w-5 h-5 text-gray-300 hover:text-white" /></a>}
                          {dev.linkedin && <a href={dev.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-full transition-all group-hover:-translate-y-1 delay-75"><Linkedin className="w-5 h-5 text-gray-300 hover:text-white" /></a>}
                          {dev.github && <a href={dev.github} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-full transition-all group-hover:-translate-y-1 delay-150"><Github className="w-5 h-5 text-gray-300 hover:text-white" /></a>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 mb-10 text-left">
                  {[
                    { name: "Ashutosh Sahu", title: "Growth & Strategy", ig: "https://www.instagram.com/_ashutosh.__.sahu_?igsh=dXIxdHhhcGo5N2N4", linkedin: "https://www.linkedin.com/in/ashutoshsahu-/", gradient: "from-yellow-500/20 to-orange-600/20", border: "border-yellow-500/30 hover:border-yellow-500/60", iconColor: "text-yellow-500" },
                    { name: "Tushar Shendey", title: "Operations & Community", ig: "https://www.instagram.com/tusharr.30_?igsh=YWVqMHo2NWt2bTBh", linkedin: "https://www.linkedin.com/in/tushar-shendey-099a7334a/", gradient: "from-green-500/20 to-teal-500/20", border: "border-green-500/30 hover:border-green-500/60", iconColor: "text-green-400" },
                    { name: "Shreyy Sharma", title: "Growth & Marketing", ig: "https://www.instagram.com/hazelxcappuccino?igsh=MTg4M3JrbGM1N3U3Nw==", linkedin: "", gradient: "from-pink-500/20 to-rose-600/20", border: "border-pink-500/30 hover:border-pink-500/60", iconColor: "text-pink-500" }
                  ].map((member, i) => (
                    <div key={i + 2} className={`relative bg-gray-900/40 backdrop-blur-xl border ${member.border} rounded-[2rem] p-8 transition-all hover:scale-[1.02] hover:bg-gray-900/60 group`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${member.gradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] pointer-events-none`} />
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">{member.name}</h2>
                        <p className={`text-xs uppercase tracking-widest font-bold mb-8 ${member.iconColor}`}>{member.title}</p>
                        <div className="flex gap-4 mb-4">
                          {member.ig && <a href={member.ig} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-full transition-all group-hover:-translate-y-1"><Instagram className="w-4 h-4 text-gray-300 hover:text-white" /></a>}
                          {member.linkedin && <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-full transition-all group-hover:-translate-y-1 delay-75"><Linkedin className="w-4 h-4 text-gray-300 hover:text-white" /></a>}
                          {(!member.ig && !member.linkedin) && <div className="h-[42px] flex items-center"><span className="text-xs text-gray-500 italic uppercase">On the grind</span></div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 9. FOOTER */}
            <footer className="border-t border-pink-900/30 pt-16 pb-8 px-6 text-center bg-[#05000a] relative z-10 overflow-hidden">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                src="/blog/ticket-rip.webm" 
                className="absolute inset-0 w-full h-full object-cover opacity-30 z-[-2] pointer-events-none" 
              />
              <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black via-black/80 to-transparent z-[-1] pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent z-[-1] pointer-events-none" />
              
              <div className="w-12 h-12 rounded-full border border-white/10 bg-[#050505] flex items-center justify-center mx-auto mb-16 hover:bg-neon hover:border-neon transition-colors duration-500 group relative z-10">
                <Ghost className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors duration-500" />
              </div>
              
              <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-light mb-16 text-gray-400 leading-tight relative z-10 drop-shadow-xl" style={fontPlayfair}>
                We built something small.<br/>
                <span className="text-white italic" style={fontInstrument}>And it started breathing on its own.</span>
              </h2>
              
              <Link to="/" className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.2em] font-bold text-gray-400 hover:text-white transition-colors duration-300 mb-24 pb-2 border-b border-transparent hover:border-white relative z-10">
                Find Your Other Half <ArrowRight className="w-3 h-3" />
              </Link>
              
              <p className="text-[10px] tracking-[0.3em] text-gray-600 uppercase relative z-10">
                © {new Date().getFullYear()} OTHRHALFF
              </p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};
