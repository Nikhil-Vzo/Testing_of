import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Instagram, Linkedin, Github } from 'lucide-react';

export const Developers: React.FC = () => {
  const navigate = useNavigate();

  const team = [
    {
      name: "Nikhil Yadav",
      title: "Developer",
      ig: "https://www.instagram.com/nikhil_on_clouds?igsh=MTVscTYwd3VtbzlhZw==",
      linkedin: "https://www.linkedin.com/in/nikhil1yadav/",
      github: "https://github.com/Nikhil-Vzo",
      gradient: "from-neon/20 to-purple-600/20",
      border: "border-neon/30 hover:border-neon/60",
      iconColor: "text-neon"
    },
    {
      name: "Avneesh Kumar Jha",
      title: "Developer",
      ig: "https://www.instagram.com/its_avneesh_15?igsh=bjJuOWFoM2hidzZ0",
      linkedin: "https://www.linkedin.com/in/avneesh-kumar-jha-443034319?utm_source=share_via&utm_content=profile&utm_medium=member_android",
      github: "https://github.com/techninja15",
      gradient: "from-blue-600/20 to-cyan-600/20",
      border: "border-blue-500/30 hover:border-blue-500/60",
      iconColor: "text-blue-400"
    },
    {
      name: "Ashutosh Sahu",
      title: "Growth & Strategy",
      ig: "https://www.instagram.com/_ashutosh.__.sahu_?igsh=dXIxdHhhcGo5N2N4",
      linkedin: "https://www.linkedin.com/in/ashutoshsahu-/",
      gradient: "from-yellow-500/20 to-orange-600/20",
      border: "border-yellow-500/30 hover:border-yellow-500/60",
      iconColor: "text-yellow-500"
    },
    {
      name: "Tushar Shendey",
      title: "Operations & Community",
      ig: "https://www.instagram.com/tusharr.30_?igsh=YWVqMHo2NWt2bTBh",
      linkedin: "https://www.linkedin.com/in/tushar-shendey-099a7334a/",
      gradient: "from-green-500/20 to-teal-500/20",
      border: "border-green-500/30 hover:border-green-500/60",
      iconColor: "text-green-400"
    },
    {
      name: "Shreyy Sharma",
      title: "Growth & Marketing",
      ig: "https://www.instagram.com/hazelxcappuccino?igsh=MTg4M3JrbGM1N3U3Nw==",
      gradient: "from-pink-500/20 to-rose-600/20",
      border: "border-pink-500/30 hover:border-pink-500/60",
      iconColor: "text-pink-500"
    }
  ];

  return (
    <div className="h-screen h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-black flex flex-col items-center relative py-20 px-6" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[10%] w-[800px] h-[800px] bg-neon/5 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      <button
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2 transition-colors z-20"
      >
        <ArrowLeft className="w-6 h-6" /> Back
      </button>

      <div className="relative z-10 w-full max-w-6xl animate-fade-in-up mt-8">
        <h1 className="text-4xl md:text-5xl font-black text-white text-center mb-4 uppercase tracking-tighter">
          The <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-purple-500">Core Team</span>
        </h1>
        <p className="text-gray-500 text-center mb-16 font-mono text-sm tracking-widest uppercase">Building the future of connection</p>

        {/* Developers Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 mb-8">
          {team.slice(0, 2).map((dev, i) => (
            <div key={i} className={`relative bg-gray-900/40 backdrop-blur-xl border ${dev.border} rounded-[2rem] p-8 transition-all hover:scale-[1.02] hover:bg-gray-900/60 group`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${dev.gradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] pointer-events-none`} />

              <div className="relative z-10 flex flex-col items-center text-center">
                <h2 className="text-3xl font-bold text-white mb-2">{dev.name}</h2>
                <p className={`text-xs uppercase tracking-widest font-bold mb-8 ${dev.iconColor}`}>{dev.title}</p>
                
                <div className="flex gap-4 mb-4">
                  {dev.ig && (
                    <a href={dev.ig} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-full transition-all group-hover:-translate-y-1">
                      <Instagram className="w-5 h-5 text-gray-300 hover:text-white" />
                    </a>
                  )}
                  {dev.linkedin && (
                    <a href={dev.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-full transition-all group-hover:-translate-y-1 delay-75">
                      <Linkedin className="w-5 h-5 text-gray-300 hover:text-white" />
                    </a>
                  )}
                  {dev.github && (
                    <a href={dev.github} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-full transition-all group-hover:-translate-y-1 delay-150">
                      <Github className="w-5 h-5 text-gray-300 hover:text-white" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Growth & Ops Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {team.slice(2).map((member, i) => (
            <div key={i + 2} className={`relative bg-gray-900/40 backdrop-blur-xl border ${member.border} rounded-[2rem] p-8 transition-all hover:scale-[1.02] hover:bg-gray-900/60 group`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${member.gradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] pointer-events-none`} />

              <div className="relative z-10 flex flex-col items-center text-center">
                <h2 className="text-2xl font-bold text-white mb-2">{member.name}</h2>
                <p className={`text-xs uppercase tracking-widest font-bold mb-8 ${member.iconColor}`}>{member.title}</p>
                
                <div className="flex gap-4 mb-4">
                  {member.ig && (
                    <a href={member.ig} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-full transition-all group-hover:-translate-y-1">
                      <Instagram className="w-4 h-4 text-gray-300 hover:text-white" />
                    </a>
                  )}
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-full transition-all group-hover:-translate-y-1 delay-75">
                      <Linkedin className="w-4 h-4 text-gray-300 hover:text-white" />
                    </a>
                  )}
                   {(!member.ig && !member.linkedin) && (
                    <div className="h-[42px] flex items-center">
                      <span className="text-xs text-gray-500 italic uppercase">On the grind</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <p className="text-gray-600 text-xs font-mono">
            Running v3.0.0-turbo • Built with ❤️ in India By College Students
          </p>
        </div>
      </div>
    </div>
  );
};
