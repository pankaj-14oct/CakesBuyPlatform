// Service Worker for CakesBuy Delivery PWA
const CACHE_NAME = 'cakesbuy-delivery-v1';
const urlsToCache = [
  '/delivery/dashboard',
  '/delivery/login',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/delivery-icon-192.png',
  '/delivery-icon-512.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'CakesBuy Delivery',
    body: 'New notification received',
    icon: '/delivery-icon-192.png',
    badge: '/delivery-icon-192.png',
    tag: 'delivery-notification',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'View Orders',
        icon: '/delivery-icon-192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.title || '🚚 New Order Assignment!',
        body: data.body || 'You have a new delivery order assigned',
        data: data
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    // Open delivery dashboard
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if delivery dashboard is already open
        for (const client of clientList) {
          if (client.url.includes('/delivery/dashboard') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if not found
        if (clients.openWindow) {
          return clients.openWindow('/delivery/dashboard');
        }
      })
    );
  }
});

// Background sync for offline order updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  try {
    // Sync any pending order updates when connection is restored
    console.log('Background sync: syncing orders...');
    
    // Get pending updates from IndexedDB if any
    // This would sync any status updates made while offline
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

console.log('SW registered');