import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToIncomingCalls, CallSession, answerCall as answerCallAPI, rejectCall as rejectCallAPI } from '../services/callSignaling';

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

  // Subscribe to incoming calls
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToIncomingCalls(currentUser.id, async (payload: any) => {
      // Handle Broadcast (Optimistic)
      if (payload.isBroadcast) {
        console.log('[CallContext] Received broadcast signal:', payload);
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

        // Auto-reject after 30 seconds
        callTimeoutRef.current = setTimeout(() => {
          handleRejectCall(callSession.id);
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
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    // If we only have broadcast signal but no DB session yet, we can't accept
    // because we need the token and channel name from the DB session.
    if (!incomingCall.callSessionId) {
      console.log('[CallContext] Cannot accept yet, waiting for session ID...');
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
