import React, { useState, useEffect } from 'react';
import { Ghost } from 'lucide-react';
import { getRandomQuote } from '../data/loadingQuotes';

interface LoadingStateProps {
    message?: string;
    className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message, className = '' }) => {
    const [quote] = useState(getRandomQuote());

    return (
        <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-4 ${className}`}>
            {/* Backdrop Blur */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-all duration-500" />

            <div className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full text-center">

                {/* Two Ghosts Animation */}
                <div className="relative flex items-center justify-center h-20 w-32">
                    {/* Neon Ghost (Pink) */}
                    <div className="absolute left-8 animate-bounce" style={{ animationDuration: '2s', animationDelay: '0.1s' }}>
                        <Ghost className="w-10 h-10 text-neon drop-shadow-[0_0_15px_rgba(255,0,127,0.6)]" strokeWidth={2.5} />
                    </div>

                    {/* White Ghost */}
                    <div className="absolute right-8 animate-bounce" style={{ animationDuration: '2.2s', animationDelay: '0s' }}>
                        <Ghost className="w-10 h-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" strokeWidth={2} />
                    </div>

                    {/* Connection Line / Sparkle (Optional enhancement) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neon/5 blur-xl animate-pulse" />
                </div>

                {/* Quote pill */}
                <div className="bg-black/80 backdrop-blur-md border border-gray-800/50 px-6 py-4 rounded-2xl shadow-2xl transform transition-all hover:scale-105 duration-500">
                    <p className="text-gray-200 text-sm font-medium font-sans leading-relaxed tracking-wide">
                        "{message || quote}"
                    </p>
                </div>
            </div>
        </div>
    );
};
