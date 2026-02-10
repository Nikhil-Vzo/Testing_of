import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
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
    const [loading, setLoading] = useState(false); // Initial load only

    const fetchNotifications = useCallback(async (isBackground = false) => {
        if (!currentUser || !supabase) return;
        if (!isBackground) setLoading(true);

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select(`
          *,
          fromUser:profiles!notifications_from_user_id_fkey (
            id,
            anonymous_id,
            avatar,
            university
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

            console.log('Fetched notifications:', mapped.length, 'Unread:', mapped.filter(n => !n.read).length);
            setNotifications(mapped);
            setUnreadCount(mapped.filter(n => !n.read).length);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, [currentUser]);

    // Initial Load & Realtime Subscription
    useEffect(() => {
        if (!currentUser) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        fetchNotifications();

        const channel = supabase.channel('public:notifications')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
                (payload) => {
                    console.log('Notification verification update:', payload);
                    fetchNotifications(true);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser, fetchNotifications]);

    const markAsRead = async (id: string) => {
        // Optimistic Update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        if (!currentUser || !supabase) return;
        await supabase.from('notifications').update({ read: true }).eq('id', id);
    };

    const markAllAsRead = async () => {
        console.log('Marking all as read...');
        if (!currentUser || !supabase) return;

        // Optimistic Update
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        setUnreadCount(0);

        try {
            const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', currentUser.id);
            if (error) {
                console.error('Error marking all as read:', error);
                // Revert on error
                fetchNotifications(true);
            } else {
                console.log('Successfully marked all as read in DB');
            }
        } catch (err) {
            console.error('Exception marking all as read:', err);
            fetchNotifications(true);
        }
    };

    const deleteNotification = async (id: string) => {
        // Optimistic Update
        const notif = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (notif && !notif.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        if (!currentUser || !supabase) return;
        const { error } = await supabase.from('notifications').delete().eq('id', id);

        if (error) {
            console.error('Error deleting notification:', error);
            // Revert optimistic update? 
            // For now, just logging is enough to verify RLS issues. 
            // In a real app we might toast an error or refresh list.
            fetchNotifications(true); // Re-fetch to restore state if delete failed
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
