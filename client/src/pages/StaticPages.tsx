import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Ghost, Shield, Heart, Mail, Briefcase, FileText, AlertTriangle, CheckCircle2, Lock, Scale } from 'lucide-react';

// --- Shared Layout Component ---
const PageLayout: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-neon selection:text-white p-6 pb-20 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-neon/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-neon transition-colors mb-8 group"
        >
          <RotateCcw className="w-4 h-4 group-hover:-rotate-90 transition-transform" /> Back to Home
        </button>

        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-800 shadow-neon-sm shrink-0">
            {icon}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-tight">{title}</h1>
        </div>

        <div className="bg-gray-900/30 border border-gray-800 rounded-3xl p-8 md:p-12 backdrop-blur-sm animate-fade-in leading-relaxed text-gray-300 space-y-8 text-sm md:text-base">
          {children}
        </div>

        <div className="mt-12 text-center text-gray-600 text-xs">
          &copy; {new Date().getFullYear()} Othrhalff Inc. All rights reserved.
        </div>
      </div>
    </div>
  );
};

// --- Page Components ---

export const About: React.FC = () => (
  <PageLayout title="About Us" icon={<Ghost className="w-8 h-8 text-neon" />}>
    <p className="text-xl text-white font-bold mb-4">We believe dating shouldn't be a popularity contest.</p>
    <p>
      Othrhalff was born in a dorm room with a simple mission: to bring connection back to campus life without the pressure of superficial swiping.
    </p>
    <div className="p-6 border border-yellow-500/30 bg-yellow-500/5 rounded-xl">
        <h4 className="text-yellow-500 font-bold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Disclaimer</h4>
        <p className="text-xs text-yellow-200/70">
            Othrhalff is an independent platform and is <strong>not affiliated, associated, authorized, endorsed by, or in any way officially connected</strong> with any university, college, or educational institution mentioned on this site. All product and company names are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.
        </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <h3 className="text-neon font-bold mb-2">Authenticity</h3>
        <p className="text-sm">Real students, verified via .edu emails. No bots.</p>
      </div>
      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <h3 className="text-neon font-bold mb-2">Privacy</h3>
        <p className="text-sm">You control when to reveal your identity.</p>
      </div>
      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <h3 className="text-neon font-bold mb-2">Safety</h3>
        <p className="text-sm">End-to-end encrypted chats and calls.</p>
      </div>
    </div>
  </PageLayout>
);

export const Careers: React.FC = () => (
  <PageLayout title="Careers" icon={<Briefcase className="w-8 h-8 text-neon" />}>
    <h2 className="text-2xl font-bold text-white mb-4">Join the Ghost Crew</h2>
    <p className="mb-6">
      We are a small, passionate team of developers, designers, and love engineers building the next generation of social discovery.
    </p>

    <div className="p-8 bg-gray-800/30 rounded-2xl border border-gray-700 text-center">
      <Ghost className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">No Open Positions</h3>
      <p className="text-gray-400">
        We aren't hiring right now, but we are always looking for talented campus ambassadors.
        If you think you can bring Othrhalff to your university, drop us a line!
      </p>
    </div>
  </PageLayout>
);

export const Contact: React.FC = () => (
  <PageLayout title="Contact Us" icon={<Mail className="w-8 h-8 text-neon" />}>
    <p className="mb-8">Have a question, a bug report, or a success story? We'd love to hear from you.</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-6 bg-gray-800/50 rounded-2xl border border-gray-700 hover:border-neon transition-colors cursor-pointer group">
        <h3 className="text-white font-bold mb-2 group-hover:text-neon transition-colors">Support</h3>
        <p className="text-sm mb-4">For account issues and bug reports.</p>
        <a href="mailto:support@otherhalf.app" className="text-neon text-sm font-mono">support@otherhalf.app</a>
      </div>

      <div className="p-6 bg-gray-800/50 rounded-2xl border border-gray-700 hover:border-neon transition-colors cursor-pointer group">
        <h3 className="text-white font-bold mb-2 group-hover:text-neon transition-colors">Legal & Safety</h3>
        <p className="text-sm mb-4">For law enforcement or legal inquiries.</p>
        <a href="mailto:legal@otherhalf.app" className="text-neon text-sm font-mono">legal@otherhalf.app</a>
      </div>
    </div>
  </PageLayout>
);

export const Privacy: React.FC = () => (
  <PageLayout title="Privacy Policy" icon={<Lock className="w-8 h-8 text-neon" />}>
    <div className="space-y-8 text-sm">
      <div className="p-4 bg-neon/5 border border-neon/20 rounded-xl mb-6">
        <p className="font-bold text-neon mb-1">TL;DR</p>
        <p className="text-gray-400">We verify your student status but keep you anonymous. We don't sell your data. We only use your info to connect you.</p>
      </div>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">1. Data Collection</h3>
        <p>We collect the minimum data necessary to operate:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2 text-gray-400">
          <li><strong>Verification Data:</strong> University email address (strictly for verifying student status). This is encrypted and stored separately from your profile.</li>
          <li><strong>Profile Data:</strong> Gender, interests, major, year, and bio. This is public to matches.</li>
          <li><strong>Usage Data:</strong> Swipe history and match interactions to improve the algorithm.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">2. Student Verification</h3>
        <p>
            We use third-party systems or direct email verification to confirm enrollment. We <strong>do not</strong> access your university's internal systems or student records.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">3. Data Sharing</h3>
        <p>Your "Real Name" and "Avatar" are hidden until a mutual match occurs or you voluntarily reveal them. We do not sell, rent, or trade user data to third parties, including universities.</p>
      </section>
      
      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">4. Data Deletion</h3>
        <p>You may request full deletion of your account and data at any time by contacting support.</p>
      </section>
    </div>
  </PageLayout>
);

