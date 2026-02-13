import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Heart, MessageCircle, Zap, Check, X, Ghost, Loader2, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProfilePreviewModal } from '../components/ProfilePreviewModal';

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
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleMessageClick = async (notif: NotificationItem) => {
    if (!currentUser || !supabase || !notif.fromUserId) return;

    // 1. Delete the notification (User has seen it)
    await deleteNotification(notif.id);

    // 2. Find Match ID and Navigate
    try {
      const { data: match } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user_a.eq.${notif.fromUserId},user_b.eq.${currentUser.id}),and(user_a.eq.${currentUser.id},user_b.eq.${notif.fromUserId})`)
        .maybeSingle();

      if (match) {
        navigate(`/chat/${match.id}`);
      } else {
        console.error('Match not found for message notification');
      }
    } catch (err) {
      console.error('Error finding match:', err);
    }
  };

  const handleAccept = async (notif: NotificationItem) => {
    if (!currentUser || !supabase || !notif.fromUserId) return;

    // Prevent double-processing
    if (processingId === notif.id) return;
    setProcessingId(notif.id);

    try {
      // 0. CHECK EXISTING MATCH FIRST (Bidirectional)
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user_a.eq.${notif.fromUserId},user_b.eq.${currentUser.id}),and(user_a.eq.${currentUser.id},user_b.eq.${notif.fromUserId})`)
        .maybeSingle();

      if (existingMatch) {
        // Match exists, just delete notification and navigate
        await deleteNotification(notif.id);
        navigate(`/chat/${existingMatch.id}`);
        setProcessingId(null);
        return;
      }

      // 1. Insert 'like' swipe (Trigger will handle match creation & notifications)
      const { error: swipeError } = await supabase.from('swipes').upsert({
        liker_id: currentUser.id,
        target_id: notif.fromUserId,
        action: 'like'
      }, { onConflict: 'liker_id,target_id' });

      if (swipeError) {
        console.error('Swipe error:', swipeError);
        throw new Error('Failed to create like. Please check your connection.');
      }

      // 2. Wait for trigger with RETRY LOGIC (mobile-friendly)
      let matchData = null;
      let attempts = 0;
      const maxAttempts = 20; // Increased to 20 (10 seconds total) for slow triggers

      while (!matchData && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data, error: matchError } = await supabase
          .from('matches')
          .select('id')
          .or(`and(user_a.eq.${notif.fromUserId},user_b.eq.${currentUser.id}),and(user_a.eq.${currentUser.id},user_b.eq.${notif.fromUserId})`)
          .maybeSingle(); // Use maybeSingle to avoid errors

        if (matchError) {
          console.error('Match check error:', matchError);
        }

        if (data) {
          matchData = data;
          break;
        }

        attempts++;
        console.log(`Waiting for match... ${attempts}/${maxAttempts}`);
      }

      // 3. Delete notification regardless of outcome (if we got this far, we swiped like)
      try {
        await deleteNotification(notif.id);
      } catch (delErr) {
        console.warn('Failed to delete notification:', delErr);
      }

      if (!matchData) {
        // TIMEOUT FALLBACK: Navigate to matches anyway so user isn't stuck
        console.warn('Match creation timed out, redirecting to matches tab.');
        alert('Match is being created in the background. Check your Matches tab momentarily.');
        navigate('/matches');
        return;
      }

      // 4. Navigate to chat if match found
      navigate(`/chat/${matchData.id}`);

    } catch (err: any) {
      console.error('Accept error:', err);
      alert(err.message || 'Something went wrong. Please check your connection and try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleIgnore = async (notif: NotificationItem) => {
    if (!supabase) return;
    setProcessingId(notif.id);
    try {
      await deleteNotification(notif.id);
    } catch (err) {
      console.error('Ignore error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const markAllReadClick = async () => {
    await markAllAsRead();
  };

  // View Profile Handler
  const handleViewProfile = async (notif: NotificationItem) => {
    if (!notif.fromUserId || !supabase) return;

    // Mark notification as read when viewing
    await markAsRead(notif.id);

    // Fetch full profile data
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', notif.fromUserId)
      .single();

    if (error || !data) {
      console.error('Error fetching profile:', error);
      return;
    }

    setSelectedProfile({
      id: data.id,
      anonymousId: data.anonymous_id,
      realName: data.real_name,
      avatar: data.avatar,
      university: data.university,
      year: data.year,
      branch: data.branch,
      bio: data.bio,
      interests: data.interests || [],
      isVerified: data.is_verified,
      notificationId: notif.id
    });
    setShowProfileModal(true);
  };

  // Like Back from Modal - FIXED VERSION
  const handleLikeBackFromModal = async (notificationId: string, userId: string) => {
    if (!currentUser || !supabase) return;

    // Prevent double-processing
    if (processingId === notificationId) return;
    setProcessingId(notificationId);

    // Close modal
    setShowProfileModal(false);
    setSelectedProfile(null);

    try {
      // 1. Insert 'like' swipe
      const { error: swipeError } = await supabase.from('swipes').upsert({
        liker_id: currentUser.id,
        target_id: userId,
        action: 'like'
      }, { onConflict: 'liker_id,target_id' });

      if (swipeError) {
        console.error('Like back error:', swipeError);
        throw new Error('Failed to like back. Please check your connection.');
      }

      // 2. Wait for trigger with RETRY LOGIC
      let matchData = null;
      let attempts = 0;
      const maxAttempts = 20; // Increased to 20 for slow triggers

      while (!matchData && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data } = await supabase
          .from('matches')
          .select('id')
          .or(`and(user_a.eq.${userId},user_b.eq.${currentUser.id}),and(user_a.eq.${currentUser.id},user_b.eq.${userId})`)
          .maybeSingle();

        if (data) {
          matchData = data;
          break;
        }

        attempts++;
      }

      // 3. Remove notification
      await deleteNotification(notificationId);

      if (!matchData) {
        // Timeout Fallback
        console.warn('Match creation timed out, redirecting to matches tab.');
        alert('Match is being created. Check your Matches tab.');
        navigate('/matches');
        return;
      }

      // 4. Navigate to chat
      navigate(`/chat/${matchData.id}`);

    } catch (err: any) {
      console.error('Like back error:', err);
      alert(err.message || 'Something went wrong. Please try again.');
      // Re-open modal on error
      if (selectedProfile) {
        setShowProfileModal(true);
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Reject from Modal
  const handleRejectFromModal = async (notificationId: string) => {
    if (!supabase) return;
    setProcessingId(notificationId);

    try {
      await deleteNotification(notificationId);
      setShowProfileModal(false);
      setSelectedProfile(null);
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setProcessingId(null);
    }
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
            onClick={() => markAllAsRead()}
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
              onClick={() => notif.type === 'message' && handleMessageClick(notif)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${notif.read ? 'bg-gray-900/30 border-gray-800/50' : 'bg-gray-900 border-neon/50 shadow-[0_0_15px_rgba(255,0,127,0.05)]'
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
                  <div className={`mt-1 p-3 rounded-xl flex-shrink-0 ${notif.type === 'match' ? 'bg-green-500/10 text-green-400' :
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
                  {notif.type === 'like' && (
                    <div className="space-y-2 mt-4">
                      {/* View Profile Button */}
                      <button
                        onClick={() => handleViewProfile(notif)}
                        disabled={processingId !== null}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800/50 text-white rounded-xl font-bold text-sm hover:bg-gray-800 border border-gray-700 hover:border-neon/50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Eye className="w-4 h-4" />
                        View Profile
                      </button>

                      {/* Accept/Ignore */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(notif)}
                          disabled={processingId !== null}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neon text-white rounded-xl font-bold text-sm hover:bg-neon/80 transition-all shadow-lg hover:shadow-neon/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingId === notif.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Accept
                        </button>
                        <button
                          onClick={() => handleIgnore(notif)}
                          disabled={processingId !== null}
                          className="flex-1 flex items-center gap-2 justify-center px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="w-4 h-4" />
                          Ignore
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Profile Preview Modal */}
      <ProfilePreviewModal
        isOpen={showProfileModal}
        profile={selectedProfile}
        notificationId={selectedProfile?.notificationId || ''}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedProfile(null);
        }}
        onLikeBack={handleLikeBackFromModal}
        onReject={handleRejectFromModal}
        isProcessing={processingId !== null}
      />
    </div>
  );
};