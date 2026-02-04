import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const Developers: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center relative p-6">
      
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2 transition-colors z-10"
      >
        <ArrowLeft className="w-6 h-6" /> Back
      </button>

      <div className="text-center animate-fade-in-up">

        <div className="relative inline-block">
  <div className="absolute -inset-1 bg-neon blur opacity-20 animate-pulse"></div>

  <video
    src="/videoplayback.mp4"
    className="relative rounded-2xl shadow-2xl border border-gray-800 max-w-full w-[400px] h-auto"
    autoPlay
    playsInline
    loop
  ></video>
</div>



        <h1 className="text-3xl md:text-4xl font-black text-white mt-8 uppercase tracking-tighter">
          Meet the <span className="text-neon">Devs</span>?
        </h1>

        <p className="text-gray-500 text-sm mt-2 font-mono uppercase tracking-widest">
          Top Secret Information 🤫
        </p>

      </div>
    </div>
  );
};