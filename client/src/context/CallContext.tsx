import React, { createContext, useContext, useState } from 'react';

interface CallContextType {
  isCallActive: boolean;
  roomUrl: string;
  partnerName: string;
  startCall: (name: string, roomUrl: string) => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [roomUrl, setRoomUrl] = useState('');
  const [partnerName, setPartnerName] = useState('');

  const startCall = (name: string, url: string) => {
    setPartnerName(name);
    setRoomUrl(url);
    setIsCallActive(true);
  };

  const endCall = () => {
    setIsCallActive(false);
    setRoomUrl('');
    setPartnerName('');
  };

  return (
    <CallContext.Provider value={{ isCallActive, roomUrl, partnerName, startCall, endCall }}>
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
