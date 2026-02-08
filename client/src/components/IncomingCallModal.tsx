import React, { useEffect, useState, useRef } from 'react';
import { Phone, X, Video } from 'lucide-react';

interface IncomingCallModalProps {
    callerName: string;
    callerAvatar: string;
    onAccept: () => void;
    onReject: () => void;
    isVideoCall?: boolean;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
    callerName,
    callerAvatar,
    onAccept,
    onReject,
    isVideoCall = true
}) => {
    const [pulseAnimation, setPulseAnimation] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Pulse animation
        const interval = setInterval(() => {
            setPulseAnimation(prev => (prev + 1) % 3);
        }, 1000);

        // Synthetic Ringtone (Web Audio API)
        let audioCtx: AudioContext | null = null;
        let osc1: OscillatorNode | null = null;
        let osc2: OscillatorNode | null = null;
        let gainNode: GainNode | null = null;
        let loopInterval: NodeJS.Timeout | null = null;

        const startRingtone = () => {
            try {
                // Prevent duplicate context
                if (audioCtx) return;

                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioCtx = new AudioContextClass();

                // Create nodes
                osc1 = audioCtx.createOscillator();
                osc2 = audioCtx.createOscillator();
                gainNode = audioCtx.createGain();

                // Standard US Ringtone frequencies
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(480, audioCtx.currentTime);

                // Connect graph
                osc1.connect(gainNode);
                osc2.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                // Start oscillators
                osc1.start();
                osc2.start();

                // Ring pattern: 2s ON, 4s OFF
                const playRing = () => {
                    if (!gainNode || !audioCtx) return;
                    const now = audioCtx.currentTime;

                    // Ramp up
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.1); // Low volume to be non-intrusive

                    // Sustain
                    gainNode.gain.setValueAtTime(0.1, now + 2);

                    // Ramp down
                    gainNode.gain.linearRampToValueAtTime(0, now + 2.1);
                };

                // Play immediate then loop
                playRing();
                loopInterval = setInterval(playRing, 6000);

            } catch (err) {
                console.error('Failed to start ringtone:', err);
            }
        };

        // Attempt playback
        startRingtone();

        return () => {
            clearInterval(interval);
            if (loopInterval) clearInterval(loopInterval);
            if (osc1) { try { osc1.stop(); } catch (e) { } }
            if (osc2) { try { osc2.stop(); } catch (e) { } }
            if (audioCtx) { try { audioCtx.close(); } catch (e) { } }
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-radial from-neon/10 via-transparent to-transparent opacity-50" />

            {/* Main call card */}
            <div className="relative max-w-md w-full bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-3xl p-8 shadow-2xl">

                {/* Caller avatar with pulse rings */}
                <div className="relative mx-auto w-32 h-32 mb-6">
                    {/* Pulse rings */}
                    {[0, 1, 2].map((index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 rounded-full border-2 border-neon ${pulseAnimation === index ? 'animate-ping opacity-75' : 'opacity-0'
                                }`}
                            style={{ animationDuration: '3s' }}
                        />
                    ))}

                    {/* Avatar */}
                    <img
                        src={callerAvatar}
                        alt={callerName}
                        className="w-full h-full rounded-full object-cover border-4 border-neon shadow-lg shadow-neon/50 relative z-10"
                    />

                    {/* Call type badge */}
                    <div className="absolute -bottom-2 -right-2 bg-neon rounded-full p-2 shadow-lg z-20">
                        {isVideoCall ? (
                            <Video className="w-5 h-5 text-white" />
                        ) : (
                            <Phone className="w-5 h-5 text-white" />
                        )}
                    </div>
                </div>

                {/* Caller info */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-1">{callerName}</h2>
                    <p className="text-neon text-sm font-medium animate-pulse">
                        Incoming {isVideoCall ? 'video' : 'voice'} call...
                    </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-6">
                    {/* Reject button */}
                    <button
                        onClick={onReject}
                        className="group relative w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 shadow-lg"
                    >
                        <X className="w-8 h-8 text-white" />
                        <span className="absolute -bottom-8 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            Decline
                        </span>
                    </button>

                    {/* Accept button */}
                    <button
                        onClick={onAccept}
                        className="group relative w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 shadow-2xl shadow-green-500/50 animate-pulse"
                    >
                        <Phone className="w-10 h-10 text-white" />
                        <span className="absolute -bottom-8 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            Accept
                        </span>
                    </button>
                </div>

                {/* Swipe hint for mobile */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-600">
                        Call will end in 30 seconds if not answered
                    </p>
                </div>
            </div>
        </div>
    );
};
