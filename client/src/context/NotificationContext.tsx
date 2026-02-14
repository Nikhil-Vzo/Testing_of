import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

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

interface NotificationContextType {
    notifications: NotificationItem[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: (bg?: boolean) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Debounce Ref to prevent "Thundering Herd" of fetches
    const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchNotifications = useCallback(async (isBackground = false) => {
        if (!currentUser || !supabase) return;
        if (!isBackground) setLoading(true);

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select(`
          *,
          fromUser:profiles!notifications_from_user_id_fkey (
            id, anonymous_id, avatar, university
          )
        `)
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mapped: NotificationItem[] = (data || []).map((n: any) => ({
                id: n.id,
                title: n.title,
                message: n.message,
                timestamp: new Date(n.created_at).getTime(),
                read: n.read,
                type: n.type,
                fromUserId: n.from_user_id,
                fromUser: n.fromUser ? {
                    id: n.fromUser.id,
                    anonymousId: n.fromUser.anonymous_id,
                    avatar: n.fromUser.avatar,
                    university: n.fromUser.university
                } : undefined
            }));

            // Deduplicate Logic
            const uniqueNotifications: NotificationItem[] = [];
            const seenMap = new Set<string>();

            for (const notif of mapped) {
                let uniqueKey = notif.id;
                // Group social notifications so "User A liked you" doesn't show 5 times
                if ((notif.type === 'like' || notif.type === 'match') && notif.fromUserId) {
                    uniqueKey = `${notif.type}-${notif.fromUserId}`;
                }
                if (!seenMap.has(uniqueKey)) {
                    seenMap.add(uniqueKey);
                    uniqueNotifications.push(notif);
                }
            }

            setNotifications(uniqueNotifications);
            // Count unread items based on the DEDUPLICATED list
            setUnreadCount(uniqueNotifications.filter(n => !n.read).length);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, [currentUser]);

    // Debounced Fetcher for Realtime
    const debouncedFetch = useCallback(() => {
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = setTimeout(() => {
            console.log("⚡ Refreshing Notifications (Debounced)");
            fetchNotifications(true);
        }, 1000); // Wait 1 second for all updates to settle
    }, [fetchNotifications]);

    // Realtime Subscription
    useEffect(() => {
        if (!currentUser) return;

        fetchNotifications();

        const channel = supabase.channel('public:notifications')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
                (payload) => {
                    // When DB changes, wait a moment then fetch
                    debouncedFetch();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        };
    }, [currentUser, debouncedFetch]);

    const markAsRead = async (id: string) => {
        // 1. Optimistic Update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        if (!currentUser || !supabase) return;

        // 2. Database Update
        const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
        if (error) {
            console.error("Failed to mark read. Check RLS policies!", error);
            // Revert on error
            debouncedFetch();
        }
    };

    const markAllAsRead = async () => {
        if (!currentUser || !supabase) return;

        // 1. Optimistic Update
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        setUnreadCount(0);

        // 2. Database Update
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', currentUser.id);

        if (error) {
            console.error('Error marking all read:', error);
            debouncedFetch(); // Revert
        }
    };

    const deleteNotification = async (id: string) => {
        const notif = notifications.find(n => n.id === id);

        // 1. Optimistic Update
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (notif && !notif.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        if (!currentUser || !supabase) return;

        // 2. Database Update
        // If this is a grouped notification, we want to delete ALL from that user
        let query = supabase.from('notifications').delete();

        if (notif?.fromUserId && (notif.type === 'like' || notif.type === 'match')) {
            // Delete ALL notifications from this specific user of this type
            // This prevents the "Stack" effect where deleting one reveals another
            query = query.eq('from_user_id', notif.fromUserId).eq('type', notif.type);
        } else {
            query = query.eq('id', id);
        }

        const { error } = await query;

        if (error) {
            console.error('Error deleting:', error);
            debouncedFetch();
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            fetchNotifications,
            markAsRead,
            markAllAsRead,
            deleteNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
