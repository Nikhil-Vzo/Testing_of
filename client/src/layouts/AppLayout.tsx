import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Ghost, Search, MessageCircle, Bell, CalendarHeart, User, MessageSquarePlus, Sparkles } from 'lucide-react';
import { StarField } from '../components/StarField';
import { supabase } from '../lib/supabase'; // Use Supabase directly

export const AppLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  // State for Badges
  // const [unreadCount, setUnreadCount] = useState(0); // Moved to Context
  const [matchCount, setMatchCount] = useState(0);

  // Fetch Badge Counts from Supabase
  useEffect(() => {
    if (!currentUser || !supabase) return;

    const fetchCounts = async () => {
      // 1. Count Unread Notifications - Handled by Context now
      /*
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('read', false);

      setUnreadCount(notifCount || 0);
      */

      // 2. Count Matches
      const { count: matchesCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user_a.eq.${currentUser.id},user_b.eq.${currentUser.id}`);

      setMatchCount(matchesCount || 0);
    };

    fetchCounts();

    // Optional: Subscribe to changes for live badges (Commented out to keep simple for now)
    // Subscribe to changes for live badges
    /*
    const channel = supabase.channel('badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` }, fetchCounts)
      .subscribe();
    */

    // return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  const isActive = (path: string) => location.pathname === path;

  const showStars = ['/home', '/matches', '/notifications', '/confessions'].includes(location.pathname) ||
    location.pathname.startsWith('/chat/');

  const navItems = [
    { path: '/home', icon: Search, label: 'Discover' },
    { path: '/matches', icon: MessageCircle, label: 'Messages', badge: matchCount > 0 ? matchCount : undefined },
    { path: '/notifications', icon: Bell, label: 'Notifications', isPulse: unreadCount > 0, badge: unreadCount > 0 ? unreadCount : undefined },
    { path: '/confessions', icon: MessageSquarePlus, label: 'Confessions' },
    { path: '/virtual-date', icon: CalendarHeart, label: 'Virtual Date' },
    { path: '/profile', icon: User, label: 'My Profile' },
  ];

  return (
    <div className="flex h-screen md:h-screen supports-[height:100dvh]:h-[100dvh] bg-black text-white font-sans overflow-hidden selection:bg-neon selection:text-white">

      {/* Desktop Sidebar Redesign */}
      <aside className="hidden md:flex w-[280px] flex-col border-r border-gray-900 bg-black z-20 relative">

        {/* Brand Header */}
        <div className="p-8 pb-4">
          <div
            className="group flex items-center gap-3 cursor-pointer select-none"
            onClick={() => navigate('/home')}
          >
            <div className="relative">
              <Ghost className="w-8 h-8 text-neon drop-shadow-[0_0_8px_rgba(255,0,127,0.5)] group-hover:rotate-12 transition-transform duration-300" />
              <Sparkles className="w-3 h-3 text-white absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none flex gap-1">
                <span>Othr</span>
                <span className="text-neon">Halff</span>
              </h1>
              <span className="text-[9px] font-bold text-gray-500 tracking-[0.3em] uppercase pl-0.5 group-hover:text-neon transition-colors duration-300">
                Campus Dating
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-4 mb-4">
            Menu
          </div>

          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full relative group flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 ease-out border overflow-hidden
                  ${active
                    ? 'bg-gray-900/80 border-neon/30 text-white shadow-[0_0_20px_rgba(255,0,127,0.1)]'
                    : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-900/50 hover:text-gray-200 hover:border-gray-800'
                  }`}
              >
                {/* Active Indicator Line */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-neon rounded-r-full shadow-[0_0_10px_#ff007f]" />
                )}

                {/* Hover Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-r from-neon/10 to-transparent opacity-0 transition-opacity duration-300 ${active ? 'opacity-100' : 'group-hover:opacity-30'}`} />

                {/* Icon */}
                <item.icon
                  className={`w-5 h-5 relative z-10 transition-transform duration-300 ${active ? 'text-neon scale-110 drop-shadow-[0_0_5px_rgba(255,0,127,0.5)]' : 'group-hover:scale-110 group-hover:text-gray-300'}`}
                  strokeWidth={active ? 2.5 : 2}
                />

                {/* Label */}
                <span className={`text-sm font-bold tracking-wide relative z-10 ${active ? 'text-white' : ''}`}>
                  {item.label}
                </span>

                {/* Badges/Indicators */}
                <div className="ml-auto relative z-10 flex items-center gap-2">
                  {item.badge && (
                    <span className="bg-neon text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,0,127,0.4)]">
                      {item.badge}
                    </span>
                  )}
                  {item.isPulse && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neon"></span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Profile Card */}
        <div className="p-4 border-t border-gray-900/50 bg-black/50">
          <div className="relative group p-3 rounded-2xl bg-gradient-to-b from-black to-black border border-gray-800 hover:border-neon/30 transition-all duration-300 cursor-pointer overflow-hidden">

            {/* Glow Effect */}
            <div className="absolute inset-0 bg-neon/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="flex items-center gap-3 relative z-10">
              {/* Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-700 group-hover:border-neon transition-colors duration-300">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{currentUser?.anonymousId?.slice(-2)}</span>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full animate-pulse shadow-md"></div>
              </div>

              {/* Info */}
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-white truncate group-hover:text-neon transition-colors">{currentUser?.realName || 'Anonymous'}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon/50"></div>
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider truncate">
                    {currentUser?.anonymousId || 'GUEST'}
                  </p>
                </div>
              </div>

              {/* Options Icon */}

            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-black">
        {showStars && <StarField />}
        <div className="flex-1 overflow-hidden relative w-full h-full z-10 bg-transparent">
          <Outlet />
        </div>

        {/* Mobile Bottom Nav */}
        {!location.pathname.includes('/chat/') && (
          <nav className="md:hidden h-20 bg-black/90 backdrop-blur border-t border-gray-900 flex justify-around items-center px-2 z-40 fixed bottom-0 left-0 right-0 pb-safe">
            <button onClick={() => navigate('/home')} className={`p-2 flex flex-col items-center gap-1 ${isActive('/home') ? 'text-neon' : 'text-gray-600'}`}>
              <div className={`p-1 rounded-xl ${isActive('/home') ? 'bg-neon/10' : ''}`}>
                <Search className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">DISCOVER</span>
            </button>

            <button onClick={() => navigate('/matches')} className={`p-2 flex flex-col items-center gap-1 ${isActive('/matches') ? 'text-neon' : 'text-gray-600'}`}>
              <div className={`p-1 rounded-xl ${isActive('/matches') ? 'bg-neon/10' : ''}`}>
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">CHATS</span>
            </button>

            <button onClick={() => navigate('/confessions')} className={`p-2 flex flex-col items-center gap-1 ${isActive('/confessions') ? 'text-neon' : 'text-gray-600'}`}>
              <div className={`p-1 rounded-xl ${isActive('/confessions') ? 'bg-neon/10' : ''}`}>
                <MessageSquarePlus className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">CONFESS</span>
            </button>

            <button onClick={() => navigate('/virtual-date')} className={`p-2 flex flex-col items-center gap-1 ${isActive('/virtual-date') ? 'text-neon' : 'text-gray-600'}`}>
              <div className={`p-1 rounded-xl ${isActive('/virtual-date') ? 'bg-neon/10' : ''}`}>
                <CalendarHeart className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">DATE</span>
            </button>

            <button onClick={() => navigate('/profile')} className={`p-2 flex flex-col items-center gap-1 ${isActive('/profile') ? 'text-neon' : 'text-gray-600'}`}>
              <div className={`p-1 rounded-xl ${isActive('/profile') ? 'bg-neon/10' : ''}`}>
                <User className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">ME</span>
            </button>
          </nav>
        )}
      </main>


    </div>
  );
};