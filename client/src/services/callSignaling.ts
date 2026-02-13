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
        // 0. CLEANUP: Cancel any existing 'ringing' calls from ME to THEM.
        // This prevents the "User Busy" error if you refresh the page while calling.
        if (supabase) {
            await supabase
                .from('call_sessions')
                .update({ status: 'missed', ended_at: new Date().toISOString() })
                .eq('caller_id', callerInfo.id)
                .eq('receiver_id', receiverId)
                .eq('status', 'ringing');
        }

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
            .select()
            .single();

        if (error) throw error;

        console.log(`[CallSignaling] Call session created: ${session.id}`);
        return session as CallSession;

    } catch (error) {
        console.error('Error initiating call:', error);
        return null;
    }
};

export const answerCall = async (callSessionId: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('call_sessions').update({ status: 'active', answered_at: new Date().toISOString() }).eq('id', callSessionId);
        if (error) throw error; return true;
    } catch (error) { console.error(error); return false; }
};

export const rejectCall = async (callSessionId: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('call_sessions').update({ status: 'rejected', ended_at: new Date().toISOString() }).eq('id', callSessionId);
        if (error) throw error; return true;
    } catch (error) { console.error(error); return false; }
};

export const endCall = async (callSessionId: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('call_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', callSessionId);
        if (error) throw error; return true;
    } catch (error) { console.error(error); return false; }
};

export const getCallSession = async (callSessionId: string): Promise<CallSession | null> => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase.from('call_sessions').select('*').eq('id', callSessionId).single();
        if (error) throw error; return data as CallSession;
    } catch (error) { console.error(error); return null; }
};

export const sendCallSignal = async (receiverId: string, payload: any) => {
    if (!supabase) return;
    const channel = supabase.channel(`incoming_calls:${receiverId}`);
    channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await channel.send({ type: 'broadcast', event: 'incoming_call_signal', payload: payload });
            supabase.removeChannel(channel);
        }
    });
};

/**
 * Check if a user is busy.
 * @param targetUserId The user we want to call.
 * @param ignoreCallerId (Optional) The ID of the current user. If provided, we ignore "ringing" calls initiated by THIS user (retries).
 */
export const checkUserBusy = async (targetUserId: string, ignoreCallerId?: string): Promise<boolean> => {
    if (!supabase) return false;

    try {
        const { data, error } = await supabase
            .from('call_sessions')
            .select('id, status, created_at, caller_id')
            .or(`caller_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`)
            .in('status', ['ringing', 'active']);

        if (error) throw error;
        if (!data || data.length === 0) return false;

        const now = Date.now();
        const validSessions = data.filter(session => {
            // 1. Filter out stale sessions
            const createdTime = new Date(session.created_at).getTime();
            const diffMs = now - createdTime;

            if (session.status === 'ringing' && diffMs >= 45000) return false; // Ignore ringing > 45s
            if (session.status === 'active' && diffMs >= 2 * 60 * 60 * 1000) return false; // Ignore active > 2h

            // 2. Filter out "Self-Blocking" sessions (Retry Logic)
            // If I am calling User B, and there is already a 'ringing' session where I am the caller,
            // that is likely my PREVIOUS failed attempt. Ignore it so I can try again.
            if (ignoreCallerId && session.status === 'ringing' && session.caller_id === ignoreCallerId) {
                return false;
            }

            return true;
        });

        return validSessions.length > 0;

    } catch (error) {
        console.error('Error checking user busy status:', error);
        return false;
    }
};

export const subscribeToIncomingCalls = (userId: string, onIncomingCall: (call: CallSession | any) => void) => {
    if (!supabase) return () => { };
    const channel = supabase.channel(`incoming_calls:${userId}`)
        .on('broadcast', { event: 'incoming_call_signal' }, (payload) => {
            onIncomingCall({ isBroadcast: true, ...payload.payload });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_sessions', filter: `receiver_id=eq.${userId}` }, (payload) => {
            const callSession = payload.new as CallSession;
            const isFresh = (Date.now() - new Date(callSession.created_at).getTime()) < 30000;
            if (callSession.status === 'ringing' && isFresh) {
                onIncomingCall(callSession);
            }
        })
        .subscribe();
    return () => { supabase.removeChannel(channel); };
};
