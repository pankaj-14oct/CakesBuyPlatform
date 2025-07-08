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
  console.log('🔔 Push notification received in service worker:', event);
  
  let notificationData = {
    title: '🚚 CakesBuy Delivery Alert',
    body: 'New order notification received',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'delivery-notification',
    requireInteraction: true,
    vibrate: [800, 300, 800, 300, 800, 300, 800],
    silent: false,
    renotify: true,
    timestamp: Date.now(),
    dir: 'ltr',
    lang: 'en',
    actions: [
      {
        action: 'view',
        title: 'Open Dashboard'
      },
      {
        action: 'dismiss',
        title: 'Later'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      console.log('📦 Push notification data:', data);
      
      notificationData = {
        ...notificationData,
        title: data.title || '🚨 URGENT: New Order Assignment!',
        body: data.body || 'You have a new delivery order assigned - CHECK NOW!',
        data: data,
        // Make notification more urgent for mobile
        requireInteraction: true,
        silent: false,
        vibrate: [1000, 500, 1000, 500, 1000, 500, 1000],
        timestamp: Date.now(),
        renotify: true
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  console.log('📢 Showing notification with data:', notificationData);

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log('✅ Notification displayed successfully');
        
        // For mobile: Play sound manually since silent: false might not work
        if (self.registration.sync) {
          // Mobile device detected, try to play sound
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'PLAY_NOTIFICATION_SOUND',
                data: notificationData.data
              });
            });
          });
        }
      })
      .catch((error) => {
        console.error('❌ Failed to show notification:', error);
        
        // Fallback: try to show a basic notification
        return self.registration.showNotification('🚚 CakesBuy Alert', {
          body: 'New order notification',
          icon: '/favicon.ico',
          vibrate: [1000, 500, 1000],
          requireInteraction: true
        });
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    console.log('🚀 Opening delivery dashboard...');
    // Open delivery dashboard
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        console.log('📱 Found', clientList.length, 'open windows');
        
        // Check if delivery dashboard is already open
        for (const client of clientList) {
          if (client.url.includes('/delivery/dashboard') && 'focus' in client) {
            console.log('✅ Focusing existing delivery dashboard');
            return client.focus();
          }
        }
        
        // Open new window if not found
        if (clients.openWindow) {
          console.log('🆕 Opening new delivery dashboard window');
          return clients.openWindow('/delivery/dashboard');
        }
      })
    );
  } else if (event.action === 'dismiss') {
    console.log('❌ Notification dismissed');
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