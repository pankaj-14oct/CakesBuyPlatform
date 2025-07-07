import { useEffect, useRef, useState } from 'react';
import { useToast } from './use-toast';
import { notificationManager } from '@/utils/notificationManager';

interface NotificationData {
  type: 'order_assigned' | 'order_updated' | 'order_cancelled' | 'connected';
  orderId?: number;
  orderNumber?: string;
  message: string;
  timestamp: string;
}

export function useDeliveryNotifications(token?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/delivery?token=${encodeURIComponent(token)}`;

    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected for delivery notifications');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const notification: NotificationData = JSON.parse(event.data);
            console.log('Received notification:', notification);
            
            setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50 notifications

            // Show toast for new order assignments
            if (notification.type === 'order_assigned') {
              toast({
                title: "🚨 URGENT: New Order Assigned!",
                description: `Order ${notification.orderNumber} has been assigned to you. ACTION REQUIRED!`,
                duration: 20000,
                variant: "destructive",
              });

              // Use enhanced notification manager with ringtone-style alerts
              notificationManager.showOrderNotification({
                orderNumber: notification.orderNumber || 'Unknown',
                customerName: 'Customer', // Extract from notification if available
                amount: 0, // Extract from notification if available
                address: 'Delivery Address' // Extract from notification if available
              });

              // Legacy fallback for backward compatibility
              setTimeout(() => playNotificationSound(), 100);
              setTimeout(() => playNotificationSound(), 3000);
              setTimeout(() => playNotificationSound(), 6000);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          setIsConnected(false);
          
          // Reconnect after 3 seconds if not intentionally closed
          if (event.code !== 1000) {
            setTimeout(connect, 3000);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setTimeout(connect, 5000);
      }
    };

    connect();

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000);
      }
    };
  }, [token, toast]);

  const playNotificationSound = async () => {
    try {
      // Use the enhanced sound system from testSound utility
      const { testNotificationSound } = await import('@/utils/testSound');
      await testNotificationSound();
      
    } catch (error) {
      console.log('Enhanced sound system failed, using simple fallback:', error);
      
      // Simple fallback
      try {
        const audio = new Audio();
        audio.volume = 1.0;
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMhBSuJw/LPeysKIXHD8N2QSQAZS57k7a5UGR9tgNMr';
        await audio.play();
        
        // Intense vibration on mobile
        if ('vibrate' in navigator) {
          navigator.vibrate([500, 100, 500, 100, 500, 100, 500]);
        }
        
      } catch (fallbackError) {
        console.log('All audio failed, vibration only:', fallbackError);
        if ('vibrate' in navigator) {
          navigator.vibrate([600, 150, 600, 150, 600, 150, 600]);
        }
      }
    }
  };

  const markAllAsRead = () => {
    setNotifications([]);
  };

  return {
    isConnected,
    notifications,
    unreadCount: notifications.filter(n => n.type === 'order_assigned').length,
    markAllAsRead
  };
}