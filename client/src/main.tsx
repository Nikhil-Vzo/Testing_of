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

// Capture PWA install prompt GLOBALLY (fires before React mounts, only once)
// Store on window so any component can access it
(window as any).__pwaInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).__pwaInstallPrompt = e;
  console.log('[PWA] Install prompt captured');
});



console.log(
  '%cOthrHalff',
  'color: #ff007f; font-size: 24px; font-weight: 900; letter-spacing: -1px; text-shadow: 0 0 10px rgba(255,0,127,0.3);'
);

console.log(
  '%c💘 Where anonymous meets destiny.',
  'color: #ff007f; font-size: 13px; font-weight: bold; padding: 4px 0;'
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
