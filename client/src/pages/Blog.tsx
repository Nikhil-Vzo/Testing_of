import React, { useEffect, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ghost, ArrowLeft, TrendingUp, Users, Eye, Zap, Quote, Rocket, Sparkles, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const Blog: React.FC = () => {
  const mainRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
      // 1. Hero Reveal
      gsap.from('.hero-text', {
        y: 80,
        opacity: 0,
        duration: 1.5,
        stagger: 0.2,
        ease: 'power3.out',
        delay: 0.3
      });

      gsap.to('.hero-bg', {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      // 2. Parallax Origin Image
      gsap.to('.origin-img', {
        yPercent: -20,
        ease: 'none',
        scrollTrigger: {
          trigger: '.origin-section',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });

      gsap.from('.origin-text', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        scrollTrigger: {
          trigger: '.origin-section',
          start: 'top 75%'
        }
      });

      // 3. Staggered Thoughts (The Struggle)
      const thoughtWords = gsap.utils.toArray<HTMLElement>('.struggle-word');
      gsap.fromTo(thoughtWords, 
        { opacity: 0.1, color: '#333' },
        {
          opacity: 1,
          color: '#fff',
          stagger: 1,
          scrollTrigger: {
            trigger: '.struggle-section',
            start: 'top 80%',
            end: 'bottom 50%',
            scrub: 1.5
          }
        }
      );

      // 4. Counter Animation (Growth Explosion)
      ScrollTrigger.create({
        trigger: '.growth-section',
        start: 'top 70%',
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

      // 5. Floating cards (Launch)
      gsap.from('.launch-card', {
        scrollTrigger: {
          trigger: '.launch-section',
          start: 'top 80%'
        },
        y: 50,
        opacity: 0,
        rotation: 2,
        duration: 1,
        stagger: 0.15,
        ease: 'back.out(1.4)'
      });

      // 6. Mentor spotlight pulse
      gsap.fromTo('.mentor-glow', 
        { scale: 0.8, opacity: 0 },
        {
          scale: 1, opacity: 0.5,
          duration: 2,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
          scrollTrigger: {
            trigger: '.mentor-section',
            start: 'top 80%'
          }
        }
      );

      // 7. The Tease background pulse
      gsap.to('.tease-bg', {
        scale: 1.05,
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: 'none'
      });
      
    }, mainRef);
    
    return () => {
      ctx.revert();
      ScrollTrigger.defaults({ scroller: window }); // reset on unmount
    };
  }, []);

  // Typography helper styles
  const fontPlayfair = { fontFamily: "'Playfair Display', serif" };
  const fontInstrument = { fontFamily: "'Instrument Serif', serif" };

  return (
    <div className="bg-black text-white selection:bg-neon selection:text-white relative font-sans overflow-hidden h-screen w-full">
      
      {/* Universal Grain Overlay - Not affected by scrolling */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.04]" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      ></div>

      {/* Global Nav - Fixed top */}
      <nav className="fixed top-0 w-full z-40 bg-black/40 backdrop-blur-md border-b border-white/10 mix-blend-difference">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <ArrowLeft className="w-5 h-5 text-gray-300 group-hover:-translate-x-1 transition-transform" />
            <Ghost className="w-6 h-6 text-white" />
            <span className="font-bold tracking-widest text-sm uppercase">Return</span>
          </Link>
          <span className="text-xs text-gray-400 uppercase tracking-[0.3em]" style={fontPlayfair}>Volume I</span>
        </div>
      </nav>

      {/* Lenis scroll wrapper */}
      <div ref={mainRef} className="h-screen w-full overflow-y-auto overflow-x-hidden relative z-10">
        <div ref={contentRef} className="w-full relative min-h-full">
          <main>
            {/* 1. HERO SECTION */}
            <section className="hero-section relative h-screen flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 z-0 hero-bg border-none scale-[1.15]">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover opacity-30"
                >
                  <source src="https://assets.mixkit.co/videos/preview/mixkit-dust-particles-in-slow-motion-along-a-black-background-4739-large.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              </div>
              
              <div className="relative z-10 text-center px-4 pt-20">
                <p className="hero-text text-neon text-sm sm:text-base font-semibold uppercase tracking-[0.4em] mb-6 flex items-center justify-center gap-3">
                  <Sparkles className="w-4 h-4" /> The Prologue
                </p>
                <h1 className="hero-text text-5xl sm:text-7xl md:text-9xl font-black tracking-tight leading-[0.9] mb-8" style={fontPlayfair}>
                  It started as a <br />
                  <span className="italic font-light text-gray-300" style={fontInstrument}>side project.</span>
                </h1>
                <p className="hero-text text-lg sm:text-xl text-gray-400 font-light tracking-wide max-w-xl mx-auto">
                  No pitch deck. No whiteboard. Just a shared hostel Wi-Fi and a question that kept echoing.
                </p>
              </div>
            </section>

            {/* 2. ORIGIN STORY */}
            <section className="origin-section relative py-32 px-6 sm:px-12 md:px-24 max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="order-2 md:order-1 origin-text">
                  <h2 className="text-4xl text-gray-500 uppercase tracking-widest text-sm font-bold mb-6">01 // The Catalyst</h2>
                  <p className="text-2xl sm:text-4xl font-light leading-snug mb-8" style={fontPlayfair}>
                    "Why does every campus dating app feel like it was made by people who've never <i style={fontInstrument}>lived</i> on campus?"
                  </p>
                  <div className="space-y-6 text-gray-400 text-lg leading-relaxed font-light">
                    <p>
                      It was late 2025. Nikhil and Avneesh, two engineering students at Amity University, Raipur, looked at the existing landscape and felt nothing but frustration.
                    </p>
                    <p>
                      So they built a playground. Not a product. They called it <strong className="text-white font-medium">OTHRHALFF</strong> — because what you're looking for isn't a perfect match; it's the other half of a story you haven't written yet.
                    </p>
                  </div>
                </div>
                
                <div className="order-1 md:order-2 relative h-[60vh] rounded-2xl overflow-hidden bg-gray-900 border border-white/10 group">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-neon mix-blend-overlay transition-opacity duration-700 z-10"></div>
                  <img 
                    src="/blog/logo.webp" 
                    alt="OTHRHALFF Identity" 
                    className="w-full h-full object-cover origin-img scale-125 opacity-80" 
                  />
                </div>
              </div>
            </section>

            {/* 3. THE STRUGGLE */}
            <section className="struggle-section bg-[#050505] py-40 border-y border-white/5 relative">
              <div className="max-w-4xl mx-auto px-6 text-center">
                <h2 className="text-4xl sm:text-6xl md:text-7xl font-light leading-[1.1]" style={fontPlayfair}>
                  {'We built it. But marketing to your own peers is like screaming into a void.'.split(' ').map((word, i) => (
                    <span key={i} className="struggle-word inline-block mr-3 mb-2">{word}</span>
                  ))}
                </h2>
                <p className="mt-16 text-xl text-gray-500 font-light max-w-2xl mx-auto origin-text">
                  The code came easy. Late nights, instant noodles, seamless anonymity. 
                  But a product without people is just a haunted house with the lights on.
                </p>
              </div>
            </section>

            {/* 4. GROWTH EXPLOSION */}
            <section className="growth-section py-32 px-6 max-w-7xl mx-auto">
              <div className="flex flex-col items-center justify-center text-center mb-24 origin-text">
                <h2 className="text-sm uppercase tracking-[0.3em] text-neon font-bold mb-4">The Turning Point</h2>
                <p className="text-3xl sm:text-5xl font-light" style={fontPlayfair}>Then Austosh and Shreyy stepped in.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-16">
                <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-10 flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-neon/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-neon/20 transition-colors duration-700"></div>
                  <h3 id="view-counter" className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-600 tracking-tighter mb-4">
                    0+ Views
                  </h3>
                  <p className="text-gray-400 text-lg">Organic reach on Instagram within 20 days. No ads. Just raw storytelling.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                   <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 flex flex-col justify-center origin-text">
                      <Users className="w-8 h-8 text-gray-500 mb-6" />
                      <p className="text-4xl font-bold mb-2">431</p>
                      <p className="text-sm text-gray-500 uppercase tracking-widest">Active Users</p>
                   </div>
                   <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 flex flex-col justify-center origin-text">
                      <TrendingUp className="w-8 h-8 text-neon mb-6" />
                      <p className="text-4xl font-bold mb-2">720</p>
                      <p className="text-sm text-gray-500 uppercase tracking-widest">Ref Sessions</p>
                   </div>
                   <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 flex flex-col justify-center col-span-2 origin-text">
                      <Zap className="w-8 h-8 text-yellow-500 mb-4" />
                      <p className="text-3xl font-bold mb-2">32,000+</p>
                      <p className="text-sm text-gray-500 uppercase tracking-widest">In-App Events Fired</p>
                   </div>
                </div>
               </div>
            </section>

            {/* 5. LAUNCH */}
            <section className="launch-section bg-zinc-950 py-32 border-t border-white/5 px-6">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl sm:text-6xl font-light mb-16" style={fontPlayfair}>
                  February 12 <br/><span className="text-gray-600 italic" style={fontInstrument}>The quiet invasion.</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { img: '/blog/home-screen.png', title: 'Discover', desc: 'The starting point.' },
                    { img: '/blog/confessions.png', title: 'Confessions', desc: 'Whispers made loud.' },
                    { img: '/blog/notifications.png', title: 'Connections', desc: 'Real-time sparks.' },
                    { img: '/blog/virtual-dates.jpeg', title: 'Virtual Dates', desc: 'Movie nights synced.' }
                  ].map((card, idx) => (
                    <div key={idx} className="launch-card group relative rounded-2xl overflow-hidden aspect-[3/4] border border-white/10">
                      <img src={card.img} alt={card.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-6">
                        <h3 className="text-xl font-bold tracking-wide">{card.title}</h3>
                        <p className="text-sm text-gray-400 font-light">{card.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 6. MENTORSHIP */}
            <section className="mentor-section relative py-40 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 mentor-glow bg-blue-500/10 blur-[150px] rounded-full w-[80vw] h-[80vh] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              
              <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                <Quote className="w-12 h-12 text-white/20 mx-auto mb-10" />
                <p className="text-3xl sm:text-5xl font-light leading-snug mb-10 text-gray-200" style={fontPlayfair}>
                  "Build for six to twelve months. Watch how people <i style={fontInstrument}>actually</i> use it. The product will tell you what it wants to become."
                </p>
                <p className="text-sm uppercase tracking-widest text-neon font-bold">Shrideep Tamboli</p>
                <p className="text-gray-500 mt-2">AI Engineer, AI Ready School</p>
              </div>
            </section>

            {/* 7. THE TEASE */}
            <section className="relative py-40 overflow-hidden bg-black text-center min-h-[70vh] flex flex-col justify-center">
              <div className="absolute inset-0 tease-bg opacity-40" style={{
                background: 'radial-gradient(circle at center, #2e0018 0%, #000 70%)'
              }} />
              
              <div className="relative z-10 px-6 max-w-3xl mx-auto origin-text">
                <Rocket className="w-8 h-8 text-neon/50 mx-auto mb-8" />
                <h2 className="text-5xl sm:text-7xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-gray-600">
                  Something <span className="text-neon" style={fontPlayfair}>Bigger</span> Is Coming.
                </h2>
                <p className="text-xl text-gray-400 font-light mb-12">
                  Next month, the rules change. We can't say what it is yet, but if you thought OTHRHALFF was just about swiping...
                </p>
                <button className="px-8 py-4 rounded-full border border-neon/50 text-white font-bold uppercase tracking-widest text-sm hover:bg-neon hover:text-black transition-all duration-300 backdrop-blur-sm group">
                  <span className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-neon group-hover:bg-black animate-pulse" />
                    Stay on the radar
                  </span>
                </button>
              </div>
            </section>

            {/* 8. FOOTER */}
            <footer className="border-t border-white/10 py-16 px-6 text-center bg-black relative z-10">
              <Ghost className="w-8 h-8 text-white/20 mx-auto mb-8" />
              <h2 className="text-2xl sm:text-4xl font-light italic mb-12 text-gray-400" style={fontInstrument}>
                We built something small.<br/>
                <span className="text-white not-italic" style={fontPlayfair}>And it started breathing on its own.</span>
              </h2>
              
              <Link to="/" className="inline-flex items-center gap-2 text-sm uppercase tracking-widest font-bold text-gray-500 hover:text-neon transition-colors duration-300 mb-16">
                Find Your Other Half <ArrowRight className="w-4 h-4" />
              </Link>
              
              <p className="text-xs tracking-[0.2em] text-white/30 uppercase">
                © 2026 OTHRHALFF · Nikhil, Avneesh, Austosh, Shreyy
              </p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};
