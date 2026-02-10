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
    matchId: string
): Promise<CallSession | null> => {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/initiate-call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receiverId, matchId })
        });

        console.log(`[CallSignaling] Initiate call response status: ${response.status} at ${new Date().toISOString()}`);

        if (!response.ok) {
            throw new Error('Failed to initiate call');
        }

        const data = await response.json();
        return data.callSession;
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
 * Subscribe to incoming calls for the current user
 */
export const subscribeToIncomingCalls = (
    userId: string,
    onIncomingCall: (call: CallSession) => void
) => {
    if (!supabase) return () => { };

    const channel = supabase
        .channel(`incoming_calls:${userId}`)
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
                if (callSession.status === 'ringing') {
                    console.log(`[CallSignaling] Incoming call received at ${new Date().toISOString()} for session ${callSession.id}`);
                    onIncomingCall(callSession);
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'call_sessions',
                filter: `caller_id=eq.${userId}`
            },
            (payload) => {
                // Handle call status updates (accepted, rejected, etc.)
                const callSession = payload.new as CallSession;
                // This will be handled by CallContext
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};
