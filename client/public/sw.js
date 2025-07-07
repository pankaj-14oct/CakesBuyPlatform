// Service Worker for background notifications
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'New order assignment',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    tag: 'order-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Order',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    data: {
      url: '/delivery/dashboard'
    }
  };

  event.waitUntil(
    self.registration.showNotification('🚚 New Order Assignment!', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    event.waitUntil(
      clients.openWindow('/delivery/dashboard')
    );
  }
});

self.addEventListener('install', function(event) {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});