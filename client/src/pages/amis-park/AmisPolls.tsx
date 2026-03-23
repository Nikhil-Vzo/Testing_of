import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, BarChart2, CheckCircle2, Ghost, Plus, X, ArrowRight } from 'lucide-react';
import { useAmisPolls } from './useAmisData';

export const AmisPolls: React.FC = () => {
  const navigate = useNavigate();
  const { polls, loading, vote, createPoll } = useAmisPolls();
  const [mounted, setMounted] = useState(false);

  // Create Poll State
  const [isCreating, setIsCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const handleAddOption = () => {
    if (newOptions.length < 4) setNewOptions([...newOptions, '']);
  };

  const handleRemoveOption = (index: number) => {
    setNewOptions(newOptions.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = async () => {
    if (!newQuestion.trim() || newOptions.filter(o => o.trim()).length < 2) return;
    setIsSubmitting(true);
    const success = await createPoll(newQuestion, newOptions);
    setIsSubmitting(false);
    if (success) {
      setIsCreating(false);
      setNewQuestion('');
      setNewOptions(['', '']);
    }
  };

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

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold tracking-tight text-white/90">Recent Polls</h2>
            {!isCreating && (
              <button 
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full transition-all text-sm font-bold uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" />
                New Poll
              </button>
            )}
          </div>

          {/* Create Poll Form */}
          {isCreating && (
            <div className="bg-black/40 backdrop-blur-2xl border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)] rounded-3xl p-6 mb-8 transition-all animate-in fade-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Ask the Crowd</h3>
                <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="What's your question? e.g. Best DJ tonight?"
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Options</label>
                  {newOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={e => {
                          const updated = [...newOptions];
                          updated[idx] = e.target.value;
                          setNewOptions(updated);
                        }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                      {newOptions.length > 2 && (
                        <button onClick={() => handleRemoveOption(idx)} className="p-2.5 text-red-400/50 hover:text-red-400 bg-red-400/5 hover:bg-red-400/10 rounded-xl border border-transparent hover:border-red-400/20 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {newOptions.length < 4 && (
                  <button onClick={handleAddOption} className="text-blue-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:text-blue-300 transition-colors">
                    <Plus className="w-3 h-3" /> Add Option
                  </button>
                )}

                <button 
                  onClick={handleCreateSubmit}
                  disabled={isSubmitting || !newQuestion.trim() || newOptions.filter(o => o.trim()).length < 2}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      Post Poll <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

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
              <p className="text-gray-700 text-xs">Be the first to ask the crowd!</p>
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
