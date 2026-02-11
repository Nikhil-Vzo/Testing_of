import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase'; // Changed: Import Supabase
import { UserProfile } from '../types';
import { NeonButton, NeonInput } from '../components/Common';
import {
    Edit2, Camera, X, Ghost, User, GraduationCap, CheckCircle2,
    LogOut, ChevronDown, Settings, Lock, ShieldBan,
    MessageCircle, Mail, Phone, Loader2, Heart, Search
} from 'lucide-react';
import { AVATAR_PRESETS, LOOKING_FOR_OPTIONS, YEAR_OPTIONS } from '../constants';

export const Profile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser, updateProfile, logout } = useAuth();

    // State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
    const [showVerification, setShowVerification] = useState(false);
    const [verifyStep, setVerifyStep] = useState(1);
    const [verifyData, setVerifyData] = useState({ college: '', email: '', file: null as File | null });

    // New State for fetching external profiles
    const [fetchedProfile, setFetchedProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Determine if viewing self
    const isSelf = !id || id === currentUser?.id;

    // Resolve which profile to show
    const profileUser = isSelf ? currentUser : fetchedProfile;

    // Fetch Profile Data (if not self)
    useEffect(() => {
        if (isSelf || !id || !supabase) return;

        const fetchProfile = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                if (data) {
                    // Map DB snake_case to Client camelCase
                    const mapped: UserProfile = {
                        id: data.id,
                        anonymousId: data.anonymous_id,
                        realName: data.real_name,
                        gender: data.gender,
                        university: data.university,
                        universityEmail: data.university_email,
                        branch: data.branch,
                        year: data.year,
                        interests: data.interests || [],
                        bio: data.bio,
                        dob: data.dob,
                        isVerified: data.is_verified,
                        avatar: data.avatar,
                        isPremium: data.is_premium,
                        lookingFor: data.looking_for || []
                    };
                    setFetchedProfile(mapped);
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id, isSelf]);

    // Loading State
    if (loading) return (
        <div className="h-full flex items-center justify-center bg-black text-white">
            <Loader2 className="w-10 h-10 text-neon animate-spin" />
        </div>
    );

    if (!profileUser) return (
        <div className="h-full flex flex-col items-center justify-center bg-black text-white">
            <Ghost className="w-12 h-12 text-gray-700 mb-4" />
            <p className="text-gray-500">User not found.</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-neon hover:underline">Go Back</button>
        </div>
    );

    // Handlers
    const startEdit = () => {
        if (currentUser) {
            setEditForm({ ...currentUser });
            setIsEditing(true);
        }
    };

    const saveProfile = async () => {
        if (!editForm || !currentUser || !supabase) return;
        setSaving(true);

        try {
            // 1. Prepare DB Payload (snake_case)
            const updates = {
                real_name: editForm.realName,
                branch: editForm.branch,
                year: editForm.year,
                bio: editForm.bio,
                dob: editForm.dob,
                avatar: editForm.avatar,

                interests: editForm.interests,
                looking_for: editForm.lookingFor,
                updated_at: new Date().toISOString()
            };

            // 2. Update Supabase
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', currentUser.id);

            if (error) throw error;

            // 3. Update Local Context
            updateProfile(editForm);
            setIsEditing(false);

        } catch (err) {
            console.error('Failed to update profile:', err);
            alert('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // In production, we should upload to Supabase Storage and get a URL.
                // For now, base64 string works for small images but isn't scalable.
                setEditForm(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar bg-[#000000] text-white relative">

            {/* --- Cinematic Background --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-black via-[#000000] to-[#000000]" />
                <div className="absolute top-[-20%] right-[10%] w-[800px] h-[800px] bg-neon/5 blur-[120px] rounded-full animate-pulse-slow" />
                <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-5xl mx-auto p-4 md:p-8 pb-32">

                {/* Mobile Nav */}
                <div className="flex md:hidden justify-between items-center mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 bg-gray-900/80 backdrop-blur rounded-full text-white border border-gray-800">
                        <ChevronDown className="w-5 h-5 rotate-90" />
                    </button>
                    <span className="font-bold text-sm tracking-widest uppercase text-gray-400">{isSelf ? 'My Profile' : 'Student Profile'}</span>
                    <div className="w-9" />
                </div>

                {/* --- Main Content --- */}
                <div className="space-y-6 md:space-y-8">

                    {/* 1. HERO SECTION (Identity) */}
                    <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden group">

                        {/* Desktop: Glow behind avatar */}
                        <div className="hidden md:block absolute top-0 left-0 w-full h-full bg-gradient-to-r from-neon/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 relative z-10">

                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-[#0a0a0a] shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden bg-gray-800 relative group/avatar">
                                    <img
                                        src={isEditing ? (editForm.avatar || profileUser.avatar) : profileUser.avatar}
                                        alt="Avatar"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-105"
                                    />
                                    {isEditing && (
                                        <label className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                            <Camera className="w-10 h-10 text-white" />
                                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                                        </label>
                                    )}
                                </div>
                                {profileUser.isVerified && (
                                    <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-blue-500 text-white p-1.5 md:p-2 rounded-full border-4 border-[#0a0a0a] shadow-lg animate-bounce-in" title="Verified Student">
                                        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                )}
                            </div>

                            {/* Info & Actions */}
                            <div className="flex-1 text-center md:text-left w-full">
                                <div className="mb-4 md:mb-6">
                                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
                                        {/* Show Real Name if Self or Revealed (Matches usually revealed). For now we assume matches are revealed in chat context, but here let's stick to strict privacy unless isSelf */}
                                        {isSelf ? profileUser.realName : profileUser.anonymousId}
                                    </h1>
                                    <div className="flex flex-col md:flex-row items-center gap-3 text-gray-400 font-medium">
                                        <div className="flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5 text-neon" />
                                            <span className="text-base md:text-lg">{profileUser.university}</span>
                                        </div>
                                        <span className="hidden md:inline text-gray-700">•</span>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-gray-800 px-3 py-1 rounded-full text-xs md:text-sm border border-gray-700 text-gray-300">
                                                {profileUser.year}
                                            </span>
                                            <span className="bg-gray-800 px-3 py-1 rounded-full text-xs md:text-sm border border-gray-700 text-gray-300">
                                                {profileUser.branch}
                                            </span>
                                            {profileUser.dob && (
                                                <span className="bg-gray-800 px-3 py-1 rounded-full text-xs md:text-sm border border-gray-700 text-gray-300">
                                                    {new Date(profileUser.dob).getFullYear()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                {isSelf ? (
                                    !isEditing && (
                                        <div className="flex flex-col md:flex-row gap-3 justify-center md:justify-start">
                                            <button
                                                onClick={startEdit}
                                                className="px-8 py-3 rounded-xl bg-white text-black hover:bg-neon hover:text-white transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,0,127,0.4)]"
                                            >
                                                <Edit2 className="w-4 h-4" /> Edit Profile
                                            </button>
                                            {!currentUser?.isVerified && (
                                                <button
                                                    onClick={() => setShowVerification(true)}
                                                    className="px-8 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 hover:border-blue-500/50 hover:text-blue-400 transition-all font-bold text-sm flex items-center justify-center gap-2"
                                                >
                                                    <ShieldBan className="w-4 h-4" /> Get Verified
                                                </button>
                                            )}
                                        </div>
                                    )
                                ) : (
                                    <div className="flex gap-4 justify-center md:justify-start">
                                        <button onClick={() => navigate(`/chat/${profileUser.id}`)} className="px-8 py-3 rounded-xl bg-neon text-white shadow-[0_0_20px_rgba(255,0,127,0.4)] hover:bg-neon/90 hover:scale-105 transition-all font-bold text-sm flex items-center gap-2">
                                            <MessageCircle className="w-5 h-5" /> Message
                                        </button>
                                        <button className="px-6 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 transition-all font-bold text-sm">
                                            <Phone className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2. DETAILS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

                        {/* Left Col: Bio & Interests (Takes up 2/3 on Desktop) */}
                        <div className="md:col-span-2 space-y-6">
                            {isEditing ? (
                                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-[2rem] p-6 md:p-8 animate-fade-in shadow-xl">
                                    <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Settings className="w-5 h-5 text-neon" /> Edit Details
                                        </h3>
                                        <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Quick Avatars */}
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase font-bold block mb-3">Quick Avatars</label>
                                            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                                {AVATAR_PRESETS.slice(0, 6).map((avatar, i) => (
                                                    <button key={i} onClick={() => setEditForm({ ...editForm, avatar })} className={`w-12 h-12 rounded-full border-2 flex-shrink-0 transition-all ${editForm.avatar === avatar ? 'border-neon scale-110' : 'border-gray-700 opacity-60 hover:opacity-100'}`}>
                                                        <img src={avatar} alt="" className="w-full h-full bg-gray-800" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Real Name</label>
                                                <NeonInput value={editForm.realName || ''} onChange={e => setEditForm({ ...editForm, realName: e.target.value })} />
                                                <p className="text-[10px] text-gray-600 mt-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Private until match.</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Branch</label>
                                                <NeonInput value={editForm.branch || ''} onChange={e => setEditForm({ ...editForm, branch: e.target.value })} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Year</label>
                                                <div className="relative">
                                                    <select
                                                        className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl outline-none focus:border-neon appearance-none"
                                                        value={editForm.year || '1st Year'}
                                                        onChange={e => setEditForm({ ...editForm, year: e.target.value })}
                                                    >
                                                        {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Date of Birth</label>
                                                <NeonInput
                                                    type="date"
                                                    value={editForm.dob || ''}
                                                    onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Bio</label>
                                            <textarea
                                                className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl outline-none focus:border-neon h-32 resize-none transition-all focus:ring-1 focus:ring-neon/50"
                                                value={editForm.bio || ''}
                                                onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                                placeholder="Express yourself..."
                                            />
                                        </div>

                                        {/* Edit Looking For */}
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Looking For</label>
                                            <div className="flex flex-wrap gap-2">
                                                {LOOKING_FOR_OPTIONS.map(option => (
                                                    <button
                                                        key={option}
                                                        onClick={() => {
                                                            const current = editForm.lookingFor || [];
                                                            const updated = current.includes(option)
                                                                ? current.filter(i => i !== option)
                                                                : [...current, option];
                                                            setEditForm({ ...editForm, lookingFor: updated });
                                                        }}
                                                        className={`px-3 py-1 rounded-full text-xs border transition-all ${(editForm.lookingFor || []).includes(option)
                                                            ? 'bg-pink-500 border-pink-500 text-white shadow-lg'
                                                            : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'
                                                            }`}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4 border-t border-gray-800">
                                            <NeonButton onClick={saveProfile} className="flex-1" disabled={saving}>
                                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                                            </NeonButton>
                                            <button onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-all font-bold">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Bio Card */}
                                    <div className="bg-gray-900/40 border border-gray-800 rounded-[2rem] p-8 backdrop-blur-md relative overflow-hidden h-50">
                                        <Ghost className="absolute top-6 right-6 w-32 h-32 text-gray-800/50 rotate-12 pointer-events-none" />
                                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                            <User className="w-5 h-5 text-neon" /> About Me
                                        </h3>
                                        <p className="text-gray-300 leading-relaxed text-lg font-light italic relative z-10">
                                            "{profileUser.bio || "This user is keeping it mysterious."}"
                                        </p>
                                    </div>

                                    {/* Interests */}
                                    <div className="bg-gray-900/40 border border-gray-800 rounded-[2rem] p-8 backdrop-blur-md">
                                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                            <Heart className="w-5 h-5 text-neon" /> Interests & Passions
                                        </h3>
                                        <div className="flex flex-wrap gap-3">
                                            {profileUser.interests?.map(tag => (
                                                <span key={tag} className="px-5 py-2 bg-black/40 border border-gray-700 rounded-2xl text-sm font-bold text-gray-300 hover:border-neon/50 hover:text-neon transition-colors cursor-default">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Looking For */}
                                    <div className="bg-gray-900/40 border border-gray-800 rounded-[2rem] p-8 backdrop-blur-md mt-6">
                                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                            <Search className="w-5 h-5 text-pink-500" /> Looking For
                                        </h3>
                                        <div className="flex flex-wrap gap-3">
                                            {(profileUser.lookingFor && profileUser.lookingFor.length > 0) ? profileUser.lookingFor.map(tag => (
                                                <span key={tag} className="px-5 py-2 bg-pink-500/10 border border-pink-500/30 rounded-2xl text-sm font-bold text-pink-200 cursor-default">
                                                    {tag}
                                                </span>
                                            )) : (
                                                <span className="text-gray-500 italic">Not specified</span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Right Col: Stats & Support (Takes up 1/3 on Desktop) */}
                        <div className="space-y-6">
                            {/* Stats */}
                            <div className="bg-gray-900/40 border border-gray-800 rounded-[2rem] p-6 backdrop-blur-md">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Profile Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 rounded-xl bg-black/20">
                                        <span className="text-gray-400 text-sm">Status</span>
                                        <span className="text-green-500 font-bold text-sm flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Online</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-xl bg-black/20">
                                        <span className="text-gray-400 text-sm">Match Rate</span>
                                        <span className="text-neon font-bold text-sm">High</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-xl bg-black/20">
                                        <span className="text-gray-400 text-sm">Joined</span>
                                        <span className="text-white font-bold text-sm">Sep 2025</span>
                                    </div>
                                </div>
                            </div>

                            {/* Support & Contact (Self Only) */}
                            {isSelf && !isEditing && (
                                <div className="bg-gray-900/40 border border-gray-800 rounded-[2rem] p-6 backdrop-blur-md space-y-3">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Account</h3>

                                    <button
                                        onClick={() => navigate('/contact')}
                                        className="w-full p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:bg-gray-800 hover:border-gray-500 group text-left transition-all flex items-center gap-3"
                                    >
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:text-white transition-colors">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-200 group-hover:text-white text-sm block">Contact Support</span>
                                            <span className="text-xs text-gray-500">Need help? Let us know.</span>
                                        </div>
                                    </button>

                                    <button
                                        onClick={logout}
                                        className="w-full p-4 rounded-xl bg-red-900/10 border border-red-900/30 hover:bg-red-900/20 hover:border-red-500/50 group text-left transition-all flex items-center gap-3"
                                    >
                                        <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                                            <LogOut className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold text-gray-300 group-hover:text-red-400 text-sm">Log Out</span>
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* --- Verification Modal --- */}
                {showVerification && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                        <div className="bg-gray-900 w-full max-w-md p-8 rounded-[2rem] border border-gray-800 shadow-2xl relative">
                            <button onClick={() => setShowVerification(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>

                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700 shadow-neon-sm">
                                    <ShieldBan className="w-10 h-10 text-neon" />
                                </div>
                                <h2 className="text-2xl font-black text-white">Student Verification</h2>
                                <p className="text-sm text-gray-400 mt-2">Unlock the blue tick & exclusive features.</p>
                            </div>

                            {verifyStep === 1 ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">College Email (.edu)</label>
                                        <NeonInput placeholder="student@university.edu" value={verifyData.email} onChange={e => setVerifyData({ ...verifyData, email: e.target.value })} />
                                    </div>
                                    <NeonButton onClick={() => setVerifyStep(2)} className="w-full py-4 text-base">Send Verification</NeonButton>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30 animate-pulse">
                                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                                    </div>
                                    <p className="text-white font-bold text-xl mb-2">Request Sent!</p>
                                    <p className="text-sm text-gray-400 mb-8 px-4 leading-relaxed">Our team is reviewing your details. You will receive an email within 24 hours.</p>
                                    <NeonButton onClick={() => setShowVerification(false)} className="w-full py-4 text-base">Done</NeonButton>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};