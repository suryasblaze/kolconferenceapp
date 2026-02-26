import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

// Detect iOS device
export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
}

// Check if running as installed PWA (home screen app)
export function isRunningAsPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

// Check iOS version (16.4+ required for push)
export function getIOSVersion() {
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  if (match) {
    return parseFloat(`${match[1]}.${match[2]}`);
  }
  return null;
}

export function isPushSupported() {
  // Basic support check
  const hasBasicSupport = 'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  if (!hasBasicSupport) return false;

  // iOS-specific check: must be running as PWA and iOS 16.4+
  if (isIOS()) {
    const iosVersion = getIOSVersion();
    // iOS 16.4+ required, and must be running as PWA
    if (iosVersion && iosVersion < 16.4) return false;
    if (!isRunningAsPWA()) return false;
  }

  return true;
}

// Get detailed push support info for UI
export function getPushSupportInfo() {
  const ios = isIOS();
  const pwa = isRunningAsPWA();
  const iosVersion = getIOSVersion();

  if (!ios) {
    // Non-iOS device
    return {
      supported: isPushSupported(),
      reason: isPushSupported() ? null : 'Browser does not support push notifications'
    };
  }

  // iOS device
  if (iosVersion && iosVersion < 16.4) {
    return {
      supported: false,
      reason: 'iOS 16.4 or later required for push notifications. Please update your iOS.'
    };
  }

  if (!pwa) {
    return {
      supported: false,
      reason: 'Install this app to your home screen first, then open it from there to enable notifications.',
      requiresPWA: true
    };
  }

  return {
    supported: true,
    reason: null
  };
}

export async function getPushSubscriptionStatus() {
  // Check iOS-specific requirements
  if (isIOS() && !isRunningAsPWA()) {
    return 'requires_pwa'; // iOS needs PWA install first
  }

  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription ? 'subscribed' : 'unsubscribed';
  } catch {
    return 'unsupported';
  }
}

export async function subscribeToPush() {
  // Get detailed support info for better error messages
  const supportInfo = getPushSupportInfo();

  if (!supportInfo.supported) {
    throw new Error(supportInfo.reason || 'Push notifications are not supported');
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error('VAPID public key not configured');
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied');
  }

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
  }

  const subscriptionJSON = subscription.toJSON();
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      endpoint: subscriptionJSON.endpoint,
      keys_p256dh: subscriptionJSON.keys.p256dh,
      keys_auth: subscriptionJSON.keys.auth,
      updated_at: new Date().toISOString()
    }, { onConflict: 'endpoint' });

  if (error) {
    throw new Error('Failed to save subscription: ' + error.message);
  }

  return subscription;
}

export async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);
  }
}
