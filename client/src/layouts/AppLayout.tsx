
// import React from 'react';
// import { Outlet, useLocation, useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { useCall } from '../context/CallContext';
// import { Ghost, Search, MessageCircle, Bell, CalendarHeart, User, MessageSquarePlus } from 'lucide-react';
// import { APP_NAME } from '../constants';
// import { VideoCall } from '../components/VideoCall';
// import { CallType } from '../types';
// import { dataService } from '../services/data';

// export const AppLayout: React.FC = () => {
//   const { currentUser } = useAuth();
//   const { isCallActive, callType, remoteName, endCall } = useCall();
//   const location = useLocation();
//   const navigate = useNavigate();

//   // We can get some realtime data stats for badges here
//   const notifications = dataService.getNotifications();
//   const matches = dataService.getMatches();
//   const unreadNotifs = notifications.filter(n => !n.read).length;

//   const isActive = (path: string) => location.pathname === path;

//   const navItems = [
//     { path: '/home', icon: Search, label: 'Discover' },
//     { path: '/matches', icon: MessageCircle, label: 'Messages', badge: matches.length > 0 ? matches.length : undefined },
//     { path: '/notifications', icon: Bell, label: 'Notifications', isPulse: unreadNotifs > 0 },
//     { path: '/confessions', icon: MessageSquarePlus, label: 'Confessions' },
//     { path: '/virtual-date', icon: CalendarHeart, label: 'Virtual Date' },
//     { path: '/profile', icon: User, label: 'My Profile' },
//   ];

//   return (
//     <div className="flex h-screen bg-black text-white font-sans overflow-hidden selection:bg-neon selection:text-white">

//       {/* Desktop Sidebar */}
//       <aside className="hidden md:flex w-72 flex-col border-r border-gray-900 bg-black z-20 relative">
//         <div className="p-8">
//           <h1 className="text-2xl font-black text-white tracking-tighter flex items-center gap-2 uppercase cursor-pointer" onClick={() => navigate('/home')}>
//             <span>Othr</span>
//             <span className="text-neon">Halff</span>
//             <Ghost className="w-6 h-6 text-neon" />
//           </h1>
//         </div>

//         <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
//           {navItems.map((item) => (
//             <button
//               key={item.path}
//               onClick={() => navigate(item.path)}
//               className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group ${isActive(item.path) ? 'bg-neon/10 text-neon border border-neon/20' : 'text-gray-400 hover:bg-gray-900 hover:text-white'
//                 }`}
//             >
//               <item.icon className="w-5 h-5" />
//               <span className="font-bold tracking-wide text-sm">{item.label}</span>
//               {item.badge && <span className="ml-auto bg-gray-800 text-white text-xs px-2 py-0.5 rounded-full">{item.badge}</span>}
//               {item.isPulse && <div className="ml-auto w-2 h-2 rounded-full bg-neon animate-pulse" />}
//               {isActive(item.path) && !item.badge && !item.isPulse && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-neon shadow-neon-sm" />}
//             </button>
//           ))}
//         </nav>

//         <div className="p-6 border-t border-gray-900">
//           <div className="flex items-center gap-3 px-4 py-3 bg-gray-900/50 rounded-xl border border-gray-800">
//             <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gray-800 border border-gray-700">
//               {currentUser?.avatar ? (
//                 <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
//               ) : (
//                 <span className="text-white text-xs font-bold">{currentUser?.anonymousId.slice(-2)}</span>
//               )}
//             </div>
//             <div className="flex-1 overflow-hidden">
//               <p className="text-sm font-bold text-white truncate">{currentUser?.realName}</p>
//               <p className="text-xs text-gray-500">Online</p>
//             </div>
//           </div>
//         </div>
//       </aside>

//       {/* Main Content Area */}
//       <main className="flex-1 flex flex-col relative min-w-0 bg-black">
//         <div className="flex-1 overflow-hidden relative w-full h-full">
//           <Outlet />
//         </div>

//         {/* Mobile Bottom Nav */}
//         {!location.pathname.includes('/chat/') && (
//           <nav className="md:hidden h-20 bg-black/90 backdrop-blur border-t border-gray-900 flex justify-around items-center px-2 z-40 fixed bottom-0 left-0 right-0 pb-safe">
//             <button onClick={() => navigate('/home')} className={`p-2 flex flex-col items-center gap-1 ${isActive('/home') ? 'text-neon' : 'text-gray-600'}`}>
//               <div className={`p-1 rounded-xl ${isActive('/home') ? 'bg-neon/10' : ''}`}>
//                 <Search className="w-6 h-6" />
//               </div>
//               <span className="text-[10px] font-bold tracking-wider">DISCOVER</span>
//             </button>

