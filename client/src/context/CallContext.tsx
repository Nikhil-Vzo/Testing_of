import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToIncomingCalls, CallSession, answerCall as answerCallAPI, rejectCall as rejectCallAPI, endCall as endCallAPI } from '../services/callSignaling';
import { supabase } from '../lib/supabase';

interface IncomingCall {
  callSessionId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  channelName: string;
  token: string;
  appId: string;
  callType: 'audio' | 'video';
}

interface CallContextType {
  isCallActive: boolean;
  appId: string;
  channelName: string;
  token: string;
  partnerName: string;
  partnerAvatar: string;
  callType: 'audio' | 'video';
  callSessionId: string;
  incomingCall: IncomingCall | null;
  outgoingCall: { receiverName: string; receiverAvatar: string; callType: 'audio' | 'video' } | null;
  startCall: (name: string, avatar: string, appId: string, channelName: string, token: string, type: 'audio' | 'video', sessionId: string) => void;
  endCall: () => void;
  acceptCall: () => void;
  rejectCall: () => void;
  setOutgoingCall: (call: { receiverName: string; receiverAvatar: string; callType: 'audio' | 'video' } | null) => void;
  outgoingCallSessionId: string;
  setOutgoingCallSessionId: (id: string) => void;
  cancelOutgoingCall: () => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [appId, setAppId] = useState('');
  const [channelName, setChannelName] = useState('');
  const [token, setToken] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerAvatar, setPartnerAvatar] = useState('');
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<{ receiverName: string; receiverAvatar: string; callType: 'audio' | 'video' } | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [callSessionId, setCallSessionId] = useState('');
  const [outgoingCallSessionId, setOutgoingCallSessionId] = useState('');
  const pendingAcceptRef = useRef(false); // Queues accept if tapped before session ID arrives

  // Refs for latest state (used in subscription callbacks to avoid stale closures)
  const isCallActiveRef = useRef(false);
  const incomingCallRef = useRef<IncomingCall | null>(null);
  const outgoingCallRef = useRef<typeof outgoingCall>(null);

  // Keep refs in sync
  useEffect(() => { isCallActiveRef.current = isCallActive; }, [isCallActive]);
  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);
  useEffect(() => { outgoingCallRef.current = outgoingCall; }, [outgoingCall]);

  // Auto-accept when session ID arrives after user already tapped Accept
  useEffect(() => {
    if (pendingAcceptRef.current && incomingCall?.callSessionId) {
      console.log('[CallContext] Session ID arrived, auto-accepting queued call');
      pendingAcceptRef.current = false;
      acceptCall();
    }
  }, [incomingCall]);

  // Subscribe to incoming calls
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToIncomingCalls(currentUser.id, async (payload: any) => {
      // === BUSY STATE: Ignore new calls if user is already on a call or has an incoming call ===
      const isBusy = isCallActiveRef.current || incomingCallRef.current !== null || outgoingCallRef.current !== null;

      // Handle Broadcast (Optimistic)
      if (payload.isBroadcast) {
        console.log('[CallContext] Received broadcast signal:', payload);
        if (isBusy) {
          console.log('[CallContext] User is busy, ignoring broadcast signal');
          return;
        }
        setIncomingCall({
          callSessionId: '', // Placeholder, will be updated by DB
          callerId: payload.id,
          callerName: payload.name,
          callerAvatar: payload.avatar,
          channelName: '', // Not ready yet
          token: '', // Not ready yet
          appId: '', // Not ready yet
          callType: payload.callType || 'video'
        });
        return;
      }

      // Handle DB Insert (Official)
      const callSession = payload as CallSession;

      // If we already have the broadcast state, update it with real data
      // Fetch caller profile (only if we don't trust broadcast or need more data)
      // Actually, we can just use the DB data to hydrate the session ID and Token

      // Fetch caller profile to be safe/consistent
      const { supabase } = await import('../lib/supabase');
      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('real_name, anonymous_id, avatar')
        .eq('id', callSession.caller_id)
        .single();

      if (callerProfile) {
        // Check if this is just the official DB record for the broadcast we already received
        // We know it's the same call if we have a pending broadcast from the same caller
        const isDuplicateMsg =
          incomingCallRef.current &&
          incomingCallRef.current.callerId === callSession.caller_id &&
          !incomingCallRef.current.callSessionId; // Broadcast has no sessionId yet

        // If user is busy (on a call, has incoming, or making outgoing), AND it's not the same call
        if (isBusy && !isDuplicateMsg) {
          console.log('[CallContext] User is busy, auto-rejecting call session:', callSession.id);
          await rejectCallAPI(callSession.id);
          return;
        }

        setIncomingCall(prev => ({
          callSessionId: callSession.id,
          callerId: callSession.caller_id,
          callerName: callerProfile.real_name || callerProfile.anonymous_id,
          callerAvatar: callerProfile.avatar,
          channelName: callSession.channel_name,
          token: callSession.token,
          appId: callSession.app_id,
          callType: callSession.call_type || 'video'
        }));

        // Auto-reject after 30 seconds + send missed call notification
        callTimeoutRef.current = setTimeout(async () => {
          const callerName = callerProfile?.real_name || callerProfile?.anonymous_id || 'Someone';
          const callTypeLabel = callSession.call_type === 'audio' ? 'voice' : 'video';

          handleRejectCall(callSession.id);

          // 1. Insert notification into DB (shows in Notifications page)
          try {
            await supabase.from('notifications').insert({
              user_id: currentUser!.id,
              from_user_id: callSession.caller_id,
              type: 'system',
              title: `📞 Missed ${callTypeLabel} call`,
              message: `You missed a ${callTypeLabel} call from ${callerName}`,
              read: false
            });
          } catch (err) {
            console.error('[CallContext] Failed to insert missed call notification:', err);
          }

          // 2. Browser notification (if permissions granted)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Missed ${callTypeLabel} call`, {
              body: `${callerName} tried to call you`,
              icon: callerProfile?.avatar || '/favicon.png',
              tag: `missed-call-${callSession.id}`
            });
          }
        }, 30000);
      }
    });

    return () => {
      unsubscribe();
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
    };
  }, [currentUser]);

  const startCall = (name: string, avatar: string, appIdParam: string, channelNameParam: string, tokenParam: string, type: 'audio' | 'video' = 'video', sessionId: string) => {
    setPartnerName(name);
    setPartnerAvatar(avatar);
    setAppId(appIdParam);
    setChannelName(channelNameParam);
    setToken(tokenParam);
    setCallType(type);
    setCallSessionId(sessionId);
    setIsCallActive(true);
    setOutgoingCall(null); // Clear outgoing call modal
  };

  const endCall = () => {
    setIsCallActive(false);
    setAppId('');
    setChannelName('');
    setToken('');
    setPartnerName('');
    setPartnerAvatar('');
    setCallSessionId('');
    setOutgoingCall(null);
    setOutgoingCallSessionId('');
  };

  // Cancel outgoing call — clears UI AND updates DB
  const cancelOutgoingCall = async () => {
    if (outgoingCallSessionId) {
      await endCallAPI(outgoingCallSessionId);
    }
    setOutgoingCall(null);
    setOutgoingCallSessionId('');
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    // If we only have broadcast signal but no DB session yet,
    // QUEUE the accept — it will auto-fire when session data arrives.
    if (!incomingCall.callSessionId) {
      console.log('[CallContext] Accept queued, waiting for session ID...');
      pendingAcceptRef.current = true;
      return;
    }

    // Clear timeout
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    // Update database
    await answerCallAPI(incomingCall.callSessionId);

    // Start the call
    startCall(
      incomingCall.callerName,
      incomingCall.callerAvatar,
      incomingCall.appId,
      incomingCall.channelName,
      incomingCall.token,
      incomingCall.callType,
      incomingCall.callSessionId
    );

    setIncomingCall(null);
  };

  const handleRejectCall = async (callSessionId: string) => {
    // If we only have broadcast signal but no DB session yet
    if (!callSessionId) {
      setIncomingCall(null);
      return;
    }

    // Clear timeout
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    // Update database
    await rejectCallAPI(callSessionId);

    pendingAcceptRef.current = false;
    setIncomingCall(null);
  };

  const rejectCallWrapper = () => {
    if (incomingCall) {
      handleRejectCall(incomingCall.callSessionId);
    }
  };

  return (
    <CallContext.Provider
      value={{
        isCallActive,
        appId,
        channelName,
        token,
        partnerName,
        partnerAvatar,
        callType,
        callSessionId,
        incomingCall,
        outgoingCall,
        outgoingCallSessionId,
        setOutgoingCallSessionId,
        cancelOutgoingCall,
        startCall,
        endCall,
        acceptCall,
        rejectCall: rejectCallWrapper,
        setOutgoingCall
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
