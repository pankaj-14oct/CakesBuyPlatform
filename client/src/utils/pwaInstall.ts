// PWA Installation utilities for delivery app

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAInstaller {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;

  constructor() {
    this.init();
  }

  private init() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      console.log('PWA install prompt available');
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
    });

    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.isInstalled = true;
      this.deferredPrompt = null;
    });

    // Check if running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }
  }

  async showInstallPrompt(): Promise<{ success: boolean; error?: string }> {
    if (!this.deferredPrompt) {
      return { 
        success: false, 
        error: 'Install prompt not available. App may already be installed or browser does not support PWA installation.' 
      };
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted PWA install');
        this.deferredPrompt = null;
        return { success: true };
      } else {
        console.log('User dismissed PWA install');
        return { success: false, error: 'User declined installation' };
      }
    } catch (error) {
      console.error('PWA install failed:', error);
      return { success: false, error: 'Installation failed' };
    }
  }

  canInstall(): boolean {
    return this.deferredPrompt !== null && !this.isInstalled;
  }

  isAppInstalled(): boolean {
    return this.isInstalled;
  }

  getInstallInstructions(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && userAgent.includes('mobile')) {
      return 'Tap the menu (⋮) and select "Add to Home screen" or "Install app"';
    } else if (userAgent.includes('safari') && userAgent.includes('mobile')) {
      return 'Tap the Share button and select "Add to Home Screen"';
    } else if (userAgent.includes('chrome')) {
      return 'Click the install button in the address bar or use Chrome menu > Install CakesBuy Delivery';
    } else if (userAgent.includes('firefox')) {
      return 'Look for the install prompt or check the address bar for install option';
    } else {
      return 'Look for "Add to Home Screen" or "Install App" option in your browser menu';
    }
  }
}

export const pwaInstaller = new PWAInstaller();

// Push notification utilities
export class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null;

  async initialize(): Promise<{ success: boolean; error?: string }> {
    if (!('serviceWorker' in navigator)) {
      return { success: false, error: 'Service Workers not supported' };
    }

    if (!('PushManager' in window)) {
      return { success: false, error: 'Push notifications not supported' };
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);
      return { success: true };
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return { success: false, error: 'Service Worker registration failed' };
    }
  }

  async requestPermission(): Promise<{ granted: boolean; error?: string }> {
    if (!('Notification' in window)) {
      return { granted: false, error: 'Notifications not supported' };
    }

    if (Notification.permission === 'granted') {
      return { granted: true };
    }

    if (Notification.permission === 'denied') {
      return { 
        granted: false, 
        error: 'Notifications are blocked. Please enable them in browser settings.' 
      };
    }

    try {
      const permission = await Notification.requestPermission();
      return { granted: permission === 'granted' };
    } catch (error) {
      return { granted: false, error: 'Failed to request notification permission' };
    }
  }

  async subscribeToPushNotifications(): Promise<{ success: boolean; subscription?: PushSubscription; error?: string }> {
    if (!this.registration) {
      return { success: false, error: 'Service Worker not registered' };
    }

    try {
      const permissionResult = await this.requestPermission();
      if (!permissionResult.granted) {
        return { success: false, error: permissionResult.error };
      }

      // Check if already subscribed
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe to push notifications
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            // VAPID public key - you would generate this on your server
            'BEl62iUYgUivxIkv69yViEuiBIa40HI0' +
            'DLHeV2NF7hqgwSqIZfIGnK-gSiUBqr4w' +
            'xQrmNKr3-SLZvg2WK1s8ZA' // This is a placeholder - generate real VAPID keys
          )
        });
      }

      return { success: true, subscription };
    } catch (error) {
      console.error('Push subscription failed:', error);
      return { success: false, error: 'Failed to subscribe to push notifications' };
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Send test push notification (for development)
  async sendTestNotification(): Promise<{ success: boolean; error?: string }> {
    if (!this.registration) {
      return { success: false, error: 'Service Worker not registered' };
    }

    try {
      await this.registration.showNotification('🚚 Test Order Assignment!', {
        body: 'This is a test notification for CakesBuy Delivery app',
        icon: '/delivery-icon-192.svg',
        badge: '/delivery-icon-192.svg',
        tag: 'test-notification',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        actions: [
          {
            action: 'view',
            title: 'View Orders'
          }
        ]
      });
      return { success: true };
    } catch (error) {
      console.error('Test notification failed:', error);
      return { success: false, error: 'Failed to send test notification' };
    }
  }
}

export const pushNotificationManager = new PushNotificationManager();