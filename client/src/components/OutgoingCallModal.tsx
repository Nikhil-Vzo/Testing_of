import React, { useEffect, useRef } from 'react';
import { PhoneOff, Video, Phone } from 'lucide-react';

interface OutgoingCallModalProps {
    receiverName: string;
    receiverAvatar: string;
    onCancel: () => void;
    isVideoCall?: boolean;
}

export const OutgoingCallModal: React.FC<OutgoingCallModalProps> = ({
    receiverName,
    receiverAvatar,
    onCancel,
    isVideoCall = true
}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Play calling tone
        const audio = new Audio('/sounds/calling.mp3');
        audio.loop = true;
        audio.play().catch(err => console.log('Audio autoplay blocked:', err));
        audioRef.current = audio;

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/10 via-transparent to-transparent opacity-50" />

            {/* Main card */}
            <div className="relative max-w-md w-full bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-3xl p-8 shadow-2xl">

                {/* Receiver avatar */}
                <div className="relative mx-auto w-32 h-32 mb-6">
                    <img
                        src={receiverAvatar}
                        alt={receiverName}
                        className="w-full h-full rounded-full object-cover border-4 border-gray-700 shadow-lg"
                    />

                    {/* Call type badge */}
                    <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-2 shadow-lg animate-pulse">
                        {isVideoCall ? (
                            <Video className="w-5 h-5 text-white" />
                        ) : (
                            <Phone className="w-5 h-5 text-white" />
                        )}
                    </div>
                </div>

                {/* Status */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-1">{receiverName}</h2>
                    <div className="flex items-center justify-center gap-2">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <p className="text-blue-400 text-sm font-medium">
                            Calling...
                        </p>
                    </div>
                </div>

                {/* Cancel button */}
                <div className="flex items-center justify-center">
                    <button
                        onClick={onCancel}
                        className="group relative w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 shadow-2xl shadow-red-500/30"
                    >
                        <PhoneOff className="w-10 h-10 text-white" />
                        <span className="absolute -bottom-8 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            Cancel
                        </span>
                    </button>
                </div>

                {/* Hint */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-600">
                        Waiting for {receiverName} to answer...
                    </p>
                </div>
            </div>
        </div>
    );
};
