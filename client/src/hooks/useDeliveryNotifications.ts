import { useEffect, useRef, useState } from 'react';
import { useToast } from './use-toast';

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
                title: "🚚 New Order Assigned!",
                description: `Order ${notification.orderNumber} has been assigned to you`,
                duration: 10000,
              });

              // Show browser notification if permission granted
              if (Notification.permission === 'granted') {
                new Notification('New Delivery Order', {
                  body: `Order ${notification.orderNumber} has been assigned to you`,
                  icon: '/favicon.ico',
                  tag: `order-${notification.orderId}`,
                });
              }

              // Play notification sound
              playNotificationSound();
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

  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Could not play notification sound:', error);
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