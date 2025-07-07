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
              setTimeout(() => playNotificationSound(), 100); // Small delay to ensure audio context is ready
              
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

  const playNotificationSound = async () => {
    try {
      // Resume audio context if suspended (required by modern browsers)
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Create multiple tones for a more attention-grabbing alarm
      const playTone = (frequency: number, startTime: number, duration: number, volume: number = 0.5) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine'; // Sine wave for clearer sound
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration - 0.05);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const currentTime = audioContext.currentTime;
      
      // Play a sequence of alarm tones (like a doorbell)
      playTone(800, currentTime + 0.1, 0.3, 0.6);    // First ding
      playTone(600, currentTime + 0.5, 0.4, 0.6);    // Second dong
      playTone(800, currentTime + 1.0, 0.3, 0.5);    // Third ding
      
    } catch (error) {
      console.log('Web Audio API failed, trying HTML5 Audio:', error);
      
      // Enhanced fallback with multiple sounds
      try {
        // Create multiple beep sounds
        const playBeep = (frequency: number, duration: number, delay: number = 0) => {
          setTimeout(() => {
            const audio = new Audio();
            audio.volume = 0.7;
            
            // Create a simple sine wave beep
            const audioData = `data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMhBSuJw/LPeysKIXHD8N2QSQAZS57k7a5UGR9tgNMr`;
            audio.src = audioData;
            audio.play().catch(() => {
              // Final fallback: system alert sound
              try {
                const audio2 = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMhBSuJw/LPeysKIXHD8N2QSQAZS57k7a5UGR9tgNMr');
                audio2.volume = 1.0;
                audio2.play();
              } catch (e) {
                console.log('All audio fallbacks failed, using vibration');
              }
            });
          }, delay);
        };
        
        // Play multiple beeps with different timing
        playBeep(800, 300, 0);
        playBeep(600, 400, 400);
        playBeep(800, 300, 900);
        
        // Vibrate on mobile devices
        if ('vibrate' in navigator) {
          navigator.vibrate([300, 100, 400, 100, 300]);
        }
        
      } catch (fallbackError) {
        console.log('All sound fallbacks failed:', fallbackError);
        
        // Last resort: just vibrate if possible
        if ('vibrate' in navigator) {
          navigator.vibrate([500, 200, 500, 200, 500]);
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