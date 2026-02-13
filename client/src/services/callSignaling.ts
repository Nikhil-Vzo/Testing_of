import { supabase } from '../lib/supabase';

export interface CallSession {
    id: string;
    caller_id: string;
    receiver_id: string;
    match_id: string;
    channel_name: string;
    token: string;
    app_id: string;
    call_type: 'audio' | 'video';
    status: 'ringing' | 'active' | 'ended' | 'rejected' | 'missed';
    created_at: string;
    answered_at?: string;
    ended_at?: string;
}

export interface IncomingCall {
    callSessionId: string;
    callerId: string;
    callerName: string;
    callerAvatar: string;
    matchId: string;
}

/**
 * Initiate a call to another user
 */
export const initiateCall = async (
    receiverId: string,
    matchId: string,
    callerInfo: { id: string; name: string; avatar: string; callType: 'audio' | 'video' }
): Promise<CallSession | null> => {
    try {
        // 1. Send immediate broadcast signal (Optimistic UI)
        await sendCallSignal(receiverId, {
            ...callerInfo,
            matchId
        });
        console.log(`[CallSignaling] Broadcast signal sent to ${receiverId}`);

        // 2. Get Agora Token from API
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/initiate-call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receiverId, matchId, callType: callerInfo.callType })
        });

        if (!response.ok) {
            throw new Error('Failed to initiate call API');
        }

        const { token, channelName, appId } = await response.json();

        // 3. Create Call Session in Supabase
        const { data: session, error } = await supabase
            .from('call_sessions')
            .insert({
                caller_id: callerInfo.id,
                receiver_id: receiverId,
                match_id: matchId,
                channel_name: channelName,
                token: token,
                app_id: appId,
                call_type: callerInfo.callType,
                status: 'ringing'
            })
            .select() // Select to get the created record with ID
            .single();

        if (error) throw error;

        console.log(`[CallSignaling] Call session created: ${session.id}`);
        return session as CallSession;

    } catch (error) {
        console.error('Error initiating call:', error);
        return null;
    }
};

/**
 * Answer an incoming call
 */
export const answerCall = async (callSessionId: string): Promise<boolean> => {
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from('call_sessions')
            .update({
                status: 'active',
                answered_at: new Date().toISOString()
            })
            .eq('id', callSessionId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error answering call:', error);
        return false;
    }
};

/**
 * Reject an incoming call
 */
export const rejectCall = async (callSessionId: string): Promise<boolean> => {
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from('call_sessions')
            .update({
                status: 'rejected',
                ended_at: new Date().toISOString()
            })
            .eq('id', callSessionId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error rejecting call:', error);
        return false;
    }
};

/**
 * End an active call
 */
export const endCall = async (callSessionId: string): Promise<boolean> => {
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from('call_sessions')
            .update({
                status: 'ended',
                ended_at: new Date().toISOString()
            })
            .eq('id', callSessionId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error ending call:', error);
        return false;
    }
};

/**
 * Get a call session by ID
 */
export const getCallSession = async (callSessionId: string): Promise<CallSession | null> => {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('call_sessions')
            .select('*')
            .eq('id', callSessionId)
            .single();

        if (error) throw error;
        return data as CallSession;
    } catch (error) {
        console.error('Error getting call session:', error);
        return null;
    }
};

/**
 * Send a broadcast signal for immediate feedback (optimistic UI)
 */
export const sendCallSignal = async (receiverId: string, payload: any) => {
    if (!supabase) return;

    // We broadcast to the receiver's channel
    const channel = supabase.channel(`incoming_calls:${receiverId}`);

    channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await channel.send({
                type: 'broadcast',
                event: 'incoming_call_signal',
                payload: payload
            });
            // Cleanup after sending
            supabase.removeChannel(channel);
        }
    });
};

/**
 * Check if a user is currently busy (on an active call or has a ringing call)
 * FIXED: Ignores stale sessions (older than 1 minute for ringing, 2 hours for active)
 */
export const checkUserBusy = async (userId: string): Promise<boolean> => {
    if (!supabase) return false;

    try {
        // Fetch any potential busy sessions
        const { data, error } = await supabase
            .from('call_sessions')
            .select('id, status, created_at')
            .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
            .in('status', ['ringing', 'active']);

        if (error) throw error;

        if (!data || data.length === 0) return false;

        // Filter out stale sessions in memory
        const now = Date.now();
        const validSessions = data.filter(session => {
            const createdTime = new Date(session.created_at).getTime();
            const diffMs = now - createdTime;

            if (session.status === 'ringing') {
                // If it's been ringing for more than 60 seconds, it's a stale/stuck call. Ignore it.
                return diffMs < 60000;
            } else if (session.status === 'active') {
                // If it's been active for more than 2 hours, assume it's stuck/abandoned. Ignore it.
                return diffMs < 2 * 60 * 60 * 1000;
            }
            return false;
        });

        // If we found stale sessions, we could optionally clean them up here, 
        // but simply returning false allows the new call to proceed.
        return validSessions.length > 0;

    } catch (error) {
        console.error('Error checking user busy status:', error);
        // Default to false (allow call) if check fails, to prevent permanent blocking
        return false;
    }
};

/**
 * Subscribe to incoming calls for the current user
 */
export const subscribeToIncomingCalls = (
    userId: string,
    onIncomingCall: (call: CallSession | any) => void
) => {
    if (!supabase) return () => { };

    const channel = supabase
        .channel(`incoming_calls:${userId}`)
        .on(
            'broadcast',
            { event: 'incoming_call_signal' },
            (payload) => {
                console.log(`[CallSignaling] Broadcast received at ${new Date().toISOString()}`, payload);
                onIncomingCall({
                    isBroadcast: true,
                    ...payload.payload
                });
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'call_sessions',
                filter: `receiver_id=eq.${userId}`
            },
            (payload) => {
                const callSession = payload.new as CallSession;
                // Only trigger if it's a fresh call (created within last 30 seconds)
                const createdTime = new Date(callSession.created_at).getTime();
                const isFresh = (Date.now() - createdTime) < 30000;

                if (callSession.status === 'ringing' && isFresh) {
                    console.log(`[CallSignaling] DB Insert received for session ${callSession.id}`);
                    onIncomingCall(callSession);
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};
