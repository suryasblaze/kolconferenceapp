import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// PWA Install Prompt - capture the event before React loads
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Store the event so it can be triggered later
  deferredPrompt = e;
  // Dispatch custom event to notify React components
  window.dispatchEvent(new CustomEvent('pwaInstallAvailable'));
});

// Check if app is already installed
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  window.dispatchEvent(new CustomEvent('pwaInstalled'));
});

// Global function to trigger PWA install
window.showPWAInstallPrompt = async () => {
  if (!deferredPrompt) {
    return { outcome: 'unavailable' };
  }
  // Show the install prompt
  deferredPrompt.prompt();
  // Wait for the user's response
  const result = await deferredPrompt.userChoice;
  // Clear the deferred prompt
  deferredPrompt = null;
  return result;
};

// Check if PWA install is available
window.isPWAInstallAvailable = () => !!deferredPrompt;

// Check if running as installed PWA
window.isRunningAsPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // One-time cleanup of old SWs that had caching issues (v3 fix)
      const swCleanupDone = localStorage.getItem('sw_cleanup_v3');
      if (!swCleanupDone) {
        // Clear all caches from old SW versions
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
        }
        localStorage.setItem('sw_cleanup_v3', 'true');
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');

      // Force update check
      registration.update();
    } catch (e) {
      // Silent fail
    }
  });
}
