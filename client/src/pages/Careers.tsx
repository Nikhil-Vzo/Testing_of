import React, { useState } from 'react';
import { ArrowLeft, Briefcase, ChevronRight, Send, User, Phone, Mail, GraduationCap, X, CheckCircle2, Code2, Palette, Megaphone, Video, Instagram, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface JobPosition {
    id: string;
    title: string;
    icon: React.ElementType;
    description: string;
}

const POSITIONS: JobPosition[] = [
    { id: 'pitch', title: 'Pitch Yourself', icon: Send, description: 'Don\'t see your role? Tell us how you can contribute.' },
    { id: 'developer', title: 'Developer', icon: Code2, description: 'Build the future of campus dating. React, Node, Supabase.' },
    { id: 'marketing', title: 'Marketing & Promotions', icon: Megaphone, description: 'Spread the word and grow the community on campus.' },
    { id: 'ui_ux', title: 'UI/UX Designer', icon: Palette, description: 'Craft beautiful, intuitive experiences for students.' },
    { id: 'video_editor', title: 'Video Editor', icon: Video, description: 'Create engaging content for Reels and TikTok.' },
    { id: 'instagram_manager', title: 'Instagram Manager', icon: Instagram, description: 'Curate our aesthetic, manage stories, and engage with followers.' },
    { id: 'social_media', title: 'Social Media Manager', icon: Share2, description: 'Drive growth strategy across LinkedIn, X, and other platforms.' },
];

export const Careers: React.FC = () => {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState<JobPosition | null>(null);
    const [formData, setFormData] = useState({ fullName: '', phone: '', email: '', college: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRole) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('career_inquiries').insert({
                role: selectedRole.title,
                full_name: formData.fullName,
                phone: formData.phone,
                email: formData.email,
                college: formData.college
            });

            if (error) throw error;

            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setSelectedRole(null);
                setFormData({ fullName: '', phone: '', email: '', college: '' });
            }, 3000);
        } catch (err) {
            console.error('Application error:', err);
            alert('Failed to submit application. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-black text-white font-sans flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-900 bg-black/50 backdrop-blur-md sticky top-0 z-20 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                        Join the Team <Briefcase className="w-5 h-5 text-neon" />
                    </h1>
                    <p className="text-xs text-gray-500 font-mono">Build the next big thing.</p>
                </div>
            </div>

            <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
                <div className="text-center mb-12 space-y-4">
                    <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tighter">
                        WE ARE <span className="text-neon">HIRING</span>
                    </h2>
                    <p className="text-gray-400 max-w-lg mx-auto">
                        Ready to make an impact? Join a team of passionate students and creators building the future of campus connection.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {POSITIONS.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role)}
                            className="group relative bg-gray-900/30 border border-gray-800 hover:border-neon/50 rounded-2xl p-6 text-left transition-all duration-300 hover:bg-gray-900/60 hover:shadow-[0_0_20px_rgba(255,0,127,0.1)]"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-gray-800/50 rounded-xl group-hover:bg-neon/10 group-hover:text-neon transition-colors">
                                    <role.icon className="w-6 h-6" />
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-neon transform group-hover:translate-x-1 transition-all" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-neon transition-colors">{role.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{role.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Application Modal */}
            {selectedRole && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-black border border-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/20">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Apply For</p>
                                <h3 className="text-xl font-black text-white flex items-center gap-2">
                                    {selectedRole.title}
                                    <selectedRole.icon className="w-5 h-5 text-neon" />
                                </h3>
                            </div>
                            <button
                                onClick={() => !isSubmitting && setSelectedRole(null)}
                                className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            {isSuccess ? (
                                <div className="py-12 flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
                                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Application Sent!</h3>
                                    <p className="text-gray-400">We'll be in touch soon. Good luck! 🚀</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                required
                                                value={formData.fullName}
                                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-neon focus:ring-1 focus:ring-neon outline-none transition-all placeholder:text-gray-600"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Phone</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input
                                                    required
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full bg-gray-900/50 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-neon focus:ring-1 focus:ring-neon outline-none transition-all placeholder:text-gray-600"
                                                    placeholder="+91 98765..."
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">College</label>
                                            <div className="relative">
                                                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input
                                                    required
                                                    value={formData.college}
                                                    onChange={e => setFormData({ ...formData, college: e.target.value })}
                                                    className="w-full bg-gray-900/50 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-neon focus:ring-1 focus:ring-neon outline-none transition-all placeholder:text-gray-600"
                                                    placeholder="University Name"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-neon focus:ring-1 focus:ring-neon outline-none transition-all placeholder:text-gray-600"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-neon text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255,0,127,0.3)] hover:shadow-[0_0_30px_rgba(255,0,127,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Sending...' : 'Submit Application'}
                                        {!isSubmitting && <Send className="w-4 h-4" />}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
