
import React, { createContext, useContext, useState } from 'react';
import { CallType } from '../types';

interface CallContextType {
  isCallActive: boolean;
  callType: CallType;
  remoteName: string;
  startCall: (type: CallType, name: string) => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<CallType>(CallType.VIDEO);
  const [remoteName, setRemoteName] = useState('');

  const startCall = (type: CallType, name: string) => {
    setCallType(type);
    setRemoteName(name);
    setIsCallActive(true);
  };

  const endCall = () => {
    setIsCallActive(false);
    setRemoteName('');
  };

  return (
    <CallContext.Provider value={{ isCallActive, callType, remoteName, startCall, endCall }}>
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
