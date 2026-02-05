import React from 'react';
import { X, Heart, XCircle, GraduationCap, User, Sparkles, MapPin } from 'lucide-react';

interface ProfileData {
    id: string;
    anonymousId: string;
    realName?: string;
    avatar: string;
    university: string;
    year: string;
    branch: string;
    bio?: string;
    interests?: string[];
    isVerified?: boolean;
}

interface ProfilePreviewModalProps {
    isOpen: boolean;
    profile: ProfileData | null;
    notificationId: string;
    onClose: () => void;
    onLikeBack: (notificationId: string, userId: string) => Promise<void>;
    onReject: (notificationId: string) => Promise<void>;
    isProcessing: boolean;
}

export const ProfilePreviewModal: React.FC<ProfilePreviewModalProps> = ({
    isOpen,
    profile,
    notificationId,
    onClose,
    onLikeBack,
    onReject,
    isProcessing
}) => {
    if (!isOpen || !profile) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 w-full max-w-lg rounded-[2rem] border border-gray-800 shadow-2xl overflow-hidden relative animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-10 p-2 bg-black/60 backdrop-blur rounded-full text-gray-400 hover:text-white hover:bg-black/80 transition-all border border-gray-700"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header with Image */}
                <div className="relative h-96 overflow-hidden">
                    <img
                        src={profile.avatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900" />

                    {/* Name Badge at Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-3xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                                {profile.anonymousId}
                            </h2>
                            {profile.isVerified && (
                                <Sparkles className="w-6 h-6 text-blue-400 drop-shadow-lg" />
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-200 drop-shadow-lg">
                            <GraduationCap className="w-4 h-4" />
                            <span>{profile.university}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Year & Branch */}
                    <div className="flex gap-2">
                        <span className="px-4 py-2 bg-gray-800 rounded-full text-sm border border-gray-700 text-gray-300">
                            {profile.year}
                        </span>
                        <span className="px-4 py-2 bg-gray-800 rounded-full text-sm border border-gray-700 text-gray-300">
                            {profile.branch}
                        </span>
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                About
                            </h3>
                            <p className="text-gray-300 leading-relaxed text-base">
                                "{profile.bio}"
                            </p>
                        </div>
                    )}

                    {/* Interests */}
                    {profile.interests && profile.interests.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                <Heart className="w-4 h-4" />
                                Interests
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.interests.map((interest, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1.5 bg-black/40 border border-gray-700 rounded-full text-xs font-bold text-gray-300"
                                    >
                                        #{interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-800">
                        <button
                            onClick={() => onReject(notificationId)}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-800 text-gray-300 rounded-2xl font-bold text-base hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <XCircle className="w-5 h-5" />
                            Pass
                        </button>
                        <button
                            onClick={() => onLikeBack(notificationId, profile.id)}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-neon to-pink-600 text-white rounded-2xl font-bold text-base shadow-[0_0_20px_rgba(255,0,127,0.3)] hover:shadow-[0_0_30px_rgba(255,0,127,0.5)] hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Heart className="w-5 h-5 fill-current" />
                            Like Back
                        </button>
                    </div>
                </div>
            </div>

            {/* CSS for animations */}
            <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
        </div>
    );
};