export const Terms: React.FC = () => (
  <PageLayout title="Terms of Service" icon={<Scale className="w-8 h-8 text-neon" />}>
    <div className="space-y-8 text-sm">
      <div className="p-4 border-l-4 border-red-500 bg-red-500/10 mb-6">
        <p className="font-bold text-white">Critical Disclaimer</p>
        <p className="text-gray-400 mt-1">
            Othrhalff is NOT affiliated with any university. By using this app, you acknowledge this is a private, independent service.
        </p>
      </div>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">1. Acceptance of Terms</h3>
        <p>By accessing Othrhalff, you agree to these Terms. You must be at least 18 years old and a currently enrolled university student to use this service.</p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">2. Non-Affiliation</h3>
        <p>
            Othrhalff is an independent entity. References to specific universities, colleges, or mascots are strictly for identification purposes to facilitate student connections. We claim no ownership of university trademarks.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">3. User Conduct</h3>
        <p>You agree NOT to:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2 text-gray-400">
          <li>Impersonate university officials or staff.</li>
          <li>Use the service for academic dishonesty or cheating.</li>
          <li>Harass, bully, or intimidate other users.</li>
          <li>Post illegal content or hate speech.</li>
        </ul>
        <p className="mt-2 text-red-400">Violation results in an immediate, permanent IP ban.</p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">4. Limitation of Liability</h3>
        <p className="uppercase text-xs font-bold text-gray-500 mb-2">Read Carefully</p>
        <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, OTHRHALFF SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; OR (C) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">5. Indemnification</h3>
        <p>
            You agree to indemnify and hold Othrhalff harmless from any claims, disputes, demands, liabilities, damages, losses, and costs and expenses, including, without limitation, reasonable legal and accounting fees arising out of or in any way connected with your access to or use of the Service or your violation of these Terms.
        </p>
      </section>
    </div>
  </PageLayout>
);

export const Safety: React.FC = () => (
  <PageLayout title="Safety Tips" icon={<Shield className="w-8 h-8 text-neon" />}>
    <div className="space-y-6">
      <div className="flex gap-4">
        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
        <div>
          <h3 className="text-white font-bold mb-1">Keep it on the app</h3>
          <p className="text-sm">Don't move to other messaging platforms until you feel completely comfortable. Our chat and calls are encrypted.</p>
        </div>
      </div>

      <div className="flex gap-4">
        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
        <div>
          <h3 className="text-white font-bold mb-1">Meet in public</h3>
          <p className="text-sm">If you decide to meet in person, always choose a public place on campus, like the library, student center, or a busy coffee shop.</p>
        </div>
      </div>

      <div className="flex gap-4">
        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
        <div>
          <h3 className="text-white font-bold mb-1">Guard your info</h3>
          <p className="text-sm">Even after matching, be careful about sharing your dorm room number, financial info, or home address.</p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-neon/10 border border-neon/30 rounded-xl">
        <p className="text-neon font-bold text-sm text-center">
          If you ever feel unsafe, use the "Block & Report" button in the chat menu immediately. We take all reports seriously.
        </p>
      </div>
    </div>
  </PageLayout>
);

export const Guidelines: React.FC = () => (
  <PageLayout title="Guidelines" icon={<Heart className="w-8 h-8 text-neon" />}>
    <div className="space-y-8">
      <p className="text-lg font-medium text-white">
        Othrhalff is designed to be a safe, fun, and inclusive space. To keep it that way, we ask everyone to follow these simple rules.
      </p>

      <div className="space-y-6">
        <div className="flex items-start gap-4 p-4 bg-gray-800/30 rounded-xl">
          <CheckCircle2 className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-white font-bold mb-1">Be Respectful</h3>
            <p className="text-sm text-gray-400">Treat others how you want to be treated. Ghosting happens, but rudeness is a choice. Harassment is never okay.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 bg-gray-800/30 rounded-xl">
          <CheckCircle2 className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-white font-bold mb-1">Be Honest</h3>
            <p className="text-sm text-gray-400">You are anonymous, not fake. Represent your interests and major truthfully. Catfishing is strictly prohibited.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 bg-gray-800/30 rounded-xl">
          <CheckCircle2 className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-white font-bold mb-1">Zero Tolerance for Hate</h3>
            <p className="text-sm text-gray-400">Racism, sexism, homophobia, and transphobia result in an immediate and permanent IP ban. We protect our community fiercely.</p>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
);