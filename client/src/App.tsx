
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useCall } from './context/CallContext';
import { AppLayout } from './layouts/AppLayout';
import { IntroAnimation } from './components/IntroAnimation';
import { VideoCall } from './components/VideoCall';
import { IncomingCallModal } from './components/IncomingCallModal';
import { OutgoingCallModal } from './components/OutgoingCallModal';
import { Loader2 } from 'lucide-react';

// Lazy load all pages for code splitting (production optimization)
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Matches = lazy(() => import('./pages/Matches').then(m => ({ default: m.Matches })));
const Chat = lazy(() => import('./pages/Chat').then(m => ({ default: m.Chat })));
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));
const VirtualDate = lazy(() => import('./pages/VirtualDate').then(m => ({ default: m.VirtualDate })));
const CinemaDate = lazy(() => import('./pages/virtual-dates/CinemaDate').then(m => ({ default: m.CinemaDate })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Developers = lazy(() => import('./pages/Developers').then(m => ({ default: m.Developers })));
const Confessions = lazy(() => import('./pages/Confessions').then(m => ({ default: m.Confessions })));

// Static pages lazy loaded individually
const About = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.About })));
const Careers = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Careers })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const Privacy = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Terms })));
const Safety = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Safety })));
const Guidelines = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Guidelines })));

// Loading spinner for lazy loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-black text-neon">
    <Loader2 className="w-10 h-10 animate-spin" />
  </div>
);


const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-neon">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const { isCallActive, appId, channelName, token, partnerName, partnerAvatar, endCall, incomingCall, outgoingCall, acceptCall, rejectCall, setOutgoingCall, callType, callSessionId } = useCall();

  useEffect(() => {
    // Check if we've already shown intro this session (optional, here we show it every refresh for effect as requested)
    // const hasShown = sessionStorage.getItem('hasShownIntro');
    // if (hasShown) setShowIntro(false);
  }, []);

  const handleIntroComplete = () => {
    // sessionStorage.setItem('hasShownIntro', 'true');
    setShowIntro(false);
  };

  if (showIntro) {
    return <IntroAnimation onComplete={handleIntroComplete} />;
  }

  return (
    <>
      {/* Video/Audio Call Overlay */}
      {isCallActive && appId && channelName && token && (
        <VideoCall
          appId={appId}
          channelName={channelName}
          token={token}
          onLeave={endCall}
          partnerName={partnerName}
          partnerAvatar={partnerAvatar}
          callType={callType}
          callSessionId={callSessionId}
        />
      )}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          callerName={incomingCall.callerName}
          callerAvatar={incomingCall.callerAvatar}
          onAccept={acceptCall}
          onReject={rejectCall}
          isVideoCall={incomingCall.callType === 'video'}
        />
      )}

      {/* Outgoing Call Modal */}
      {outgoingCall && (
        <OutgoingCallModal
          receiverName={outgoingCall.receiverName}
          receiverAvatar={outgoingCall.receiverAvatar}
          onCancel={() => setOutgoingCall(null)}
          isVideoCall={outgoingCall.callType === 'video'}
        />
      )}

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/developers" element={<Developers />} />

          {/* Static Pages */}
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/guidelines" element={<Guidelines />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/home" element={<Home />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/virtual-date" element={<VirtualDate />} />
            <Route path="/virtual-date/cinema" element={<CinemaDate />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/confessions" element={<Confessions />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
