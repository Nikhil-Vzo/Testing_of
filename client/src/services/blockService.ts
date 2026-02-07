import { supabase } from '../lib/supabase';

export interface BlockedUser {
    id: string;
    blocker_id: string;
    blocked_id: string;
    created_at: string;
}

/**
 * Block a user
 */
export const blockUser = async (blockedId: string): Promise<boolean> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('blocked_users')
            .insert({
                blocker_id: user.id,
                blocked_id: blockedId
            });

        if (error) {
            console.error('Error blocking user:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error blocking user:', error);
        return false;
    }
};

/**
 * Unblock a user
 */
export const unblockUser = async (blockedId: string): Promise<boolean> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('blocked_users')
            .delete()
            .match({
                blocker_id: user.id,
                blocked_id: blockedId
            });

        if (error) {
            console.error('Error unblocking user:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error unblocking user:', error);
        return false;
    }
};

/**
 * Check if current user has blocked someone
 */
export const isUserBlocked = async (userId: string): Promise<boolean> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data, error } = await supabase
            .from('blocked_users')
            .select('id')
            .match({
                blocker_id: user.id,
                blocked_id: userId
            })
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error checking block status:', error);
            return false;
        }

        return !!data;
    } catch (error) {
        console.error('Error checking block status:', error);
        return false;
    }
};

/**
 * Check if current user is blocked by someone
 */
export const isBlockedBy = async (userId: string): Promise<boolean> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data, error } = await supabase
            .from('blocked_users')
            .select('id')
            .match({
                blocker_id: userId,
                blocked_id: user.id
            })
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error checking if blocked:', error);
            return false;
        }

        return !!data;
    } catch (error) {
        console.error('Error checking if blocked:', error);
        return false;
    }
};

/**
 * Get all blocked users for current user
 */
export const getBlockedUsers = async (): Promise<string[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('blocked_users')
            .select('blocked_id')
            .eq('blocker_id', user.id);

        if (error) {
            console.error('Error fetching blocked users:', error);
            return [];
        }

        return data?.map(b => b.blocked_id) || [];
    } catch (error) {
        console.error('Error fetching blocked users:', error);
        return [];
    }
};

/**
 * Subscribe to block status changes
 */
export const subscribeToBlockChanges = (
    userId: string,
    onBlockChange: (isBlocked: boolean) => void
) => {
    const channel = supabase
        .channel(`block_status:${userId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'blocked_users',
                filter: `blocked_id=eq.${userId}`
            },
            async (payload) => {
                // Check if we're now blocked
                const blocked = await isUserBlocked(userId);
                onBlockChange(blocked);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};
