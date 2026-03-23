import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, BarChart2, CheckCircle2, Ghost } from 'lucide-react';
import { useAmisPolls } from './useAmisData';

export const AmisPolls: React.FC = () => {
  const navigate = useNavigate();
  const { polls, loading, vote } = useAmisPolls();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  return (
    <div className="h-full w-full bg-transparent text-white flex flex-col relative overflow-hidden">

      {/* === REACTIVE BACKGROUND === */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-25%] right-[-15%] w-[55%] h-[55%] rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[45%] h-[45%] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)' }} />
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '256px 256px' }} />
      </div>

      {/* === HEADER === */}
      <div className="flex-none p-4 md:px-8 border-b border-gray-800/50 bg-black/40 backdrop-blur-2xl z-40 sticky top-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/amis-park')} className="p-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 hover:border-blue-500/30 hover:text-blue-400 transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">
              Live <span className="bg-gradient-to-r from-blue-400 to-pink-500 bg-clip-text text-transparent">Polls</span>
            </h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Share your opinion</p>
          </div>
          <BarChart2 className="w-6 h-6 text-blue-500/30" />
        </div>
      </div>

      {/* === CONTENT === */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10 w-full">
        <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto pb-28 md:pb-8">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-gray-600 text-xs uppercase tracking-widest font-bold">Loading polls...</p>
            </div>
          ) : polls.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-900/50 rounded-full flex items-center justify-center mb-4 border border-gray-800">
                <Ghost className="w-8 h-8 text-gray-700" />
              </div>
              <p className="text-gray-500 text-sm font-bold mb-1">No active polls</p>
              <p className="text-gray-700 text-xs">Check back later for new votes</p>
            </div>
          ) : (
            <div className="space-y-6">
              {polls.map((poll, idx) => {
                const totalVotes = poll.options.reduce((sum, opt) => sum + opt.vote_count, 0);
                const hasVoted = !!poll.user_voted_option_id;

                return (
                  <div 
                    key={poll.id} 
                    className={`bg-black/40 backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    style={{ transitionDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <h2 className="text-lg md:text-xl font-bold leading-tight tracking-tight max-w-[85%]">{poll.question}</h2>
                      <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                        {totalVotes} Votes
                      </div>
                    </div>

                    <div className="space-y-3">
                      {poll.options.map(option => {
                        const isSelected = poll.user_voted_option_id === option.id;
                        const percentage = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0;

                        return (
                          <div key={option.id} className="relative group">
                            <button
                              onClick={() => !hasVoted && vote(poll.id, option.id)}
                              disabled={hasVoted}
                              className={`w-full relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-300 ${
                                hasVoted
                                  ? isSelected 
                                    ? 'border-blue-500/50 bg-blue-500/10' 
                                    : 'border-white/[0.04] bg-white/[0.02]'
                                  : 'border-white/10 bg-black/40 hover:border-white/30 hover:bg-white/5'
                              }`}
                            >
                              {/* Progress Bar Background (only visible after voting) */}
                              {hasVoted && (
                                <div 
                                  className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out ${isSelected ? 'bg-gradient-to-r from-blue-600/40 to-pink-600/40' : 'bg-white/5'}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              )}

                              <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {/* Selection Indicator */}
                                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                    isSelected 
                                      ? 'border-blue-400 bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                                      : hasVoted
                                        ? 'border-transparent' // hide circle if voted but not selected
                                        : 'border-white/30 group-hover:border-white/60'
                                  }`}>
                                    {isSelected && <CheckCircle2 className="w-3 h-3" />}
                                  </div>
                                  <span className={`text-sm font-semibold transition-colors ${isSelected ? 'text-white' : hasVoted ? 'text-gray-400' : 'text-gray-200 group-hover:text-white'}`}>
                                    {option.text}
                                  </span>
                                </div>
                                
                                {/* Percentage (only visible after voting) */}
                                {hasVoted && (
                                  <span className={`text-sm font-bold transition-all duration-500 ${isSelected ? 'text-blue-300' : 'text-gray-500'}`}>
                                    {percentage}%
                                  </span>
                                )}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AmisPolls;
