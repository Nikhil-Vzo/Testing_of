
import React, { useEffect, useRef, useState } from 'react';
import { Ghost, ArrowLeft, ArrowUp, TrendingUp, Users, Eye, Zap, Quote, Rocket, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

// Fade-in on scroll hook
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

const Section: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({ children, className = '', id }) => {
  const { ref, visible } = useReveal();
  return (
    <section
      id={id}
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
    >
      {children}
    </section>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; value: string; label: string; accent?: string }> = ({ icon, value, label, accent = 'text-neon' }) => (
  <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 text-center hover:border-neon/40 transition-all duration-300 group">
    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-800 mb-4 group-hover:scale-110 transition-transform ${accent}`}>
      {icon}
    </div>
    <p className={`text-3xl sm:text-4xl font-black mb-1 ${accent}`}>{value}</p>
    <p className="text-sm text-gray-400">{label}</p>
  </div>
);

export const Blog: React.FC = () => {
  // Scroll to top
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-neon selection:text-white overflow-y-auto scroll-smooth">
      {/* ── Sticky Nav ── */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-neon transition-colors" />
            <Ghost className="w-6 h-6 text-neon" />
            <span className="font-black tracking-tighter text-lg">
              <span className="group-hover:text-neon transition-colors">OTHR</span>
              <span className="text-neon group-hover:text-white transition-colors">HALFF</span>
            </span>
          </Link>
          <span className="text-xs text-gray-500 uppercase tracking-widest hidden sm:block">The Story So Far</span>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">

        {/* ════════════════════════════════════════════
            1. THE HOOK
        ════════════════════════════════════════════ */}
        <Section className="pt-16 sm:pt-24 pb-12">
          <p className="text-neon text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Behind the Build
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] mb-8">
            We Didn't Start a <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon via-purple-500 to-blue-500">
              Startup.
            </span>
            <br />
            We Started a <span className="text-neon">Feeling.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl">
            There was no pitch deck. No whiteboard. No "let's disrupt the market" speech.
            There were just two developers, a shared hostel Wi‑Fi, and a question that wouldn't stop echoing:
          </p>
          <blockquote className="mt-8 pl-6 border-l-2 border-neon/60 text-xl sm:text-2xl text-gray-300 italic font-light leading-relaxed">
            "Why does every campus dating app feel like it was made by people who've never lived on campus?"
          </blockquote>
        </Section>

        {/* ════════════════════════════════════════════
            2. THE BEGINNING
        ════════════════════════════════════════════ */}
        <Section className="py-12">
          <h2 className="text-2xl sm:text-3xl font-black mb-6 tracking-tight">
            Two People. One Dumb Idea.
          </h2>
          <p className="text-gray-400 leading-relaxed mb-6">
            It started in late 2025. <strong className="text-white">Nikhil</strong> and <strong className="text-white">Avneesh</strong> — two second‑year engineering students at Amity University, Raipur — sat in a room looking at the campus dating landscape and felt nothing but frustration.
          </p>
          <p className="text-gray-400 leading-relaxed mb-6">
            Every existing app was either too global, too fake, or too cringe. None of them understood the micro‑universe of a college campus — the inside jokes, the anonymity you crave, the confession boards, the fear of being "seen" liking someone from your own department.
          </p>
          <p className="text-gray-400 leading-relaxed mb-8">
            So they built something. Not a product. A playground. They called it <strong className="text-neon">OTHRHALFF</strong> — because what you're looking for isn't a perfect match; it's the other half of a story you haven't written yet.
          </p>

          {/* Logo Image */}
          <div className="rounded-2xl overflow-hidden border border-gray-800 max-w-md mx-auto">
            <img src="/blog/logo.webp" alt="OTHRHALFF neon ghost logo" className="w-full" loading="lazy" />
          </div>
          <p className="text-center text-xs text-gray-600 mt-3">The neon ghost — an identity born from anonymity.</p>
        </Section>

        {/* ════════════════════════════════════════════
            3. THE STRUGGLE
        ════════════════════════════════════════════ */}
        <Section className="py-12">
          <h2 className="text-2xl sm:text-3xl font-black mb-6 tracking-tight">
            We Could Build It. We Couldn't Sell It.
          </h2>
          <p className="text-gray-400 leading-relaxed mb-6">
            The code came easy — late nights fueled by instant noodles and lo‑fi beats. Anonymous profiles? Done. Campus verification with <code className="text-neon/80 bg-gray-900 px-1.5 py-0.5 rounded text-sm">.edu</code> email? Done. Confession boards, smart matching, virtual dates? All shipped.
          </p>
          <p className="text-gray-400 leading-relaxed mb-6">
            But then came the silence.
          </p>
          <p className="text-gray-400 leading-relaxed mb-6">
            Marketing was a different beast entirely. Two developers trying to run Instagram campaigns is like two guitarists trying to be a full orchestra. The features were there. The users weren't.
          </p>
          <p className="text-gray-300 leading-relaxed font-medium">
            We had a product nobody knew about. And that realization? It stung more than any bug at 3 AM.
          </p>
        </Section>

        {/* ════════════════════════════════════════════
            4. THE SHIFT
        ════════════════════════════════════════════ */}
        <Section className="py-12">
          <h2 className="text-2xl sm:text-3xl font-black mb-6 tracking-tight">
            Then Two People Changed Everything.
          </h2>
          <p className="text-gray-400 leading-relaxed mb-6">
            <strong className="text-white">Austosh</strong> and <strong className="text-white">Shreyy</strong> walked in — not with code, but with conviction. They looked at what we'd built and said: <em>"This deserves to be seen."</em>
          </p>
          <p className="text-gray-400 leading-relaxed mb-6">
            What happened next was unreasonable.
          </p>
          <div className="bg-gradient-to-r from-neon/10 via-purple-900/20 to-transparent border border-neon/20 rounded-2xl p-6 sm:p-8 mb-6">
            <p className="text-2xl sm:text-3xl font-black text-white mb-2">
              ~35,000 <span className="text-neon">organic views</span>
            </p>
            <p className="text-gray-400">on Instagram — within 20 days of launch. No paid ads. No influencer deals. Just raw, authentic storytelling.</p>
          </div>
          <p className="text-gray-400 leading-relaxed">
            They understood something we'd been too close to the code to see: people don't download features — they download feelings. And they packaged OTHRHALFF as the feeling it always was.
          </p>
        </Section>

        {/* ════════════════════════════════════════════
            5. THE LAUNCH
        ════════════════════════════════════════════ */}
        <Section className="py-12">
          <h2 className="text-2xl sm:text-3xl font-black mb-6 tracking-tight">
            February 12. The Day It Became Real.
          </h2>
          <p className="text-gray-400 leading-relaxed mb-6">
            We didn't pick Valentine's Day — too obvious. We launched two days before, on <strong className="text-white">February 12, 2026</strong>. A quiet, deliberate choice. This wasn't about romance hype. It was about planting a flag.
          </p>
          <p className="text-gray-400 leading-relaxed mb-8">
            The pilot was limited to <strong className="text-neon">Amity University, Raipur</strong> — our campus, our people, our first test audience. If it worked here, in a single college with real students who'd roast us at lunch if it sucked… then we'd know it was real.
          </p>

          {/* App Screenshots Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="rounded-2xl overflow-hidden border border-gray-800">
              <img src="/blog/home-screen.png" alt="OTHRHALFF discover screen" className="w-full" loading="lazy" />
            </div>
            <div className="rounded-2xl overflow-hidden border border-gray-800">
              <img src="/blog/confessions.png" alt="Campus confessions feature" className="w-full" loading="lazy" />
            </div>
          </div>
          <p className="text-center text-xs text-gray-600 mb-8">The Discover feed and Campus Confessions — where it all starts.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="rounded-2xl overflow-hidden border border-gray-800">
              <img src="/blog/notifications.png" alt="Match notifications" className="w-full" loading="lazy" />
            </div>
            <div className="rounded-2xl overflow-hidden border border-gray-800">
              <img src="/blog/virtual-dates.jpeg" alt="Virtual Dates feature" className="w-full" loading="lazy" />
            </div>
          </div>
          <p className="text-center text-xs text-gray-600">Real‑time match alerts and Virtual Dates — Movie Night, Soul Sync, and more.</p>
        </Section>

        {/* ════════════════════════════════════════════
            6. THE NUMBERS
        ════════════════════════════════════════════ */}
        <Section className="py-12">
          <h2 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">
            The Numbers Don't Lie.
          </h2>
          <p className="text-gray-500 text-sm mb-8">Google Analytics — 28‑day window, post‑launch.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<Users className="w-6 h-6" />} value="431" label="Active Users" />
            <StatCard icon={<Zap className="w-6 h-6" />} value="32K" label="Total Events" accent="text-purple-400" />
            <StatCard icon={<Eye className="w-6 h-6" />} value="~35K" label="Instagram Views" accent="text-blue-400" />
            <StatCard icon={<TrendingUp className="w-6 h-6" />} value="720" label="Referral Sessions" accent="text-green-400" />
          </div>

          {/* Traffic Breakdown */}
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-8 mb-6">
            <h3 className="text-lg font-bold mb-4">Traffic Breakdown <span className="text-gray-500 font-normal text-sm">(Last 28 days)</span></h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-800">
                    <th className="text-left pb-3 font-semibold">Channel</th>
                    <th className="text-right pb-3 font-semibold">Sessions</th>
                    <th className="text-left pb-3 pl-6 font-semibold hidden sm:table-cell">What it means</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-gray-800/50">
                    <td className="py-3 font-medium">Referral</td>
                    <td className="py-3 text-right text-neon font-bold">720</td>
                    <td className="py-3 pl-6 text-gray-500 hidden sm:table-cell">Links from other websites — biggest source</td>
                  </tr>
                  <tr className="border-b border-gray-800/50">
                    <td className="py-3 font-medium">Direct</td>
                    <td className="py-3 text-right font-bold">410</td>
                    <td className="py-3 pl-6 text-gray-500 hidden sm:table-cell">People typing <code className="text-gray-400 bg-gray-800 px-1 rounded text-xs">othrhalff.in</code> directly</td>
                  </tr>
                  <tr className="border-b border-gray-800/50">
                    <td className="py-3 font-medium">Organic Social</td>
                    <td className="py-3 text-right font-bold">151</td>
                    <td className="py-3 pl-6 text-gray-500 hidden sm:table-cell">From Instagram, Twitter, etc.</td>
                  </tr>
                  <tr className="border-b border-gray-800/50">
                    <td className="py-3 font-medium">Organic Search</td>
                    <td className="py-3 text-right font-bold">50</td>
                    <td className="py-3 pl-6 text-gray-500 hidden sm:table-cell">From Google — SEO is just starting</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Unassigned</td>
                    <td className="py-3 text-right font-bold">35</td>
                    <td className="py-3 pl-6 text-gray-500 hidden sm:table-cell">Uncategorized traffic</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-gray-400 leading-relaxed">
            For a product limited to a single university campus, with zero marketing budget — these numbers carry weight. 410 people typed <code className="text-neon/80 bg-gray-900 px-1.5 py-0.5 rounded text-sm">othrhalff.in</code> into their browser. That's not traffic. That's <strong className="text-white">intent</strong>.
          </p>

          {/* Analytics Screenshot */}
          <div className="rounded-2xl overflow-hidden border border-gray-800 mt-8">
            <img src="/blog/analytics-overview.png" alt="Google Analytics dashboard" className="w-full" loading="lazy" />
          </div>
          <p className="text-center text-xs text-gray-600 mt-3">Google Analytics dashboard — a launch spike that settled into steady daily usage.</p>
        </Section>

        {/* ════════════════════════════════════════════
            7. THE MENTORSHIP
        ════════════════════════════════════════════ */}
        <Section className="py-12">
          <h2 className="text-2xl sm:text-3xl font-black mb-6 tracking-tight">
            A Conversation That Recalibrated Us.
          </h2>
          <p className="text-gray-400 leading-relaxed mb-6">
            Somewhere in the midst of the early momentum, we connected with <strong className="text-white">Shrideep Tamboli</strong> — an AI Engineer at AI Ready School, Raipur, and a speaker at the Devity Club Summit. The kind of person who's been in the trenches long enough to know what matters and what's noise.
          </p>
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-8 mb-6">
            <Quote className="w-8 h-8 text-neon/40 mb-4" />
            <p className="text-lg sm:text-xl text-gray-300 italic leading-relaxed mb-4">
              "Don't draw conclusions at month one. Build for six to twelve months. Watch how people actually use it — not how you think they'll use it. The product will tell you what it wants to become."
            </p>
            <p className="text-sm text-gray-500 font-medium">
              — Shrideep Tamboli, AI Engineer at AI Ready School
            </p>
          </div>
          <p className="text-gray-400 leading-relaxed">
            That advice landed differently. It wasn't motivational — it was surgical. It reminded us that the early excitement is a trap if you mistake it for validation. The real signal comes from what users do in month three, month six. From patterns you haven't even considered yet. So we took a breath, dropped the urgency, and committed to the long game.
          </p>
        </Section>

        {/* ════════════════════════════════════════════
            8. WHERE WE ARE NOW
        ════════════════════════════════════════════ */}
        <Section className="py-12">
          <h2 className="text-2xl sm:text-3xl font-black mb-6 tracking-tight">
            Where We Are Now. Honestly.
          </h2>
          <p className="text-gray-400 leading-relaxed mb-6">
            We're still early. Still a pilot. Still limited to one campus. And we're okay with that.
          </p>
          <p className="text-gray-400 leading-relaxed mb-6">
            Every morning we open the dashboard and watch real students — people from our own hallways — confessing anonymously, matching, reacting to polls, and going on virtual movie dates. That's not a vanity metric. That's <em>life</em> happening inside something we made.
          </p>
          <p className="text-gray-400 leading-relaxed mb-6">
            We owe a quiet nod to some of our professors at Amity who helped amplify the word at the right time. Their reach within the campus — both formal and informal — made a difference during those first critical days. Good teachers don't just teach curriculum; they pay attention to what their students are building. And ours did.
          </p>
          <p className="text-gray-400 leading-relaxed">
            We're iterating. Squashing bugs. Reading feedback. And most importantly — <strong className="text-white">listening</strong>.
          </p>
        </Section>

        {/* ════════════════════════════════════════════
            9. THE TEASE
        ════════════════════════════════════════════ */}
        <Section className="py-12">
          <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-neon/5 border border-gray-800 rounded-3xl p-8 sm:p-12 text-center">
            <Rocket className="w-10 h-10 text-neon mx-auto mb-6 animate-bounce" />
            <h2 className="text-2xl sm:text-3xl font-black mb-4 tracking-tight">
              Something Big Is Coming.
            </h2>
            <p className="text-gray-400 leading-relaxed max-w-lg mx-auto mb-6">
              Our biggest update drops <strong className="text-white">next month</strong>. We can't say what it is — not yet. But if you've ever thought this app was just about swiping… you haven't seen anything.
            </p>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-neon/30 text-neon text-sm font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-neon animate-pulse" />
              Stay tuned
            </div>
          </div>
        </Section>

        {/* ════════════════════════════════════════════
            10. THE CLOSING
        ════════════════════════════════════════════ */}
        <Section className="py-16 sm:py-24 text-center">
          <div className="max-w-2xl mx-auto">
            <Ghost className="w-12 h-12 text-neon mx-auto mb-8 opacity-60" />
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 leading-relaxed font-light italic mb-8">
              We built something small.<br />
              <span className="text-white font-medium not-italic">And it started breathing on its own.</span>
            </p>
            <p className="text-gray-500 text-sm leading-relaxed mb-10">
              This isn't the end of the story. It isn't even the middle.<br />
              It's the part where you decide if you want to be part of it.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-neon text-white font-bold uppercase tracking-wider rounded-full hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_30px_rgba(255,0,127,0.4)] hover:shadow-[0_0_50px_rgba(255,0,127,0.7)]"
            >
              Find Your Othrhalff
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </Section>

        {/* ── Author / Credits ── */}
        <div className="border-t border-gray-900 pt-8 pb-4 text-center">
          <p className="text-gray-600 text-xs mb-1">Written by the OTHRHALFF team</p>
          <p className="text-gray-700 text-xs">Nikhil · Avneesh · Austosh · Shreyy</p>
        </div>
      </article>

      {/* Scroll to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-neon hover:border-neon/50 transition-all duration-300"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