//             <button onClick={() => navigate('/matches')} className={`p-2 flex flex-col items-center gap-1 ${isActive('/matches') ? 'text-neon' : 'text-gray-600'}`}>
//               <div className={`p-1 rounded-xl ${isActive('/matches') ? 'bg-neon/10' : ''}`}>
//                 <MessageCircle className="w-6 h-6" />
//               </div>
//               <span className="text-[10px] font-bold tracking-wider">CHATS</span>
//             </button>

//             {/* Confessions replaced Notifications here */}
//             <button onClick={() => navigate('/confessions')} className={`p-2 flex flex-col items-center gap-1 ${isActive('/confessions') ? 'text-neon' : 'text-gray-600'}`}>
//               <div className={`p-1 rounded-xl ${isActive('/confessions') ? 'bg-neon/10' : ''}`}>
//                 <MessageSquarePlus className="w-6 h-6" />
//               </div>
//               <span className="text-[10px] font-bold tracking-wider">CONFESS</span>
//             </button>

//             <button onClick={() => navigate('/virtual-date')} className={`p-2 flex flex-col items-center gap-1 ${isActive('/virtual-date') ? 'text-neon' : 'text-gray-600'}`}>
//               <div className={`p-1 rounded-xl ${isActive('/virtual-date') ? 'bg-neon/10' : ''}`}>
//                 <CalendarHeart className="w-6 h-6" />
//               </div>
//               <span className="text-[10px] font-bold tracking-wider">DATE</span>
//             </button>

//             <button onClick={() => navigate('/profile')} className={`p-2 flex flex-col items-center gap-1 ${isActive('/profile') ? 'text-neon' : 'text-gray-600'}`}>
//               <div className={`p-1 rounded-xl ${isActive('/profile') ? 'bg-neon/10' : ''}`}>
//                 <User className="w-6 h-6" />
//               </div>
//               <span className="text-[10px] font-bold tracking-wider">ME</span>
//             </button>
//           </nav>
//         )}
//       </main>

//       {/* Global Video Call Overlay */}
//       <VideoCall
//         isActive={isCallActive}
//         onEndCall={endCall}
//         remoteName={remoteName}
//         isVideo={callType === CallType.VIDEO}
//       />
//     </div>
//   );
// };


import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { Ghost, Search, MessageCircle, Bell, CalendarHeart, User, MessageSquarePlus, Sparkles, MoreHorizontal } from 'lucide-react';
import { APP_NAME } from '../constants';
import { VideoCall } from '../components/VideoCall';
import { CallType } from '../types';
import { dataService } from '../services/data';
import { StarField } from '../components/StarField';
import { supabase } from '../lib/supabase';

export const AppLayout: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const { isCallActive, callType, remoteName, endCall } = useCall();
  const location = useLocation();
  const navigate = useNavigate();

  // Real-time notification count from Supabase
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (!currentUser || !supabase) return;

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('read', false);

      setUnreadNotifs(count || 0);
    };

    fetchUnreadCount();

    // Subscribe to changes
    const channel = supabase
      .channel('layout_notifications')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const matches = dataService.getMatches();

  const isActive = (path: string) => location.pathname === path;

  // Determine if we should show the StarField animation
  const showStars = ['/home', '/matches', '/notifications', '/confessions'].includes(location.pathname) ||
    location.pathname.startsWith('/chat/');

  const navItems = [
    { path: '/home', icon: Search, label: 'Discover' },
    { path: '/matches', icon: MessageCircle, label: 'Messages', badge: matches.length > 0 ? matches.length : undefined },
    { path: '/notifications', icon: Bell, label: 'Notifications', isPulse: unreadNotifs > 0 },
    { path: '/confessions', icon: MessageSquarePlus, label: 'Confessions' },
    { path: '/virtual-date', icon: CalendarHeart, label: 'Virtual Date' },
    { path: '/profile', icon: User, label: 'My Profile' },
  ];

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden selection:bg-neon selection:text-white">

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
              <button className="text-gray-600 hover:text-white transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
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

      {/* Global Video Call Overlay */}
      <VideoCall
        isActive={isCallActive}
        onEndCall={endCall}
        remoteName={remoteName}
        isVideo={callType === CallType.VIDEO}
      />
    </div>
  );
};