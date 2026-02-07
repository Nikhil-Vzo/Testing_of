import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface PresenceContextType {
    onlineUsers: Map<string, boolean>;
    lastSeenMap: Map<string, Date>;
    subscribeToUser: (userId: string) => void;
    unsubscribeFromUser: (userId: string) => void;
    isUserOnline: (userId: string) => boolean;
    getLastSeen: (userId: string) => Date | null;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState<Map<string, boolean>>(new Map());
    const [lastSeenMap, setLastSeenMap] = useState<Map<string, Date>>(new Map());
    const [subscribedUsers, setSubscribedUsers] = useState<Set<string>>(new Set());
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Update user's own presence to online
    const updatePresence = async (isOnline: boolean) => {
        if (!currentUser || !supabase) return;

        try {
            const { error } = await supabase
                .from('user_presence')
                .upsert({
                    user_id: currentUser.id,
                    is_online: isOnline,
                    last_seen: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (error) console.error('Error updating presence:', error);
        } catch (err) {
            console.error('Failed to update presence:', err);
        }
    };

    // Heartbeat - Update presence every 30 seconds
    useEffect(() => {
        if (!currentUser) return;

        // Set online immediately
        updatePresence(true);

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
            updatePresence(true);
        }, 30000); // 30 seconds

        // Activity detection - reset heartbeat on user activity
        const resetActivity = () => {
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }
            updatePresence(true);
        };

        window.addEventListener('mousemove', resetActivity);
        window.addEventListener('keydown', resetActivity);
        window.addEventListener('focus', resetActivity);

        // Set offline on unmount/page close
        const handleBeforeUnload = () => {
            updatePresence(false);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }
            window.removeEventListener('mousemove', resetActivity);
            window.removeEventListener('keydown', resetActivity);
            window.removeEventListener('focus', resetActivity);
            window.removeEventListener('beforeunload', handleBeforeUnload);

            // Set offline when component unmounts
            updatePresence(false);
        };
    }, [currentUser]);

    // Subscribe to specific users' presence
    const subscribeToUser = (userId: string) => {
        if (!supabase || subscribedUsers.has(userId)) return;

        setSubscribedUsers(prev => new Set(prev).add(userId));

        // Fetch initial presence
        supabase
            .from('user_presence')
            .select('*')
            .eq('user_id', userId)
            .single()
            .then(({ data, error }) => {
                if (data && !error) {
                    setOnlineUsers(prev => new Map(prev).set(userId, data.is_online));
                    setLastSeenMap(prev => new Map(prev).set(userId, new Date(data.last_seen)));
                }
            });

        // Subscribe to real-time updates
        const channel = supabase
            .channel(`presence:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_presence',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    const data = payload.new as any;
                    if (data) {
                        setOnlineUsers(prev => new Map(prev).set(userId, data.is_online));
                        setLastSeenMap(prev => new Map(prev).set(userId, new Date(data.last_seen)));
                    }
                }
            )
            .subscribe();

        // Store channel for cleanup
        return () => {
            supabase.removeChannel(channel);
        };
    };

    const unsubscribeFromUser = (userId: string) => {
        setSubscribedUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
        });
    };

    const isUserOnline = (userId: string): boolean => {
        return onlineUsers.get(userId) || false;
    };

    const getLastSeen = (userId: string): Date | null => {
        return lastSeenMap.get(userId) || null;
    };

    return (
        <PresenceContext.Provider
            value={{
                onlineUsers,
                lastSeenMap,
                subscribeToUser,
                unsubscribeFromUser,
                isUserOnline,
                getLastSeen
            }}
        >
            {children}
        </PresenceContext.Provider>
    );
};

export const usePresence = () => {
    const context = useContext(PresenceContext);
    if (context === undefined) {
        throw new Error('usePresence must be used within a PresenceProvider');
    }
    return context;
};
