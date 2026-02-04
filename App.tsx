
import React, { useState, useEffect } from 'react';
import { UserProfile, MatchProfile, AppView, CallType, ChatSession, Message, Notification } from './types';
import { MOCK_MATCHES, MOCK_INTERESTS, MOCK_NOTIFICATIONS, APP_NAME, AVATAR_PRESETS } from './constants';
import { NeonButton, NeonInput, Badge } from './components/Common';
import { VideoCall } from './components/VideoCall';
import { LandingPage } from './components/LandingPage';
import { authService } from './services/auth';
import { checkCompatibility, generateIceBreaker } from './services/geminiService';
import { Heart, X, MessageCircle, User, LogOut, Ghost, Zap, Send, Video, Phone, AlertTriangle, Search, Bell, CheckCircle2, RotateCcw, Menu, Lock, Camera, Upload, Image as ImageIcon, Edit2, Save, ShieldBan, Drill, CalendarHeart, Film, Music, Gamepad2, Layers, Stars, ArrowRight, Sparkles } from 'lucide-react';

export default function App() {
  // -- State --
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Login Form State
  const [email, setEmail] = useState('');
  const [authStep, setAuthStep] = useState<'email' | 'verify' | 'profile'>('email');

  // Onboarding State
  const [tempProfile, setTempProfile] = useState<Partial<UserProfile>>({
    interests: [],
    gender: 'Male', // Default
    avatar: AVATAR_PRESETS[0]
  });

  // Profile Editing State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  // Verification State
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'step-1' | 'step-2' | 'success'>('step-1');
  const [verificationCollege, setVerificationCollege] = useState('');
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [verificationEmail, setVerificationEmail] = useState('');

  // Matching State
  const [matchQueue, setMatchQueue] = useState<MatchProfile[]>([]);
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Chat State
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<Record<string, ChatSession>>({});
  const [messageInput, setMessageInput] = useState('');

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  // Call State
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<CallType>(CallType.VIDEO);

  // -- Effects --
  useEffect(() => {
    // Check for existing session
    const savedUser = authService.getCurrentUser();
    if (savedUser) {
      // FORCE UNVERIFIED for testing ensuring everyone starts without a badge
      if (savedUser.isVerified) {
        savedUser.isVerified = false;
        authService.login(savedUser);
      }
      setCurrentUser(savedUser);
      setView(AppView.HOME);
      loadMatchesForUser(savedUser);
    } else {
      setView(AppView.LANDING);
      // Load generic matches for background or initial state if needed, but strictly we wait for login
      setMatchQueue(MOCK_MATCHES);
    }
  }, []);

  // -- Helper to filter matches based on gender --
  const loadMatchesForUser = (user: UserProfile) => {
    const targetGender = user.gender === 'Male' ? 'Female' : 'Male';
    // Filter matches: Must match target gender AND not be the user themselves
    const filtered = MOCK_MATCHES.filter(m => m.gender === targetGender && m.id !== user.id);
    setMatchQueue(filtered);
  };

  // -- Handlers --

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setAuthStep('email');
    setIsEditingProfile(false);
    setView(AppView.LANDING);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.endsWith('.edu')) {
      setAuthStep('verify');
    } else {
      alert('Please use a valid university (.edu) email.');
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthStep('profile');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await authService.uploadAvatar(file);
      if (isEditing) {
        setEditForm(prev => ({ ...prev, avatar: base64 }));
      } else {
        setTempProfile(prev => ({ ...prev, avatar: base64 }));
      }
    }
  };

  const handleCreateProfile = () => {
    const newUser: UserProfile = {
      id: 'u1',
      anonymousId: `User#${Math.floor(Math.random() * 10000).toString(16).toUpperCase()}`,
      realName: tempProfile.realName || 'Anonymous Student',
      gender: tempProfile.gender || 'Male',
      universityEmail: email,
      isVerified: false,
      branch: tempProfile.branch || 'General',
      year: tempProfile.year || 'Freshman',
      interests: tempProfile.interests || [],
      bio: tempProfile.bio || '',
      avatar: tempProfile.avatar || AVATAR_PRESETS[0]
    };

    setCurrentUser(newUser);
    authService.login(newUser); // Persist user
    loadMatchesForUser(newUser); // Load compatible matches
    setView(AppView.HOME);
  };

  const handleSaveProfile = () => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...editForm } as UserProfile;
    setCurrentUser(updatedUser);
    authService.login(updatedUser); // Update persistence
    setIsEditingProfile(false);
  };

  const startEditing = () => {
    if (!currentUser) return;
    setEditForm(currentUser);
    setIsEditingProfile(true);
  };

  const toggleInterest = (interest: string, isEditing: boolean = false) => {
    const setter = isEditing ? setEditForm : setTempProfile;

    setter(prev => {
      const current = prev.interests || [];
      if (current.includes(interest)) return { ...prev, interests: current.filter(i => i !== interest) };
      if (current.length >= 5) return prev;
      return { ...prev, interests: [...current, interest] };
    });
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    setSwipeDirection(direction);
    setTimeout(() => {
      if (direction === 'right') {
        const matchedUser = matchQueue[currentSwipeIndex];

        // Prevent duplicates in match list
        if (!matches.find(m => m.id === matchedUser.id)) {
          setMatches(prev => [...prev, matchedUser]);

          // Initialize chat session
          const newSession: ChatSession = {
            matchId: matchedUser.id,
            userA: currentUser!.id,
            userB: matchedUser.id,
            messages: [],
            lastUpdated: Date.now(),
            isRevealed: false
          };
          setChatSessions(prev => ({ ...prev, [matchedUser.id]: newSession }));

          // Add notification
          const newNotif: Notification = {
            id: Date.now().toString(),
            title: "It's a Match!",
            message: `You matched with ${matchedUser.anonymousId}!`,
            timestamp: Date.now(),
            read: false,
            type: 'match'
          };
          setNotifications(prev => [newNotif, ...prev]);
        }
      }

      setSwipeDirection(null);
      setCurrentSwipeIndex(prev => prev + 1);
    }, 300);
  };

  const resetStack = () => {
    setCurrentSwipeIndex(0);
    setSwipeDirection(null);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeChatId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser!.id,
      text: messageInput,
      timestamp: Date.now()
    };

    setChatSessions(prev => ({
      ...prev,
      [activeChatId]: {
        ...prev[activeChatId],
        messages: [...prev[activeChatId].messages, newMessage],
        lastUpdated: Date.now()
      }
    }));
    setMessageInput('');
  };

  const handleIceBreaker = async (matchId: string) => {
    if (!currentUser) return;
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const suggestion = await generateIceBreaker(currentUser.interests, match);
    setMessageInput(suggestion);
  };

  const handleBlockUser = (matchId: string) => {
    if (!confirm("Are you sure you want to block this user? This action cannot be undone.")) return;

    // Remove from matches
    setMatches(prev => prev.filter(m => m.id !== matchId));

    // Clear chat session (optional, logic depends on backend really)
    setChatSessions(prev => {
      const newState = { ...prev };
      delete newState[matchId];
      return newState;
    });

    // Reset active chat and view
    setActiveChatId(null);
    setView(AppView.MATCHES);

    // Optional: Add a system notification or alert
    alert("User blocked successfully.");
  };

  const startCall = (type: CallType) => {
    setCallType(type);
    setIsCallActive(true);
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // -- Verification Handlers --

  const handleVerificationSubmit = () => {
    // In a real app, this would send data to backend
    setVerificationStep('success');
  };

  const closeVerificationModal = () => {
    setShowVerificationModal(false);
    setVerificationStep('step-1');
    setVerificationCollege('');
    setVerificationEmail('');
    setVerificationFile(null);
  };

  // -- Views --

  const renderLogin = () => (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black p-6 relative overflow-hidden pb-20">
      {/* Background decorative elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon opacity-10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600 opacity-10 blur-[150px] rounded-full animate-pulse" />

      <button
        onClick={() => setView(AppView.LANDING)}
        className="absolute top-6 left-6 text-gray-500 hover:text-white flex items-center gap-2 z-20"
      >
        <RotateCcw className="w-4 h-4" /> Back to Home
      </button>

      <div className="w-full max-w-2xl z-10 bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-800 shadow-2xl my-auto max-h-[85vh] overflow-y-auto custom-scrollbar">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-2 tracking-tighter flex flex-col items-center justify-center gap-2 uppercase">
            <span>Other</span>
            <span className="text-neon flex items-center gap-2">Half <Ghost className="w-10 h-10 text-neon animate-bounce" /></span>
          </h1>
          <p className="text-gray-400 mt-4">Anonymous. Exclusive. Secure.</p>
        </div>

        {authStep === 'email' && (
          <form onSubmit={handleLogin} className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">University Email</label>
              <NeonInput
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <NeonButton className="w-full">Verify Student Status</NeonButton>
          </form>
        )}

        {authStep === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-300">We sent a code to <span className="text-neon">{email}</span></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Verification Code</label>
              <NeonInput
                type="text"
                placeholder="123456"
                className="text-center tracking-[1em] font-mono text-xl"
                defaultValue="123456" // Auto-fill for demo
              />
            </div>
            <NeonButton className="w-full">Confirm Identity</NeonButton>
          </form>
        )}

        {authStep === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-white">Create Your Persona</h2>

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
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, false)} />
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
                <select
                  className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon h-[52px]"
                  value={tempProfile.gender}
                  onChange={e => setTempProfile({ ...tempProfile, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
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
                <select
                  className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon h-[52px]"
                  onChange={e => setTempProfile({ ...tempProfile, year: e.target.value })}
                >
                  <option>Freshman</option>
                  <option>Sophomore</option>
                  <option>Junior</option>
                  <option>Senior</option>
                  <option>Grad</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Interests (Max 5)</label>
              <div className="flex flex-wrap gap-2">
                {MOCK_INTERESTS.map(interest => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest, false)}
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

            <div>
              <label className="block text-sm text-gray-400 mb-1">Anonymous Bio</label>
              <textarea
                className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon h-24 resize-none"
                placeholder="Describe yourself without revealing your name..."
                onChange={e => setTempProfile({ ...tempProfile, bio: e.target.value })}
              />
            </div>

            <NeonButton className="w-full" onClick={handleCreateProfile}>Enter The Void</NeonButton>
          </div>
        )}
      </div>
    </div>
  );

  const renderHome = () => {
    if (matchQueue.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in pb-24 md:pb-8">
          <div className="w-32 h-32 bg-gray-900 rounded-full flex items-center justify-center mb-6 border border-gray-800 shadow-neon-sm">
            <Search className="w-12 h-12 text-neon" />
          </div>
          <h2 className="text-3xl font-bold mb-2 text-white">No Matches Found</h2>
          <p className="text-gray-500 mb-8 max-w-md">There are no profiles matching your criteria right now.</p>
        </div>
      );
    }

    if (currentSwipeIndex >= matchQueue.length) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in pb-24 md:pb-8">
          <div className="w-32 h-32 bg-gray-900 rounded-full flex items-center justify-center mb-6 border border-gray-800 shadow-neon-sm">
            <RotateCcw className="w-12 h-12 text-neon" />
          </div>
          <h2 className="text-3xl font-bold mb-2 text-white">All Caught Up!</h2>
          <p className="text-gray-500 mb-8 max-w-md">You've seen all the profiles nearby. Want to go through them again?</p>
          <NeonButton onClick={resetStack}>
            Shuffle Stack
          </NeonButton>
        </div>
      );
    }

    const profile = matchQueue[currentSwipeIndex];

    return (
      // Main Container
      <div className="relative w-full h-full flex flex-col items-center justify-center p-4 overflow-hidden pb-28 md:pb-4">
        {/* Desktop Background Decor */}
        <div className="absolute inset-0 hidden md:block pointer-events-none opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 bg-neon rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-blue-600 rounded-full blur-[120px]" />
        </div>

        {/* Card Container */}
        {/* Adjusted height for desktop: max-h-[65vh] to leave room for buttons */}
        <div className="relative w-full max-w-sm md:w-[400px] h-[55vh] md:h-[65vh] min-h-[400px] flex-shrink-0 mt-4 md:mt-0">
          {/* Back Cards Stack Effect */}
          {currentSwipeIndex + 1 < matchQueue.length && (
            <div className="absolute inset-0 bg-gray-800 rounded-3xl transform scale-95 translate-y-4 opacity-50 border border-gray-700" />
          )}
          {currentSwipeIndex + 2 < matchQueue.length && (
            <div className="absolute inset-0 bg-gray-800 rounded-3xl transform scale-90 translate-y-8 opacity-30 border border-gray-700" />
          )}

          {/* Active Card */}
          <div
            className={`absolute inset-0 bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden transition-all duration-500 ease-out ${swipeDirection === 'left' ? '-translate-x-[150%] rotate-[-20deg] opacity-0' :
              swipeDirection === 'right' ? 'translate-x-[150%] rotate-[20deg] opacity-0' :
                'hover:scale-[1.02]'
              }`}
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black z-10" />

            {/* Image or Pattern */}
            <div className="absolute inset-0 bg-[#080808] flex flex-col items-center justify-center overflow-hidden">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover opacity-80" />
              ) : (
                <>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  <span className="text-[10rem] font-black text-gray-800 select-none opacity-30 rotate-12 flex items-center justify-center w-full h-full">
                    {profile.anonymousId.slice(-2)}
                  </span>
                </>
              )}
            </div>

            {/* Card Content */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-8 bg-gradient-to-t from-black via-black/90 to-transparent pt-20">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter">{profile.anonymousId}</h2>
                <div className="flex flex-col items-end">
                  <span className="text-xl md:text-2xl font-bold text-neon">{profile.matchPercentage}%</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Match</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge>{profile.branch}</Badge>
                <Badge>{profile.year}</Badge>
                {/* Verification badge removed as per request */}
              </div>

              <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                {profile.interests.slice(0, 4).map(i => (
                  <span key={i} className="text-neon text-xs md:text-sm font-bold bg-neon/10 px-2 py-1 rounded">#{i}</span>
                ))}
              </div>

              <p className="text-gray-300 text-xs md:text-sm leading-relaxed mb-4 italic border-l-2 border-neon pl-3 line-clamp-3">"{profile.bio}"</p>

              <p className="text-gray-500 text-xs flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Active recently • {profile.distance} away
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8 mt-6 md:mt-8 z-30">
          <button
            onClick={() => handleSwipe('left')}
            className="group relative p-5 md:p-6 rounded-full bg-gray-900/80 backdrop-blur border border-gray-700 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all hover:scale-110 shadow-lg active:scale-95"
            aria-label="Pass"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={() => handleSwipe('right')}
            className="group relative p-5 md:p-6 rounded-full bg-gray-900/80 backdrop-blur border border-neon text-neon hover:bg-neon hover:text-white hover:shadow-[0_0_30px_#ff007f] transition-all hover:scale-110 shadow-lg active:scale-95"
            aria-label="Like"
          >
            <Heart className="w-8 h-8 fill-current" />
          </button>
        </div>
      </div>
    );
  };

  const renderMatches = () => (
    <div className="h-full flex flex-col bg-black/50 backdrop-blur-sm md:bg-transparent">
      <div className="p-6 border-b border-gray-900">
        <h2 className="text-3xl font-black flex items-center gap-3">
          Matches <span className="bg-neon text-white text-sm rounded-full px-2 py-0.5 align-middle font-mono">{matches.length}</span>
        </h2>
      </div>

      {/* Added pb-24 for mobile nav clearance */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 pb-24 md:pb-4">
        {matches.length === 0 ? (
          <div className="text-gray-500 text-center mt-20 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-gray-700" />
            </div>
            <p className="text-lg font-medium">No matches yet.</p>
            <p className="text-sm mt-2">Start swiping to find your Othrhalff.</p>
            <button
              onClick={() => setView(AppView.HOME)}
              className="mt-6 text-neon font-bold hover:underline"
            >
              Go to Discover
            </button>
          </div>
        ) : (
          matches.map(match => (
            <div
              key={match.id}
              onClick={() => { setActiveChatId(match.id); setView(AppView.CHAT); }}
              className="bg-gray-900/50 hover:bg-gray-800 p-4 rounded-2xl border border-gray-800 flex items-center justify-between hover:border-neon/50 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center border border-gray-700 group-hover:border-neon relative overflow-hidden bg-gray-800">
                  {match.avatar ? (
                    <img src={match.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-gray-400 group-hover:text-neon text-lg">{match.anonymousId.substring(5)}</span>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg group-hover:text-neon transition-colors flex items-center gap-2">
                    {match.realName} <span className="text-xs font-normal text-gray-600">({match.anonymousId})</span>
                  </h3>
                  <p className="text-xs text-gray-500 font-mono uppercase">{match.branch} • {match.year}</p>
                  <p className="text-xs text-gray-400 mt-1 truncate max-w-[150px] md:max-w-[200px]">
                    {chatSessions[match.id]?.messages.length
                      ? `You: ${chatSessions[match.id].messages[chatSessions[match.id].messages.length - 1].text}`
                      : "Start a conversation..."}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-full bg-gray-800 group-hover:bg-neon/20 group-hover:text-neon transition-colors">
                <MessageCircle className="w-5 h-5" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderNotifications = () => {
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-gray-900 flex items-center justify-between">
          <h2 className="text-3xl font-black flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-neon text-white text-xs rounded-full px-2 py-0.5 animate-pulse font-mono">{unreadCount}</span>
            )}
          </h2>
          <button
            onClick={markAllNotificationsRead}
            className="text-xs text-neon hover:text-white transition-colors uppercase font-bold tracking-wider border border-neon/30 hover:bg-neon hover:border-neon px-3 py-1 rounded-full"
          >
            Mark all read
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 pb-24 md:pb-4">
          {notifications.length === 0 ? (
            <div className="text-center py-20 text-gray-600">
              <Bell className="w-16 h-16 mx-auto mb-6 opacity-20" />
              <p>All caught up!</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${notif.read
                  ? 'bg-gray-900/30 border-gray-800/50'
                  : 'bg-gray-900 border-neon/50 shadow-[0_0_15px_rgba(255,0,127,0.05)]'
                  }`}
              >
                <div className={`mt-1 p-3 rounded-xl flex-shrink-0 ${notif.type === 'match' ? 'bg-neon/10 text-neon' :
                  notif.type === 'message' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-gray-700/30 text-gray-300'
                  }`}>
                  {notif.type === 'match' ? <Heart className="w-5 h-5 fill-current" /> :
                    notif.type === 'message' ? <MessageCircle className="w-5 h-5" /> :
                      <Zap className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`text-base font-bold mb-1 ${notif.read ? 'text-gray-300' : 'text-white'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-gray-600 uppercase tracking-wide font-mono whitespace-nowrap ml-2">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderChat = () => {
    if (!activeChatId) return null;
    const match = matches.find(m => m.id === activeChatId);
    const session = chatSessions[activeChatId];
    if (!match || !session) return null;

    return (
      <div className="flex flex-col h-full bg-black relative">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setView(AppView.MATCHES)} className="md:hidden text-gray-400 hover:text-white p-2">
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden border border-gray-600">
                {match.avatar ? (
                  <img src={match.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-gray-300">{match.anonymousId.slice(-2)}</span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-white leading-tight">{match.realName}</h3>
                <p className="text-[10px] text-neon uppercase tracking-widest font-bold">
                  {match.anonymousId} • Online
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => startCall(CallType.AUDIO)}
              className="p-3 bg-gray-800/50 rounded-full text-gray-300 hover:text-neon hover:bg-neon/10 transition-all"
              title="Voice Call"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => startCall(CallType.VIDEO)}
              className="p-3 bg-gray-800/50 rounded-full text-gray-300 hover:text-neon hover:bg-neon/10 transition-all"
              title="Video Call"
            >
              <Video className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleBlockUser(match.id)}
              className="p-3 bg-gray-800/50 rounded-full text-red-400 hover:text-red-600 hover:bg-red-900/20 transition-all ml-2"
              title="Block User"
            >
              <ShieldBan className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Compatibility Badge */}
        <div className="bg-gray-900/30 py-1 text-center border-b border-gray-800/50">
          <p className="text-[10px] text-gray-400 flex items-center justify-center gap-2 uppercase tracking-widest">
            <Zap className="w-3 h-3 text-yellow-500" />
            Encrypted Session • Auto-delete in 48h
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-dots-pattern">
          {session.messages.length === 0 && (
            <div className="text-center py-10 animate-fade-in">
              <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-800 overflow-hidden">
                {match.avatar ? (
                  <img src={match.avatar} alt="Match" className="w-full h-full object-cover opacity-50" />
                ) : (
                  <Ghost className="w-8 h-8 text-gray-600" />
                )}
              </div>
              <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">You matched based on common interests in <span className="text-white font-bold">{match.interests[0]}</span>. Say hello!</p>

              <button
                onClick={() => handleIceBreaker(match.id)}
                className="group text-xs border border-neon text-neon px-6 py-3 rounded-full hover:bg-neon hover:text-white transition-all flex items-center gap-2 mx-auto font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(255,0,127,0.2)]"
              >
                <Zap className="w-4 h-4 group-hover:animate-pulse" /> Generate Ice Breaker
              </button>
            </div>
          )}
          {session.messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser?.id;
            const showTimestamp = idx === 0 || (msg.timestamp - session.messages[idx - 1].timestamp > 60000 * 5);

            return (
              <div key={msg.id} className="animate-fade-in-up">
                {showTimestamp && (
                  <div className="text-center my-4">
                    <span className="text-[10px] text-gray-700 font-mono bg-gray-900 px-2 py-1 rounded">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-lg relative ${isMe
                    ? 'bg-neon text-white rounded-tr-none shadow-[0_0_15px_rgba(255,0,127,0.15)]'
                    : 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700'
                    }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-4 bg-black border-t border-gray-800 pb-safe">
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl px-4 py-2 focus-within:border-neon focus-within:shadow-neon-sm transition-all flex items-center gap-2">
              <input
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-white outline-none py-2 resize-none"
                autoComplete="off"
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="p-4 bg-neon rounded-full text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-neon"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar pb-24 md:pb-6">
      <h2 className="text-3xl font-black mb-8 flex justify-between items-center">
        <span>My Profile</span>
        {!isEditingProfile && (
          <button onClick={startEditing} className="text-sm font-bold text-neon border border-neon px-3 py-1 rounded-full hover:bg-neon hover:text-white transition-all flex items-center gap-2">
            <Edit2 className="w-3 h-3" /> Edit
          </button>
        )}
      </h2>

      {isEditingProfile ? (
        <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-3xl mb-6 animate-fade-in">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Edit2 className="w-5 h-5 text-neon" /> Edit Details</h3>

          {/* Avatar Upload in Edit Mode */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-24 h-24 rounded-full bg-gray-800 border-2 border-neon overflow-hidden group cursor-pointer">
              <img src={editForm.avatar || currentUser?.avatar} alt="Avatar" className="w-full h-full object-cover" />
              <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, true)} />
              </label>
            </div>
            <span className="text-xs text-gray-400 mt-2">Tap to change photo</span>

            <div className="flex gap-2 mt-4 overflow-x-auto w-full justify-center">
              {AVATAR_PRESETS.slice(0, 5).map((avatar, i) => (
                <button
                  key={i}
                  onClick={() => setEditForm({ ...editForm, avatar })}
                  className={`w-8 h-8 rounded-full border overflow-hidden ${editForm.avatar === avatar ? 'border-neon' : 'border-gray-700'}`}
                >
                  <img src={avatar} alt="" className="w-full h-full" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Real Name</label>
              <NeonInput value={editForm.realName} onChange={e => setEditForm({ ...editForm, realName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Branch</label>
                <NeonInput value={editForm.branch} onChange={e => setEditForm({ ...editForm, branch: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Year</label>
                <select
                  className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon"
                  value={editForm.year}
                  onChange={e => setEditForm({ ...editForm, year: e.target.value })}
                >
                  <option>Freshman</option>
                  <option>Sophomore</option>
                  <option>Junior</option>
                  <option>Senior</option>
                  <option>Grad</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Bio</label>
              <textarea
                className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon h-24 resize-none"
                value={editForm.bio}
                onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <NeonButton onClick={handleSaveProfile} className="flex-1 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </NeonButton>
              <NeonButton variant="secondary" onClick={() => setIsEditingProfile(false)} className="flex-1">
                Cancel
              </NeonButton>
            </div>
          </div>
        </div>
      ) : (
        // Display Mode
        <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Ghost className="w-32 h-32" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 rounded-full border-2 border-neon overflow-hidden bg-black">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600"><User className="w-10 h-10" /></div>
                )}
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Identity</p>
                <h3 className="text-4xl font-bold text-white mb-1">{currentUser?.realName}</h3>
                <p className="text-neon font-mono text-sm">{currentUser?.anonymousId}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
              <span className="bg-gray-800 px-3 py-1 rounded-full text-white">{currentUser?.gender}</span>
              <span className="bg-gray-800 px-3 py-1 rounded-full">{currentUser?.branch}</span>
              <span className="bg-gray-800 px-3 py-1 rounded-full">{currentUser?.year}</span>
            </div>

            {/* Verified badge removed */}

            <div className="bg-black/30 p-4 rounded-xl border border-gray-800/50 mb-6">
              <p className="text-gray-300 italic">"{currentUser?.bio || "No bio set"}"</p>
            </div>

            <h4 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Interests</h4>
            <div className="flex flex-wrap gap-2">
              {currentUser?.interests.map(i => (
                <span key={i} className="text-white text-xs bg-gray-800 px-3 py-1 rounded-full border border-gray-700">{i}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Verification CTA - Only show if not verified */}
      {!currentUser?.isVerified && !isEditingProfile && (
        <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-neon/10 rounded-full text-neon">
              <ShieldBan className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Get Verified</h3>
              <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                Verify your identity to get the exclusive <span className="text-green-500 font-bold">Green Tick</span> on your profile.
                Verified users get 2x more matches!
              </p>
              <NeonButton
                onClick={() => { setShowVerificationModal(true); setVerificationStep('step-1'); }}
                className="w-full text-sm py-2"
              >
                Verify Yourself
              </NeonButton>
              <p className="text-[10px] text-gray-600 mt-2 text-center">
                *Your ID will be securely handled and deleted after verification.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        <NeonButton variant="secondary" className="w-full justify-start" onClick={() => alert('Settings not implemented in demo.')}>
          <span className="mr-auto">Account Settings</span>
        </NeonButton>
        <NeonButton variant="secondary" className="w-full justify-start" onClick={() => alert('Report submitted.')}>
          <AlertTriangle className="w-4 h-4 mr-2" /> <span className="mr-auto">Report an Issue</span>
        </NeonButton>
        <NeonButton variant="danger" className="w-full justify-start mt-4" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" /> <span className="mr-auto">Logout</span>
        </NeonButton>
      </div>

      <div className="mt-auto pt-8 text-center">
        <p className="text-gray-600 text-xs">Version 1.2.0 • {APP_NAME}</p>
      </div>
    </div>
  );

  const renderVirtualDate = () => {
    const dates = [
      {
        id: 'cinema',
        title: 'Cinema Paradiso',
        icon: <Film className="w-8 h-8 md:w-10 md:h-10 text-neon" />,
        desc: 'Watch YouTube & movies in sync.',
        color: 'from-orange-500/20 to-red-600/20',
        border: 'group-hover:border-orange-500'
      },
      {
        id: 'music',
        title: 'Soul Sync',
        icon: <Music className="w-8 h-8 md:w-10 md:h-10 text-cyan-400" />,
        desc: 'Listen & feel the beat together.',
        color: 'from-cyan-500/20 to-blue-600/20',
        border: 'group-hover:border-cyan-400'
      },
      {
        id: 'games',
        title: 'Neon Arcade',
        icon: <Gamepad2 className="w-8 h-8 md:w-10 md:h-10 text-green-400" />,
        desc: 'Play mini-games & break the ice.',
        color: 'from-green-500/20 to-emerald-600/20',
        border: 'group-hover:border-green-400'
      },
      {
        id: 'cards',
        title: 'The Deck',
        icon: <Layers className="w-8 h-8 md:w-10 md:h-10 text-purple-400" />,
        desc: 'Deep questions. Real connections.',
        color: 'from-purple-500/20 to-pink-600/20',
        border: 'group-hover:border-purple-400'
      },
      {
        id: 'stars',
        title: 'Stargazing',
        icon: <Stars className="w-8 h-8 md:w-10 md:h-10 text-yellow-200" />,
        desc: 'Just talk under the digital stars.',
        color: 'from-indigo-900/40 to-black',
        border: 'group-hover:border-yellow-200'
      }
    ];

    return (
      <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar pb-24 md:pb-6 relative">
        {/* Background Atmosphere */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="mb-8 relative z-10">
          <h2 className="text-4xl font-black text-white italic tracking-tighter mb-2 flex items-center gap-3">
            VIRTUAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-purple-600">DATE</span>
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
          </h2>
          <p className="text-gray-400 max-w-md">Select an experience to share with your match. It's time to get closer, digitally.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr relative z-10">
          {dates.map((date, idx) => (
            <button
              key={date.id}
              onClick={() => alert(`Launching ${date.title}... (Feature coming soon!)`)}
              className={`group relative overflow-hidden rounded-3xl border border-gray-800 bg-gray-900/40 backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] text-left p-6 flex flex-col justify-between ${date.border} hover:shadow-2xl animate-fade-in-up`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${date.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className="mb-4 bg-gray-900/50 w-fit p-4 rounded-2xl group-hover:bg-black/20 transition-colors backdrop-blur-md shadow-inner border border-white/5">
                  {date.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:translate-x-1 transition-transform">{date.title}</h3>
                <p className="text-gray-400 text-sm group-hover:text-gray-200 transition-colors">{date.desc}</p>
              </div>

              <div className="relative z-10 mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                Start Date <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          ))}

          {/* Coming Soon Card */}
          <div className="rounded-3xl border border-dashed border-gray-800 bg-transparent flex flex-col items-center justify-center p-6 text-center opacity-50 hover:opacity-100 transition-opacity">
             <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-4">
               <span className="text-2xl">?</span>
             </div>
             <p className="text-sm font-bold text-gray-500">More Styles Coming Soon</p>
          </div>
        </div>
      </div>
    );
  };

  const renderVerificationModal = () => {
    if (!showVerificationModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-gray-900 border border-gray-800 w-full max-w-md p-6 rounded-3xl relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <button
            onClick={closeVerificationModal}
            className="absolute top-4 right-4 text-gray-500 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>

          {verificationStep === 'step-1' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
                <ShieldBan className="w-8 h-8 text-neon" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Verify Identity</h2>
              <p className="text-gray-400 text-sm mb-6">Step 1: College & ID</p>

              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select College</label>
                  <select
                    className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon appearance-none"
                    value={verificationCollege}
                    onChange={(e) => setVerificationCollege(e.target.value)}
                  >
                    <option value="" disabled>Select your college</option>
                    <option value="Amity University Raipur">Amity University Raipur</option>
                    <option value="NIT Raipur">NIT Raipur</option>
                    <option value="IIM Raipur">IIM Raipur</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Upload ID Card</label>
                  <label className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${verificationFile ? 'border-neon bg-neon/10' : 'border-gray-700 hover:border-gray-500 bg-black/40'}`}>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setVerificationFile(file);
                      }}
                    />
                    {verificationFile ? (
                      <>
                        <CheckCircle2 className="w-8 h-8 text-neon mb-2" />
                        <p className="text-sm font-bold text-white">{verificationFile.name}</p>
                        <p className="text-xs text-neon mt-1">Tap to change</p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                        <p className="text-sm text-gray-400">Tap to upload ID photo</p>
                      </>
                    )}
                  </label>
                </div>

                <NeonButton
                  onClick={() => setVerificationStep('step-2')}
                  className="w-full mt-4"
                  disabled={!verificationCollege || !verificationFile}
                >
                  Next Step
                </NeonButton>
              </div>
            </div>
          )}

          {verificationStep === 'step-2' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
                <CheckCircle2 className="w-8 h-8 text-neon" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Verify Email</h2>
              <p className="text-gray-400 text-sm mb-6">Step 2: Enter College Email</p>

              <div className="text-left mb-6">
                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">College Email Address</label>
                <NeonInput
                  placeholder="student@university.edu"
                  value={verificationEmail}
                  onChange={e => setVerificationEmail(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setVerificationStep('step-1')}
                  className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all font-bold text-sm"
                >
                  Back
                </button>
                <NeonButton
                  onClick={handleVerificationSubmit}
                  className="flex-[2]"
                  disabled={!verificationEmail.includes('@')}
                >
                  Submit & Verify
                </NeonButton>
              </div>
            </div>
          )}

          {verificationStep === 'success' && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-900 animate-pulse">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-black text-white mb-4">Request Sent!</h2>
              <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 mx-1 mb-6">
                <p className="text-gray-300 text-sm leading-relaxed font-medium">
                  NOTE: we will verify the details if it would be correct we will povide the tick and if something is missing will inform you on your inbox of Othrhalff message box
                </p>
              </div>
              <NeonButton onClick={closeVerificationModal} className="w-full">
                Close
              </NeonButton>
            </div>
          )}
        </div>
      </div>
    );
  };

  // -- Layout Wrapper --
  if (view === AppView.LANDING) return <LandingPage onEnter={() => setView(AppView.LOGIN)} />;
  if (view === AppView.LOGIN) return renderLogin();

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden selection:bg-neon selection:text-white">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r border-gray-900 bg-black z-20 relative">
        <div className="p-8">
          <h1 className="text-2xl font-black text-white tracking-tighter flex items-center gap-2 uppercase cursor-pointer" onClick={() => setView(AppView.HOME)}>
            <span>Other</span>
            <span className="text-neon">Half</span>
            <Ghost className="w-6 h-6 text-neon" />
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setView(AppView.HOME)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group ${view === AppView.HOME ? 'bg-neon/10 text-neon border border-neon/20' : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <Search className="w-5 h-5" />
            <span className="font-bold tracking-wide text-sm">Discover</span>
            {view === AppView.HOME && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-neon shadow-neon-sm" />}
          </button>

          <button
            onClick={() => setView(AppView.MATCHES)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group ${view === AppView.MATCHES || view === AppView.CHAT ? 'bg-neon/10 text-neon border border-neon/20' : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-bold tracking-wide text-sm">Messages</span>
            {matches.length > 0 && <span className="ml-auto bg-gray-800 text-white text-xs px-2 py-0.5 rounded-full">{matches.length}</span>}
          </button>

          <button
            onClick={() => setView(AppView.NOTIFICATIONS)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group ${view === AppView.NOTIFICATIONS ? 'bg-neon/10 text-neon border border-neon/20' : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <Bell className="w-5 h-5" />
            <span className="font-bold tracking-wide text-sm">Notifications</span>
            {notifications.some(n => !n.read) && <div className="ml-auto w-2 h-2 rounded-full bg-neon animate-pulse" />}
          </button>

          <button
            onClick={() => setView(AppView.VIRTUAL_DATE)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group ${view === AppView.VIRTUAL_DATE ? 'bg-neon/10 text-neon border border-neon/20' : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <CalendarHeart className="w-5 h-5" />
            <span className="font-bold tracking-wide text-sm">Virtual Date</span>
          </button>

          <button
            onClick={() => setView(AppView.PROFILE)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group ${view === AppView.PROFILE ? 'bg-neon/10 text-neon border border-neon/20' : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <User className="w-5 h-5" />
            <span className="font-bold tracking-wide text-sm">My Profile</span>
          </button>
        </nav>

        <div className="p-6 border-t border-gray-900">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gray-800 border border-gray-700">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">{currentUser?.anonymousId.slice(-2)}</span>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{currentUser?.realName}</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-[#050505]">
        {/* Content */}
        <div className="flex-1 overflow-hidden relative w-full h-full">
          {view === AppView.HOME && renderHome()}
          {view === AppView.MATCHES && renderMatches()}
          {view === AppView.NOTIFICATIONS && renderNotifications()}
          {view === AppView.CHAT && renderChat()}
          {view === AppView.VIRTUAL_DATE && renderVirtualDate()}
          {view === AppView.PROFILE && renderProfile()}
        </div>

        {/* Global Modals */}
        {renderVerificationModal()}

        {/* Mobile Bottom Nav (Only visible on small screens) */}
        {view !== AppView.CHAT && (
          <nav className="md:hidden h-20 bg-black/90 backdrop-blur border-t border-gray-900 flex justify-around items-center px-2 z-40 fixed bottom-0 left-0 right-0 pb-safe">
            <button
              onClick={() => setView(AppView.HOME)}
              className={`p-2 flex flex-col items-center gap-1 ${view === AppView.HOME ? 'text-neon' : 'text-gray-600'}`}
            >
              <div className={`p-1 rounded-xl ${view === AppView.HOME ? 'bg-neon/10' : ''}`}>
                <Search className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">DISCOVER</span>
            </button>

            <button
              onClick={() => setView(AppView.MATCHES)}
              className={`p-2 flex flex-col items-center gap-1 ${view === AppView.MATCHES ? 'text-neon' : 'text-gray-600'}`}
            >
              <div className={`p-1 rounded-xl ${view === AppView.MATCHES ? 'bg-neon/10' : ''}`}>
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">CHATS</span>
            </button>

            <button
              onClick={() => setView(AppView.NOTIFICATIONS)}
              className={`p-2 flex flex-col items-center gap-1 ${view === AppView.NOTIFICATIONS ? 'text-neon' : 'text-gray-600'}`}
            >
              <div className={`p-1 rounded-xl ${view === AppView.NOTIFICATIONS ? 'bg-neon/10' : ''} relative`}>
                <Bell className="w-6 h-6" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-neon rounded-full animate-pulse" />
                )}
              </div>
              <span className="text-[10px] font-bold tracking-wider">ALERTS</span>
            </button>

            <button
              onClick={() => setView(AppView.VIRTUAL_DATE)}
              className={`p-2 flex flex-col items-center gap-1 ${view === AppView.VIRTUAL_DATE ? 'text-neon' : 'text-gray-600'}`}
            >
              <div className={`p-1 rounded-xl ${view === AppView.VIRTUAL_DATE ? 'bg-neon/10' : ''}`}>
                <CalendarHeart className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">DATE</span>
            </button>

            <button
              onClick={() => setView(AppView.PROFILE)}
              className={`p-2 flex flex-col items-center gap-1 ${view === AppView.PROFILE ? 'text-neon' : 'text-gray-600'}`}
            >
              <div className={`p-1 rounded-xl ${view === AppView.PROFILE ? 'bg-neon/10' : ''}`}>
                <User className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">ME</span>
            </button>
          </nav>
        )}
      </main>

      {/* Call Overlay - Global */}
      <VideoCall
        isActive={isCallActive}
        onEndCall={() => setIsCallActive(false)}
        remoteName={activeChatId ? matches.find(m => m.id === activeChatId)?.realName || matches.find(m => m.id === activeChatId)?.anonymousId || 'Unknown' : 'Unknown'}
        isVideo={callType === CallType.VIDEO}
      />
    </div>
  );
}
