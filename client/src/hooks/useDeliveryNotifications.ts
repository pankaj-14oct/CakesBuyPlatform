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
                duration: 15000, // Longer duration for important notifications
              });

              // Show browser notification if permission granted
              if (Notification.permission === 'granted') {
                new Notification('🔔 New Delivery Order Assigned', {
                  body: `Order ${notification.orderNumber} has been assigned to you. Check your dashboard for details.`,
                  icon: '/favicon.ico',
                  tag: `order-${notification.orderId}`,
                  requireInteraction: true, // Keep notification visible until user interacts
                });
              }

              // Play enhanced alarm notification sound
              playNotificationSound();
              
              // Flash the page title to get attention
              const originalTitle = document.title;
              let flashCount = 0;
              const flashInterval = setInterval(() => {
                document.title = flashCount % 2 === 0 ? '🔔 NEW ORDER!' : originalTitle;
                flashCount++;
                if (flashCount >= 10) { // Flash 5 times
                  clearInterval(flashInterval);
                  document.title = originalTitle;
                }
              }, 500);
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
      // Create an enhanced alarm-style notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create multiple tones for a more attention-grabbing alarm
      const playTone = (frequency: number, startTime: number, duration: number, volume: number = 0.3) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'triangle'; // Triangle wave for a more pleasant alarm sound
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const currentTime = audioContext.currentTime;
      
      // Play a sequence of alarm tones (like a bell or chime)
      playTone(800, currentTime, 0.2, 0.4);        // High tone
      playTone(600, currentTime + 0.15, 0.2, 0.3); // Medium tone
      playTone(800, currentTime + 0.3, 0.2, 0.4);  // High tone again
      playTone(600, currentTime + 0.45, 0.3, 0.3); // Medium tone longer
      
      // Optional: Add a second alarm sequence after a brief pause
      setTimeout(() => {
        try {
          const time = audioContext.currentTime;
          playTone(1000, time, 0.15, 0.35);
          playTone(750, time + 0.1, 0.15, 0.3);
          playTone(1000, time + 0.2, 0.2, 0.35);
        } catch (e) {
          console.log('Could not play second alarm sequence:', e);
        }
      }, 800);
      
    } catch (error) {
      console.log('Could not play notification sound:', error);
      
      // Fallback: Try to use a system beep or alert
      try {
        // Create a simpler sound as fallback
        const audio = new Audio();
        audio.volume = 0.5;
        // Generate a data URL for a simple beep sound
        const audioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMhBSuJw/LPeysKIXHD8N2QSQAZS57k7a5UGR9tgNMr';
        audio.src = audioData;
        audio.play().catch(() => {
          // If all else fails, at least vibrate on mobile
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
        });
      } catch (fallbackError) {
        console.log('Fallback sound also failed:', fallbackError);
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