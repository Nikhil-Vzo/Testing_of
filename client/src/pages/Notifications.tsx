import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Heart, MessageCircle, Zap, Check, X, Ghost } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Cache keys
const NOTIF_CACHE_KEY = 'otherhalf_notifications_cache';
const NOTIF_CACHE_EXPIRY_KEY = 'otherhalf_notifications_cache_expiry';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'match' | 'message' | 'system' | 'like';
  fromUserId?: string;
  fromUser?: {
    id: string;
    anonymousId: string;
    avatar: string;
    university: string;
  };
}

export const Notifications: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = (title: string, body: string, avatar?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: avatar || '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  // Optimized fetch with batched queries
  const fetchNotificationsOptimized = useCallback(async (showLoading: boolean) => {
    if (!currentUser || !supabase) return;

    if (showLoading) setLoading(true);

    try {
      // 1. Get all notifications for current user (single query)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // 2. Get all unique sender IDs for 'like' notifications
        const senderIds = [...new Set(
          data
            .filter((n: any) => n.type === 'like' && n.from_user_id)
            .map((n: any) => n.from_user_id)
        )];

        // 3. BATCHED: Fetch all sender profiles in ONE query
        let profileMap = new Map<string, any>();
        if (senderIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, anonymous_id, avatar, university')
            .in('id', senderIds);

          if (profiles) {
            profileMap = new Map(profiles.map(p => [p.id, p]));
          }
        }

        // 4. Build enriched notifications with O(1) lookups
        const enrichedNotifications: NotificationItem[] = data.map((notif: any) => {
          let fromUser = undefined;

          if (notif.type === 'like' && notif.from_user_id) {
            const profile = profileMap.get(notif.from_user_id);
            if (profile) {
              fromUser = {
                id: profile.id,
                anonymousId: profile.anonymous_id,
                avatar: profile.avatar,
                university: profile.university
              };
            }
          }

          return {
            id: notif.id,
            title: notif.title,
            message: notif.message,
            timestamp: new Date(notif.created_at).getTime(),
            read: notif.read,
            type: notif.type,
            fromUserId: notif.from_user_id,
            fromUser
          };
        });

        // Cache the results
        sessionStorage.setItem(NOTIF_CACHE_KEY, JSON.stringify(enrichedNotifications));
        sessionStorage.setItem(NOTIF_CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());

        setNotifications(enrichedNotifications);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [currentUser]);

  // Fetch notifications with cache
  useEffect(() => {
    if (!currentUser || !supabase) return;

    // Try cache first
    const cachedData = sessionStorage.getItem(NOTIF_CACHE_KEY);
    const cacheExpiry = sessionStorage.getItem(NOTIF_CACHE_EXPIRY_KEY);

    if (cachedData && cacheExpiry && Date.now() < parseInt(cacheExpiry)) {
      setNotifications(JSON.parse(cachedData));
      setLoading(false);
      // Refresh in background
      fetchNotificationsOptimized(false);
      return;
    }

    // No cache, fetch fresh
    fetchNotificationsOptimized(true);

    // REALTIME: Listen for new notifications
    if (currentUser && supabase) {
      const channel = supabase
        .channel(`notifications:${currentUser.id}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
          async (payload) => {
            const newNotif = payload.new as any;

            // Fetch sender profile for like notifications
            let fromUser = undefined;
            if (newNotif.type === 'like' && newNotif.from_user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, anonymous_id, avatar, university')
                .eq('id', newNotif.from_user_id)
                .single();

              if (profile) {
                fromUser = {
                  id: profile.id,
                  anonymousId: profile.anonymous_id,
                  avatar: profile.avatar,
                  university: profile.university
                };
              }
            }

            const enrichedNotif: NotificationItem = {
              id: newNotif.id,
              title: newNotif.title,
              message: newNotif.message,
              timestamp: new Date(newNotif.created_at).getTime(),
              read: newNotif.read,
              type: newNotif.type,
              fromUserId: newNotif.from_user_id,
              fromUser
            };

            // Add to state
            setNotifications(prev => [enrichedNotif, ...prev]);

            // Show browser notification
            showBrowserNotification(
              newNotif.title || 'Someone likes you! 💖',
              newNotif.message || 'Open the app to see who!',
              fromUser?.avatar
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser]);

  const markAllRead = async () => {
    if (!currentUser || !supabase) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', currentUser.id);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Accept a like - create a match!
  const handleAccept = async (notif: NotificationItem) => {
    if (!currentUser || !supabase || !notif.fromUserId) return;

    try {
      // 1. Create the match
      const { error: matchError } = await supabase
        .from('matches')
        .insert({
          user_a: notif.fromUserId,
          user_b: currentUser.id
        });

      if (matchError) throw matchError;

      // 2. Mark notification as read and remove from list
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notif.id);

      setNotifications(prev => prev.filter(n => n.id !== notif.id));

      // 3. Navigate to matches
      navigate('/matches');
    } catch (err) {
      console.error('Error accepting like:', err);
    }
  };

  // Ignore a like - just remove the notification
  const handleIgnore = async (notif: NotificationItem) => {
    if (!supabase) return;

    await supabase
      .from('notifications')
      .delete()
      .eq('id', notif.id);

    setNotifications(prev => prev.filter(n => n.id !== notif.id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header */}
      <div className="p-6 border-b border-gray-900 flex items-center justify-between">
        <h2 className="text-2xl font-black flex items-center gap-3">
          Notifications
          {unreadCount > 0 && (
            <span className="bg-neon text-white text-xs rounded-full px-2 py-0.5 animate-pulse font-mono">{unreadCount}</span>
          )}
        </h2>
        {notifications.length > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-neon hover:text-white transition-colors uppercase font-bold tracking-wider border border-neon/30 hover:bg-neon hover:border-neon px-3 py-1 rounded-full"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 pb-24 md:pb-4">
        {loading ? (
          /* Skeleton Loading State */
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 rounded-2xl border border-gray-800/50 bg-gray-900/30 animate-pulse">
                <div className="flex items-start gap-4">
                  {/* Avatar Skeleton */}
                  <div className="w-14 h-14 rounded-full bg-gray-800" />
                  {/* Content Skeleton */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="h-5 w-40 bg-gray-800 rounded" />
                      <div className="h-3 w-12 bg-gray-800 rounded" />
                    </div>
                    <div className="h-4 w-32 bg-gray-800/60 rounded" />
                    <div className="h-4 w-full bg-gray-800/40 rounded" />
                    {/* Button Skeleton */}
                    <div className="flex gap-2 mt-3">
                      <div className="h-9 w-24 bg-gray-800 rounded-xl" />
                      <div className="h-9 w-24 bg-gray-800 rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <Bell className="w-16 h-16 mx-auto mb-6 opacity-20" />
            <p>All caught up!</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-5 rounded-2xl border transition-all ${notif.read
                ? 'bg-gray-900/30 border-gray-800/50'
                : 'bg-gray-900 border-neon/50 shadow-[0_0_15px_rgba(255,0,127,0.05)]'
                }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon or Avatar */}
                {notif.type === 'like' && notif.fromUser ? (
                  <img
                    src={notif.fromUser.avatar}
                    alt="Profile"
                    className="w-14 h-14 rounded-full object-cover border-2 border-neon/50 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => navigate(`/profile/${notif.fromUser?.id}`)}
                  />
                ) : (
                  <div className={`mt-1 p-3 rounded-xl flex-shrink-0 ${notif.type === 'match' ? 'bg-neon/10 text-neon' :
                    notif.type === 'message' ? 'bg-blue-500/10 text-blue-400' :
                      notif.type === 'like' ? 'bg-pink-500/10 text-pink-400' :
                        'bg-gray-700/30 text-gray-300'
                    }`}>
                    {notif.type === 'match' ? <Heart className="w-5 h-5 fill-current" /> :
                      notif.type === 'message' ? <MessageCircle className="w-5 h-5" /> :
                        notif.type === 'like' ? <Heart className="w-5 h-5" /> :
                          <Zap className="w-5 h-5" />}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className={`text-base font-bold mb-1 ${notif.read ? 'text-gray-300' : 'text-white'}`}>
                        {notif.title}
                      </h4>
                      {notif.type === 'like' && notif.fromUser && (
                        <p className="text-xs text-gray-500 mb-1">
                          {notif.fromUser.anonymousId} • {notif.fromUser.university}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-600 uppercase tracking-wide font-mono whitespace-nowrap">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{notif.message}</p>

                  {/* Accept/Ignore buttons for like notifications */}
                  {notif.type === 'like' && !notif.read && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleAccept(notif)}
                        className="flex items-center gap-2 px-4 py-2 bg-neon text-white rounded-xl font-bold text-sm hover:bg-neon/80 transition-all shadow-lg hover:shadow-neon/30 active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleIgnore(notif)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-700 transition-all active:scale-95"
                      >
                        <X className="w-4 h-4" />
                        Ignore
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
