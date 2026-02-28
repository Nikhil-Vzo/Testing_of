import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PresenceProvider } from './context/PresenceContext';
import { CallProvider } from './context/CallContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// 🎨 Custom Console Message
console.log(
  `%c
   ___  _   _        _   _       _  __  __ 
  / _ \\| |_| |_  _ _| | | |__ _ | |/ _|/ _|
 | (_) |  _| ' \\| '_| |_| / _\` || |  _|  _|
  \\___/ \\__|_||_|_| |___|_\\__,_||_|_| |_|  
                                             
`,
  'color: #ff007f; font-weight: bold; font-size: 14px;'
);

console.log(
  '%c💘 Find your OthrHalff — where anonymous meets destiny.',
  'color: #ff007f; font-size: 13px; font-weight: bold; padding: 8px 0;'
);

console.log(
  '%c⚠️ STOP!',
  'color: #ff4444; font-size: 20px; font-weight: bold;'
);

console.log(
  '%cThis is a browser feature intended for developers. If someone told you to copy-paste something here, it is likely a scam. Do NOT paste any code here.',
  'color: #ffaa00; font-size: 13px; padding: 4px 0;'
);

console.log(
  '%c🔒 Your data is encrypted and secure. We never store passwords.',
  'color: #888; font-size: 11px; font-style: italic;'
);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <PresenceProvider>
            <CallProvider>
              <ToastProvider>
                <NotificationProvider>
                  <App />
                </NotificationProvider>
              </ToastProvider>
            </CallProvider>
          </PresenceProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// Register Service Worker for PWA support (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
