import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Heart, MessageCircle, Zap, Check, X, Ghost, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Cache keys
const NOTIF_CACHE_KEY = 'otherhalf_notifications_cache';
const NOTIF_CACHE_EXPIRY_KEY = 'otherhalf_notifications_cache_expiry';
const CACHE_DURATION = 1 * 60 * 1000; // 1 minute (Reduced for faster updates)

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
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchNotifications = useCallback(async (showLoading: boolean) => {
    if (!currentUser || !supabase) return;
    if (showLoading) setLoading(true);

    try {
      // 1. Get notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // 2. Extract sender IDs for 'like' types
      const senderIds = [...new Set(
        data
          .filter((n: any) => n.type === 'like' && n.from_user_id)
          .map((n: any) => n.from_user_id)
      )];

      // 3. Fetch Profiles
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

      // 4. Enrich Data
      const enriched: NotificationItem[] = data.map((n: any) => {
        let fromUser = undefined;
        if (n.type === 'like' && n.from_user_id) {
          const p = profileMap.get(n.from_user_id);
          if (p) {
            fromUser = {
              id: p.id,
              anonymousId: p.anonymous_id,
              avatar: p.avatar,
              university: p.university
            };
          }
        }
        return {
          id: n.id,
          title: n.title,
          message: n.message,
          timestamp: new Date(n.created_at).getTime(),
          read: n.read,
          type: n.type,
          fromUserId: n.from_user_id,
          fromUser
        };
      });

      setNotifications(enriched);
      
      // Update Cache
      sessionStorage.setItem(NOTIF_CACHE_KEY, JSON.stringify(enriched));
      sessionStorage.setItem(NOTIF_CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());

    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [currentUser]);

  // Initial Load & Realtime
  useEffect(() => {
    if (!currentUser) return;

    // Cache check
    const cached = sessionStorage.getItem(NOTIF_CACHE_KEY);
    const expiry = sessionStorage.getItem(NOTIF_CACHE_EXPIRY_KEY);
    if (cached && expiry && Date.now() < parseInt(expiry)) {
      setNotifications(JSON.parse(cached));
      setLoading(false);
      fetchNotifications(false); // Background refresh
    } else {
      fetchNotifications(true);
    }

    // Realtime Listener
    const channel = supabase!.channel('public:notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
        () => {
          fetchNotifications(false); // Refetch on new notification
          // Optional: Trigger sound or toast here
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [currentUser, fetchNotifications]);

  const handleAccept = async (notif: NotificationItem) => {
    if (!currentUser || !supabase || !notif.fromUserId) return;
    setProcessingId(notif.id);

    try {
      // 1. Insert Match (Triggers 'handle_new_match' DB function for the other user)
      const { error: matchError } = await supabase
        .from('matches')
        .insert({
          user_a: notif.fromUserId, // The original liker
          user_b: currentUser.id    // Me (The acceptor)
        });

      if (matchError) {
        // Ignore duplicate key error (already matched)
        if (matchError.code !== '23505') throw matchError;
      }

      // 2. Delete the Notification (Cleanup)
      await supabase.from('notifications').delete().eq('id', notif.id);

      // 3. UI Update
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
      
      // 4. Redirect
      navigate(`/chat/${notif.fromUserId}`); // Or /matches

    } catch (err) {
      console.error('Accept error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleIgnore = async (notif: NotificationItem) => {
    if (!supabase) return;
    setProcessingId(notif.id);
    try {
      await supabase.from('notifications').delete().eq('id', notif.id);
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch (err) {
      console.error('Ignore error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const markAllRead = async () => {
    if (!currentUser || !supabase) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', currentUser.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header */}
      <div className="p-6 border-b border-gray-900 flex items-center justify-between">
        <h2 className="text-2xl font-black flex items-center gap-3 text-white">
          Notifications
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="bg-neon text-white text-xs rounded-full px-2 py-0.5 animate-pulse font-mono">
              {notifications.filter(n => !n.read).length}
            </span>
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

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 pb-24 md:pb-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-neon animate-spin" /></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <Bell className="w-16 h-16 mx-auto mb-6 opacity-20" />
            <p>All caught up!</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-5 rounded-2xl border transition-all ${
                notif.read ? 'bg-gray-900/30 border-gray-800/50' : 'bg-gray-900 border-neon/50 shadow-[0_0_15px_rgba(255,0,127,0.05)]'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar / Icon */}
                {notif.type === 'like' && notif.fromUser ? (
                  <img
                    src={notif.fromUser.avatar}
                    alt="Profile"
                    className="w-14 h-14 rounded-full object-cover border-2 border-neon/50 cursor-pointer hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className={`mt-1 p-3 rounded-xl flex-shrink-0 ${
                    notif.type === 'match' ? 'bg-green-500/10 text-green-400' :
                    notif.type === 'message' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-gray-700/30 text-gray-300'
                  }`}>
                    {notif.type === 'match' ? <Zap className="w-5 h-5" /> : 
                     notif.type === 'message' ? <MessageCircle className="w-5 h-5" /> : 
                     <Bell className="w-5 h-5" />}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className={`text-base font-bold mb-1 ${notif.read ? 'text-gray-400' : 'text-white'}`}>
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

                  {/* Action Buttons for Likes */}
                  {notif.type === 'like' && !notif.read && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleAccept(notif)}
                        disabled={processingId === notif.id}
                        className="flex items-center gap-2 px-4 py-2 bg-neon text-white rounded-xl font-bold text-sm hover:bg-neon/80 transition-all shadow-lg hover:shadow-neon/30 active:scale-95 disabled:opacity-50"
                      >
                        {processingId === notif.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4" />}
                        Accept
                      </button>
                      <button
                        onClick={() => handleIgnore(notif)}
                        disabled={processingId === notif.id}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-50"
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