import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { NeonInput, NeonButton } from '../components/Common';
import { Ghost, Upload, Lock, ChevronDown, Loader2, AlertCircle, CheckCircle2, X, Calendar } from 'lucide-react';
import { AVATAR_PRESETS, MOCK_INTERESTS, CHHATTISGARH_COLLEGES } from '../constants';
import { authService } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Generate arrays for DOB dropdowns
const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - 18 - i).toString());

export const Onboarding: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Loading state to prevent flash of form while checking for existing profile
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // State to hold the verified email
  const [email, setEmail] = useState<string>(location.state?.email || '');

  // DOB as separate fields for cool UI
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  const [tempProfile, setTempProfile] = useState<Partial<UserProfile>>({
    interests: [],
    gender: 'Male',
    university: CHHATTISGARH_COLLEGES[0],
    avatar: AVATAR_PRESETS[0],
    dob: '',
    realName: '',
    bio: '',
    branch: '',
    year: 'Freshman'
  });

  // --- NEW: Check for existing profile & Auto-fill from Google ---
  useEffect(() => {
    const fetchUserAndCheckProfile = async () => {
      if (!supabase) {
        setIsCheckingProfile(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 1. Check if user already has a profile in the database
        const { data: existingProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (existingProfile && !error) {
          // Profile exists! Skip onboarding and redirect to home
          const appUser: UserProfile = {
            id: existingProfile.id,
            anonymousId: existingProfile.anonymous_id,
            realName: existingProfile.real_name,
            gender: existingProfile.gender,
            university: existingProfile.university,
            universityEmail: existingProfile.university_email,
            branch: existingProfile.branch,
            year: existingProfile.year,
            interests: existingProfile.interests || [],
            bio: existingProfile.bio,
            dob: existingProfile.dob,
            isVerified: existingProfile.is_verified,
            avatar: existingProfile.avatar,
            isPremium: existingProfile.is_premium
          };

          // Log them in and redirect to home
          await login(appUser);
          navigate('/home');
          return; // Exit early, no need to show onboarding
        }

        // 2. No existing profile - Set Email for new user
        if (user.email) setEmail(user.email);

        // 3. Auto-fill from Google Metadata (Name & Picture)
        const googleName = user.user_metadata?.full_name || user.user_metadata?.name;
        const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;

        setTempProfile(prev => ({
          ...prev,
          // Only overwrite if currently empty
          realName: prev.realName ? prev.realName : (googleName || ''),
          avatar: (prev.avatar === AVATAR_PRESETS[0] && googleAvatar) ? googleAvatar : prev.avatar
        }));
      }

      // Done checking, show the form
      setIsCheckingProfile(false);
    };

    fetchUserAndCheckProfile();
  }, [login, navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await authService.uploadAvatar(file);
      setTempProfile(prev => ({ ...prev, avatar: base64 }));
    }
  };

  const toggleInterest = (interest: string) => {
    setTempProfile(prev => {
      const current = prev.interests || [];
      if (current.includes(interest)) return { ...prev, interests: current.filter(i => i !== interest) };
      if (current.length >= 5) return prev;
      return { ...prev, interests: [...current, interest] };
    });
  };

  const handleCreateProfile = async () => {
    setError(null);

    // Validation
    if (!email) {
      setError("Email is required. Please login again.");
      return;
    }
    if (!tempProfile.realName?.trim()) {
      setError("Please enter your real name.");
      return;
    }
    if (!dobDay || !dobMonth || !dobYear) {
      setError("Please select your complete date of birth.");
      return;
    }
    if ((tempProfile.interests || []).length === 0) {
      setError("Please select at least one interest.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the real authenticated user ID from Supabase
      if (!supabase) {
        setError("Authentication service not available.");
        setIsSubmitting(false);
        return;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        setError("Authentication failed. Please login again.");
        setIsSubmitting(false);
        return;
      }

      // Compose DOB from separate fields (YYYY-MM-DD format)
      const monthIndex = MONTHS.indexOf(dobMonth) + 1;
      const formattedDob = `${dobYear}-${monthIndex.toString().padStart(2, '0')}-${dobDay}`;

      const newUser: UserProfile = {
        id: authUser.id, // Use REAL Supabase Auth UUID
        anonymousId: `User#${Math.floor(Math.random() * 10000).toString(16).toUpperCase()}`,
        realName: tempProfile.realName.trim(),
        gender: tempProfile.gender || 'Male',
        university: tempProfile.university || CHHATTISGARH_COLLEGES[0],
        universityEmail: email,
        isVerified: false,
        branch: tempProfile.branch || 'General',
        year: tempProfile.year || 'Freshman',
        interests: tempProfile.interests || [],
        bio: tempProfile.bio || '',
        avatar: tempProfile.avatar || AVATAR_PRESETS[0],
        dob: formattedDob
      };

      // CRITICAL: Await login to ensure profile is saved to database before navigation
      await login(newUser);

      setSuccess("Profile created! Redirecting...");

      // Small delay for user to see success message
      setTimeout(() => {
        navigate('/home');
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to create profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Show loading while checking for existing profile
  if (isCheckingProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-neon animate-spin" />
          <p className="text-gray-400 text-sm">Checking your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-800 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
        <div className="space-y-6 animate-fade-in">
          <h2 className="text-xl font-bold text-white text-center">Create Your Persona</h2>

          {/* Toast Messages */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-300 flex-1">{success}</p>
            </div>
          )}

          {/* Avatar Selection */}
          <div className="flex flex-col items-center mb-6">
            <label className="block text-sm text-gray-400 mb-3">Choose Avatar or Upload Photo</label>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-neon overflow-hidden relative group">
                {tempProfile.avatar ? (
                  <img src={tempProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Ghost className="w-12 h-12 text-gray-600 m-auto mt-5" />
                )}
                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto max-w-full pb-2 custom-scrollbar">
              {AVATAR_PRESETS.map((avatar, i) => (
                <button
                  key={i}
                  onClick={() => setTempProfile({ ...tempProfile, avatar })}
                  className={`w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0 ${tempProfile.avatar === avatar ? 'border-neon scale-110' : 'border-gray-700 opacity-50 hover:opacity-100'}`}
                >
                  <img src={avatar} alt={`Preset ${i}`} className="w-full h-full bg-gray-800" />
                </button>
              ))}
            </div>
          </div>

          {/* University Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">College / University</label>
            <div className="relative">
              <select
                className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon appearance-none h-[52px] pr-10"
                value={tempProfile.university}
                onChange={e => setTempProfile({ ...tempProfile, university: e.target.value })}
              >
                {CHHATTISGARH_COLLEGES.map(college => (
                  <option key={college} value={college}>{college}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
            </div>
            <p className="text-[10px] text-yellow-500/80 mt-2 flex items-start gap-1">
              <span className="mt-0.5">⚠️</span>
              <span>Note: You cannot change your college once selected. To change it later, you will need to verify your ID card.</span>
            </p>
          </div>

          {/* Personal Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Real Name</label>
              <NeonInput
                value={tempProfile.realName || ''}
                onChange={e => setTempProfile({ ...tempProfile, realName: e.target.value })}
                placeholder="Jane Doe"
              />
              <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Hidden until match</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Gender</label>
              <div className="relative">
                <select
                  className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon appearance-none h-[52px] pr-10"
                  value={tempProfile.gender}
                  onChange={e => setTempProfile({ ...tempProfile, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Branch / Major</label>
              <NeonInput
                value={tempProfile.branch || ''}
                onChange={e => setTempProfile({ ...tempProfile, branch: e.target.value })}
                placeholder="e.g., CS"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Year</label>
              <div className="relative">
                <select
                  className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon appearance-none h-[52px] pr-10"
                  value={tempProfile.year}
                  onChange={e => setTempProfile({ ...tempProfile, year: e.target.value })}
                >
                  <option>Freshman</option>
                  <option>Sophomore</option>
                  <option>Junior</option>
                  <option>Senior</option>
                  <option>Grad</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Date of Birth
              </label>
              <div className="flex gap-2">
                {/* Day */}
                <div className="relative flex-1">
                  <select
                    className="w-full bg-gray-900 border-2 border-gray-800 text-white px-3 py-3 rounded-xl outline-none focus:border-neon appearance-none h-[52px] pr-8 text-center"
                    value={dobDay}
                    onChange={e => setDobDay(e.target.value)}
                  >
                    <option value="">Day</option>
                    {DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
                </div>

                {/* Month */}
                <div className="relative flex-[1.5]">
                  <select
                    className="w-full bg-gray-900 border-2 border-gray-800 text-white px-3 py-3 rounded-xl outline-none focus:border-neon appearance-none h-[52px] pr-8 text-center"
                    value={dobMonth}
                    onChange={e => setDobMonth(e.target.value)}
                  >
                    <option value="">Month</option>
                    {MONTHS.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
                </div>

                {/* Year */}
                <div className="relative flex-1">
                  <select
                    className="w-full bg-gray-900 border-2 border-gray-800 text-white px-3 py-3 rounded-xl outline-none focus:border-neon appearance-none h-[52px] pr-8 text-center"
                    value={dobYear}
                    onChange={e => setDobYear(e.target.value)}
                  >
                    <option value="">Year</option>
                    {YEARS.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Must be 18+ to use this app</p>
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Interests (Max 5)</label>
            <div className="flex flex-wrap gap-2">
              {MOCK_INTERESTS.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${(tempProfile.interests || []).includes(interest)
                    ? 'bg-neon border-neon text-white shadow-neon-sm'
                    : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Anonymous Bio</label>
            <textarea
              className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon h-24 resize-none"
              placeholder="Describe yourself without revealing your name..."
              value={tempProfile.bio || ''}
              onChange={e => setTempProfile({ ...tempProfile, bio: e.target.value })}
            />
          </div>

          <NeonButton
            className="w-full flex items-center justify-center gap-2"
            onClick={handleCreateProfile}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Profile...
              </>
            ) : (
              'Enter The Void'
            )}
          </NeonButton>
        </div>
      </div>
    </div>
  );
};