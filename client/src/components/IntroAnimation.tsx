import React, { useEffect, useState } from 'react';
import { Ghost } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0); // 0: Init, 1: Slide In, 2: Snap, 3: Shockwave, 4: Text Reveal

  useEffect(() => {
    // Sequence Timeline
    const timers = [
      setTimeout(() => setStep(1), 100),   // Start Sliding (Duration 1000ms)
      setTimeout(() => setStep(2), 1000),  // Snap Together (Duration 400ms) - Interrupts slide for continuous motion
      setTimeout(() => setStep(3), 1400),  // Shockwave (Synced: 1000 + 400 = 1400)
      setTimeout(() => setStep(4), 1800),  // Text Reveal
      setTimeout(() => onComplete(), 4000) // End
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      {/* Shockwave Effect on Merge */}
      {step >= 3 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-neon animate-shockwave pointer-events-none" />
      )}

      <div className="relative flex flex-col items-center">
        <div className="relative w-40 h-40 mb-8">
          {/* Left Half (White) */}
          <div
            className={`absolute top-0 left-0 w-1/2 h-full overflow-hidden
              ${step === 0 ? '-translate-x-[200%] opacity-0' : ''}
              ${step === 1 ? 'translate-x-[-15%] transition-all duration-[1000ms] ease-in' : ''} 
              ${step >= 2 ? 'translate-x-0 transition-all duration-[400ms] ease-out' : ''}
            `}
          >
            <Ghost className="w-40 h-40 text-white absolute top-0 left-0" strokeWidth={1.5} />
          </div>

          {/* Right Half (Neon) */}
          <div
            className={`absolute top-0 right-0 w-1/2 h-full overflow-hidden
              ${step === 0 ? 'translate-x-[200%] opacity-0' : ''}
              ${step === 1 ? 'translate-x-[15%] transition-all duration-[1000ms] ease-in' : ''} 
              ${step >= 2 ? 'translate-x-0 drop-shadow-[0_0_15px_rgba(255,0,127,0.8)] transition-all duration-[400ms] ease-out' : ''}
            `}
          >
            <Ghost className="w-40 h-40 text-neon absolute top-0 right-0" strokeWidth={1.5} />
          </div>

          {/* Sparkle on connection */}
          {step === 3 && (
            <div className="absolute top-1/2 left-1/2 w-full h-1 bg-white blur-md -translate-x-1/2 animate-pulse" />
          )}
        </div>

        {/* Text Reveal - Centered Split */}
        <div className={`flex items-center justify-center gap-2 transition-all duration-700 transform ${step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-right">
            <span className="text-5xl font-black tracking-tighter text-white">OTHR</span>
          </div>
          <div className="text-left">
            <span className="text-5xl font-black tracking-tighter text-neon drop-shadow-neon">HALFF</span>
          </div>
        </div>

        {/* Caption */}
        <div className={`mt-2 transition-all duration-700 delay-200 transform ${step >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-gray-400 text-sm tracking-[0.5em] uppercase text-center">University Dating Reimagined</p>
        </div>
      </div>
    </div>
  );
};