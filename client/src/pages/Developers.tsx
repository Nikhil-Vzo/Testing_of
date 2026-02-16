import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Code, Terminal } from 'lucide-react';

export const Developers: React.FC = () => {
  const navigate = useNavigate();

  const devs = [
    {
      name: "bacardi limon",
      icon: <Code className="w-8 h-8 text-neon" />,
      gradient: "from-neon/20 to-purple-600/20",
      border: "border-neon/30 hover:border-neon/60"
    },
    {
      name: "frooti",
      icon: <Terminal className="w-8 h-8 text-blue-400" />,
      gradient: "from-blue-600/20 to-cyan-600/20",
      border: "border-blue-500/30 hover:border-blue-500/60"
    }
  ];

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center relative p-6 overflow-hidden">

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[10%] w-[800px] h-[800px] bg-neon/5 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2 transition-colors z-20"
      >
        <ArrowLeft className="w-6 h-6" /> Back
      </button>

      <div className="relative z-10 w-full max-w-4xl animate-fade-in-up">

        <h1 className="text-4xl md:text-5xl font-black text-white text-center mb-4 uppercase tracking-tighter">
          The <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-purple-500">Creators</span>
        </h1>
        <p className="text-gray-500 text-center mb-12 font-mono text-sm tracking-widest uppercase">Building the future of connection</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
          {devs.map((dev, i) => (
            <div key={i} className={`relative bg-gray-900/40 backdrop-blur-xl border ${dev.border} rounded-[2rem] p-8 transition-all hover:scale-[1.02] hover:bg-gray-900/60 group`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${dev.gradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] pointer-events-none`} />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center mb-6 border border-gray-700 shadow-xl group-hover:shadow-neon/20 transition-all">
                  {dev.icon}
                </div>

                <h2 className="text-2xl font-bold text-white mb-1">{dev.name}</h2>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 text-xs font-mono">
            Running v3.0.0-turbo • Made with ❤️ in India
          </p>
        </div>

      </div>
    </div>
  );
};
