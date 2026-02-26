import { useState, useEffect } from 'react';

// Detect iOS Safari (iPhone, iPad, iPod)
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
};

const isInStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
};

// Check if PWA is already installed using getInstalledRelatedApps API
const checkIfInstalled = async () => {
  // Check localStorage first (fallback for browsers without API)
  if (localStorage.getItem('pwaInstalled')) {
    return true;
  }

  // Use getInstalledRelatedApps API if available (Chrome/Edge)
  if ('getInstalledRelatedApps' in navigator) {
    try {
      const relatedApps = await navigator.getInstalledRelatedApps();
      if (relatedApps.length > 0) {
        localStorage.setItem('pwaInstalled', 'true');
        return true;
      }
    } catch (e) {
      // API not supported or failed
    }
  }

  return false;
};

export default function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    const initBanner = async () => {
      // Check if already dismissed, installed, or running as PWA
      const wasDismissed = localStorage.getItem('pwaInstallDismissed');
      const isInstalled = await checkIfInstalled();

      if (wasDismissed || isInstalled || isInStandaloneMode()) {
        return;
      }

      const iosDevice = isIOS();
      setIsIOSDevice(iosDevice);

      // For iOS, show banner after a short delay (no beforeinstallprompt event)
      if (iosDevice) {
        setTimeout(() => {
          if (!localStorage.getItem('pwaInstallDismissed') && !localStorage.getItem('pwaInstalled')) {
            setShowBanner(true);
          }
        }, 3000);
        return;
      }

      // For other browsers, check if install prompt is available
      if (window.isPWAInstallAvailable?.()) {
        setShowBanner(true);
      }
    };

    initBanner();

    // Listen for the custom event from main.jsx
    const handleInstallAvailable = async () => {
      const isInstalled = await checkIfInstalled();
      if (!localStorage.getItem('pwaInstallDismissed') && !isInstalled) {
        setShowBanner(true);
      }
    };

    const handleInstalled = () => {
      setShowBanner(false);
      localStorage.setItem('pwaInstalled', 'true');
    };

    window.addEventListener('pwaInstallAvailable', handleInstallAvailable);
    window.addEventListener('pwaInstalled', handleInstalled);

    return () => {
      window.removeEventListener('pwaInstallAvailable', handleInstallAvailable);
      window.removeEventListener('pwaInstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOSDevice) {
      // Show iOS-specific instructions
      setShowIOSInstructions(true);
    } else if (window.showPWAInstallPrompt) {
      const result = await window.showPWAInstallPrompt();
      if (result.outcome === 'accepted') {
        setShowBanner(false);
        localStorage.setItem('pwaInstalled', 'true'); // Remember installation
      }
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSInstructions(false);
    localStorage.setItem('pwaInstallDismissed', 'true');
  };

  if (!showBanner) {
    return null;
  }

  // iOS Instructions Modal
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm animate-slide-up">
          <div className="p-5">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-gray-900">Install Nexus</h3>
              <button onClick={handleDismiss} className="text-gray-400 p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 text-sm mb-5">
              Install this app on your iPhone for quick access and <strong>push notifications</strong>:
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="text-sm text-gray-800">
                    Tap the <span className="inline-flex items-center">
                      <svg className="w-5 h-5 text-blue-500 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </span> Share button at the bottom of Safari
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="text-sm text-gray-800">
                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="text-sm text-gray-800">
                    Tap <strong>"Add"</strong> to install the app
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 p-4">
            <button
              onClick={handleDismiss}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default Install Banner
  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">Install Nexus App</p>
          <p className="text-xs text-gray-500 truncate">
            {isIOSDevice ? 'Add to your home screen' : 'Quick access from your home screen'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={handleInstall}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {isIOSDevice ? 'How?' : 'Install'}
          </button>
        </div>
      </div>
    </div>
  );
}
