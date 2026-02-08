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
  callType: 'audio' | 'video';
  incomingCall: IncomingCall | null;
  outgoingCall: { receiverName: string; receiverAvatar: string } | null;
  startCall: (name: string, appId: string, channelName: string, token: string, type: 'audio' | 'video') => void;
  endCall: () => void;
  acceptCall: () => void;
  rejectCall: () => void;
  setOutgoingCall: (call: { receiverName: string; receiverAvatar: string } | null) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [appId, setAppId] = useState('');
  const [channelName, setChannelName] = useState('');
  const [token, setToken] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<{ receiverName: string; receiverAvatar: string } | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to incoming calls
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToIncomingCalls(currentUser.id, async (callSession: CallSession) => {
      // Fetch caller profile
      const { supabase } = await import('../lib/supabase');
      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('real_name, anonymous_id, avatar')
        .eq('id', callSession.caller_id)
        .single();

      if (callerProfile) {
        setIncomingCall({
          callSessionId: callSession.id,
          callerId: callSession.caller_id,
          callerName: callerProfile.real_name || callerProfile.anonymous_id,
          callerAvatar: callerProfile.avatar,
          channelName: callSession.channel_name,
          token: callSession.token,
          appId: callSession.app_id,
          callType: callSession.call_type || 'video'
        });

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

  const startCall = (name: string, appIdParam: string, channelNameParam: string, tokenParam: string, type: 'audio' | 'video' = 'video') => {
    setPartnerName(name);
    setAppId(appIdParam);
    setChannelName(channelNameParam);
    setToken(tokenParam);
    setCallType(type);
    setIsCallActive(true);
    setOutgoingCall(null); // Clear outgoing call modal
  };

  const endCall = () => {
    setIsCallActive(false);
    setAppId('');
    setChannelName('');
    setToken('');
    setPartnerName('');
    setOutgoingCall(null);
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

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
      incomingCall.appId,
      incomingCall.channelName,
      incomingCall.token,
      incomingCall.callType
    );

    setIncomingCall(null);
  };

  const handleRejectCall = async (callSessionId: string) => {
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
        callType,
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
