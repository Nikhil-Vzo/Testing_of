import { supabase } from '../lib/supabase';

export const blockUser = async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
        .from('blocked_users')
        .insert({ blocker_id: user.id, blocked_id: userId });

    if (error) {
        console.error('Error blocking user:', error);
        return false;
    }
    return true;
};

export const unblockUser = async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
        .from('blocked_users')
        .delete()
        .match({ blocker_id: user.id, blocked_id: userId });

    if (error) {
        console.error('Error unblocking user:', error);
        return false;
    }
    return true;
};

export const isUserBlocked = async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .match({ blocker_id: user.id, blocked_id: userId })
        .maybeSingle();

    if (error) {
        console.error('Error checking block status:', error);
        return false;
    }
    return !!data;
};

export const isBlockedBy = async (userId: string, currentUserId?: string) => {
    let myId = currentUserId;
    if (!myId) {
        const { data: { user } } = await supabase.auth.getUser();
        myId = user?.id;
    }
    if (!myId) return false;

    const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .match({ blocker_id: userId, blocked_id: myId })
        .maybeSingle(); // Use maybeSingle to avoid 406 error on empty result

    if (error && error.code !== 'PGRST116') { // Ignore JSON error if just empty
        console.error('Error checking if blocked by user:', error);
        return false;
    }
    return !!data;
};

export const getBlockList = async (currentUserId?: string) => {
    let userId = currentUserId;
    if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
    }
    if (!userId) return [];

    const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', userId);

    if (error) {
        console.error('Error fetching block list:', error);
        return [];
    }
    return data.map(item => item.blocked_id);
};

export const checkBlockStatus = async (otherUserId: string, currentUserId?: string) => {
    let userId = currentUserId;
    if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
    }
    if (!userId) return { isBlocked: false, isBlockedBy: false };

    const { data, error } = await supabase
        .from('blocked_users')
        .select('blocker_id, blocked_id')
        .or(`and(blocker_id.eq.${userId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${userId})`);

    if (error) {
        console.error('Error checking block status:', error);
        return { isBlocked: false, isBlockedBy: false };
    }

    const isBlocked = data.some(b => b.blocker_id === userId && b.blocked_id === otherUserId);
    const isBlockedBy = data.some(b => b.blocker_id === otherUserId && b.blocked_id === userId);

    return { isBlocked, isBlockedBy };
};
