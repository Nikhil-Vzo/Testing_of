import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, AlertTriangle } from 'lucide-react';

export const Contact: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as { reportUserId?: string; reportUserName?: string } | null;

    const [subject, setSubject] = useState(state?.reportUserId ? 'Report User' : '');
    const [message, setMessage] = useState(
        state?.reportUserId
            ? `I want to report user: ${state.reportUserName}\n\nReason: `
            : ''
    );
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // For now, just show success message
        // In production, you'd send this to your backend/email service
        console.log('Contact form submitted:', { email, subject, message });
        setSubmitted(true);

        setTimeout(() => {
            navigate(-1); // Go back after 2 seconds
        }, 2000);
    };

    if (submitted) {
        return (
            <div className="h-full w-full bg-transparent flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Message Sent!</h2>
                    <p className="text-gray-400 text-sm">We'll get back to you soon.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-black text-white font-sans flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 bg-black/95 backdrop-blur-md border-b border-gray-800 flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-bold text-white">Contact Support</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto">
                    {state?.reportUserId && (
                        <div className="bg-red-900/10 border border-red-800/30 rounded-xl p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-bold text-red-400 mb-1">Reporting User</h3>
                                    <p className="text-xs text-gray-400">
                                        Please provide details about why you're reporting this user. Our team will review your report.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Your Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@example.com"
                                required
                                className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-neon/50 focus:ring-1 focus:ring-neon/20 transition-all placeholder:text-gray-600"
                            />
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Subject
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="What can we help with?"
                                required
                                className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-neon/50 focus:ring-1 focus:ring-neon/20 transition-all placeholder:text-gray-600"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Message
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tell us more..."
                                required
                                rows={8}
                                className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-neon/50 focus:ring-1 focus:ring-neon/20 transition-all placeholder:text-gray-600 resize-none"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full bg-neon hover:bg-neon/90 text-white font-medium py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,0,127,0.3)]"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Send Message
                            </div>
                        </button>
                    </form>

                    {/* Info */}
                    <div className="mt-8 p-4 bg-gray-900/40 border border-gray-800/50 rounded-xl">
                        <p className="text-xs text-gray-500 text-center">
                            We typically respond within 24-48 hours. For urgent matters, please include "URGENT" in the subject line.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
