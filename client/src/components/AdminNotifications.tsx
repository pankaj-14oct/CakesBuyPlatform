import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, X, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface NotificationData {
  type: 'order_assigned' | 'order_updated' | 'order_cancelled' | 'connected' | 'new_order';
  orderId?: number;
  orderNumber?: string;
  message: string;
  timestamp: string;
  orderDetails?: {
    customerName: string;
    customerPhone: string;
    amount: number;
    address: string;
  };
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create alarm sound
  useEffect(() => {
    const createAlarmSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.3);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);
      
      gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    };

    if (soundEnabled) {
      audioRef.current = { play: createAlarmSound } as any;
    }
  }, [soundEnabled]);

  // Connect to WebSocket
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const connectWebSocket = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/admin?token=${token}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Admin WebSocket connected');
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const notification: NotificationData = JSON.parse(event.data);
          console.log('Received notification:', notification);
          
          if (notification.type === 'new_order') {
            setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Keep last 20
            setUnreadCount(prev => prev + 1);
            
            // Play alarm sound
            if (soundEnabled && audioRef.current) {
              // Play multiple times for urgency
              for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                  audioRef.current?.play();
                }, i * 700);
              }
            }
            
            // Show browser notification
            if (Notification.permission === 'granted') {
              new Notification('🚨 New Order Received!', {
                body: `${notification.orderNumber} from ${notification.orderDetails?.customerName} - ₹${notification.orderDetails?.amount}`,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                requireInteraction: true,
                actions: [
                  { action: 'view', title: 'View Order' }
                ]
              });
            }
            
            // Flash page title
            let flashCount = 0;
            const originalTitle = document.title;
            const flashInterval = setInterval(() => {
              document.title = flashCount % 2 === 0 ? '🚨 NEW ORDER!' : originalTitle;
              flashCount++;
              if (flashCount > 10) {
                clearInterval(flashInterval);
                document.title = originalTitle;
              }
            }, 500);
            
            // Vibrate on mobile
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
            }
          }
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Admin WebSocket disconnected');
        setIsConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('Admin WebSocket error:', error);
        setIsConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, soundEnabled]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <Card className="absolute right-0 top-full z-50 mt-2 w-96 border shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Admin Notifications</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="h-8 w-8 p-0"
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <CardDescription>
                <span className={`inline-flex items-center gap-1 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </CardDescription>
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearNotifications}>
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <div
                    key={`${notification.timestamp}-${index}`}
                    className="border-b p-4 hover:bg-accent/50 last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {notification.orderNumber}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            New Order
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.orderDetails?.customerName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ₹{notification.orderDetails?.amount}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                    </div>
                    {notification.orderDetails?.address && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {notification.orderDetails.address}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}