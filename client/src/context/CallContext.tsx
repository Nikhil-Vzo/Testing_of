import React, { createContext, useContext, useState } from 'react';

interface CallContextType {
  isCallActive: boolean;
  appId: string;
  channelName: string;
  token: string;
  partnerName: string;
  startCall: (name: string, appId: string, channelName: string, token: string) => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [appId, setAppId] = useState('');
  const [channelName, setChannelName] = useState('');
  const [token, setToken] = useState('');
  const [partnerName, setPartnerName] = useState('');

  const startCall = (name: string, appIdParam: string, channelNameParam: string, tokenParam: string) => {
    setPartnerName(name);
    setAppId(appIdParam);
    setChannelName(channelNameParam);
    setToken(tokenParam);
    setIsCallActive(true);
  };

  const endCall = () => {
    setIsCallActive(false);
    setAppId('');
    setChannelName('');
    setToken('');
    setPartnerName('');
  };

  return (
    <CallContext.Provider value={{ isCallActive, appId, channelName, token, partnerName, startCall, endCall }}>
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
