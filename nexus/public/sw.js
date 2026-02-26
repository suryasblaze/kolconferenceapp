// Service Worker for Nexus PWA - Push Notifications Only (No Caching)
// Caching disabled to avoid issues with Supabase API requests on mobile

// Install - take over immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate - claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Clear any old caches from previous versions
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => clients.claim())
  );
});

// No fetch handler - let browser handle ALL requests normally
// This prevents any interference with Supabase API calls

// Push notification handler
self.addEventListener('push', (event) => {
  let data = { title: 'Nexus', body: 'You have a notification' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/logo-icon.png',
    badge: '/logo-icon.png',
    tag: data.tag || 'nexus-notification',
    data: {
      meetingId: data.meetingId,
      url: data.url || '/'
    },
    requireInteraction: data.urgent || false,
    vibrate: data.urgent ? [200, 100, 200, 100, 200] : [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const meetingId = event.notification.data?.meetingId;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            if (meetingId) {
              client.postMessage({
                type: 'OPEN_MEETING',
                meetingId: meetingId
              });
            }
            return;
          }
        }
        return clients.openWindow('/');
      })
  );
});

