import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PushNotificationManagerProps {
  deliveryBoyToken: string;
}

export default function PushNotificationManager({ deliveryBoyToken }: PushNotificationManagerProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
    setPermission(Notification.permission);
    
    // Check current subscription status
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported on this device",
        variant: "destructive"
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: "Permission Granted",
          description: "You can now receive background notifications",
        });
        return true;
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications to receive order alerts when app is closed",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive"
      });
      return false;
    }
  };

  const subscribeToNotifications = async () => {
    setIsLoading(true);
    
    try {
      // Request permission first
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setIsLoading(false);
          return;
        }
      }

      // Get VAPID public key
      const vapidResponse = await fetch('/api/delivery/push/vapid-key');
      const { publicKey } = await vapidResponse.json();

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Save subscription to backend
      const response = await fetch('/api/delivery/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deliveryBoyToken}`
        },
        body: JSON.stringify({ subscription })
      });

      if (response.ok) {
        setIsSubscribed(true);
        toast({
          title: "Background Notifications Enabled",
          description: "You'll now receive order alerts even when the app is closed",
        });
      } else {
        throw new Error('Failed to save subscription');
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      toast({
        title: "Subscription Failed",
        description: "Failed to enable background notifications",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromNotifications = async () => {
    setIsLoading(true);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove subscription from backend
      const response = await fetch('/api/delivery/push/unsubscribe', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${deliveryBoyToken}`
        }
      });

      if (response.ok) {
        setIsSubscribed(false);
        toast({
          title: "Background Notifications Disabled",
          description: "You'll only receive notifications when the app is open",
        });
      } else {
        throw new Error('Failed to remove subscription');
      }
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      toast({
        title: "Unsubscribe Failed",
        description: "Failed to disable background notifications",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = () => {
    if (permission === 'granted') {
      new Notification('🚚 Test Notification', {
        body: 'This is how order alerts will appear when the app is closed',
        icon: '/delivery-icon-192.svg',
        badge: '/delivery-icon-192.svg',
        vibrate: [200, 100, 200]
      });
    }
  };

  // Helper function to convert VAPID key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Background Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported on this device
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Background Notifications
          </div>
          <Badge variant={isSubscribed ? "default" : "secondary"}>
            {isSubscribed ? "Enabled" : "Disabled"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Receive order alerts even when the app is closed or minimized
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Smartphone className="h-4 w-4" />
          <span>Permission: {permission}</span>
        </div>
        
        <div className="flex gap-2">
          {!isSubscribed ? (
            <Button
              onClick={subscribeToNotifications}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Enabling..." : "Enable Background Alerts"}
            </Button>
          ) : (
            <Button
              onClick={unsubscribeFromNotifications}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? "Disabling..." : "Disable Background Alerts"}
            </Button>
          )}
          
          {permission === 'granted' && (
            <Button
              onClick={testNotification}
              variant="outline"
              size="sm"
            >
              Test
            </Button>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          Background notifications work even when:
          <ul className="list-disc list-inside mt-1 ml-2">
            <li>App is closed or minimized</li>
            <li>Browser is closed (if PWA is installed)</li>
            <li>Device screen is locked</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}