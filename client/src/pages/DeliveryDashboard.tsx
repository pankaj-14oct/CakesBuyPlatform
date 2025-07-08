import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Truck, 
  Package, 
  Clock, 
  MapPin, 
  Phone, 
  Star,
  LogOut,
  CheckCircle,
  Navigation,
  XCircle,
  Wallet,
  Bell,
  BellRing,
  BarChart3,
  History,
  TrendingUp,
  Calendar,
  Award,
  Target,
  Download,
  Smartphone
} from "lucide-react";
import { useDeliveryNotifications } from "@/hooks/useDeliveryNotifications";
import { testNotificationSound } from "@/utils/testSound";
import { notificationManager } from "@/utils/notificationManager";
import { pwaInstaller, pushNotificationManager } from "@/utils/pwaInstall";
import PushNotificationManager from "@/components/PushNotificationManager";

interface DeliveryBoy {
  id: number;
  name: string;
  phone: string;
  vehicleType: string;
  rating: string;
}

interface Order {
  id: number;
  orderNumber: string;
  deliveryAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
    landmark?: string;
  };
  total: string | number;
  deliveryFee: string | number;
  status: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryOccasion?: string;
  specialInstructions?: string;
  paymentMethod?: string;
  items: Array<{
    name: string;
    quantity: number;
    weight: string;
    flavor?: string;
  }>;
}

interface DeliveryStats {
  totalOrders: number;
  deliveredOrders: number;
  totalEarnings: string;
  averageRating: number;
  monthlyDeliveries: number;
  monthlyEarnings: string;
  weeklyDeliveries: number;
  successRate: string;
  avgDeliveryTime: string;
  onTimeDeliveryRate: string;
}

export default function DeliveryDashboard() {
  const [, setLocation] = useLocation();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [orderToReject, setOrderToReject] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPWAInstall, setShowPWAInstall] = useState(false);
  const [pwaInstallStatus, setPwaInstallStatus] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deliveryBoy, setDeliveryBoy] = useState<DeliveryBoy | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('delivery_token');
    const user = localStorage.getItem('delivery_user');
    
    if (!token || !user) {
      setLocation('/delivery/login');
      return;
    }
    
    try {
      setDeliveryBoy(JSON.parse(user));
    } catch {
      setLocation('/delivery/login');
    }

    // Initialize PWA and push notifications
    initializePWA();
  }, [setLocation]);

  const initializePWA = async () => {
    // Check if PWA can be installed
    setTimeout(() => {
      if (pwaInstaller.canInstall() && !pwaInstaller.isAppInstalled()) {
        setShowPWAInstall(true);
      }
    }, 5000); // Show after 5 seconds

    // Initialize push notifications
    const pushResult = await pushNotificationManager.initialize();
    if (pushResult.success) {
      console.log('Push notifications initialized');
    }
  };

  // Initialize notification system
  const deliveryToken = localStorage.getItem('delivery_token');
  const { isConnected, notifications, unreadCount, markAllAsRead } = useDeliveryNotifications(deliveryToken || undefined);

  // Fetch assigned orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/delivery/orders'],
    enabled: !!deliveryBoy
  });

  // Fetch profile data
  const { data: profile } = useQuery({
    queryKey: ['/api/delivery/profile'],
    enabled: !!deliveryBoy
  });

  // Fetch delivery stats
  const { data: stats } = useQuery<DeliveryStats>({
    queryKey: ['/api/delivery/stats'],
    enabled: !!deliveryBoy
  });

  // Fetch order history
  const { data: orderHistory } = useQuery<{orders: Order[], pagination: any}>({
    queryKey: ['/api/delivery/order-history'],
    enabled: !!deliveryBoy && activeTab === 'history'
  });

  // Initialize audio context and notification system
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const audioContext = new AudioContext();
          if (audioContext.state === 'suspended') {
            const unlockAudio = async () => {
              await audioContext.resume();
              console.log('Audio context unlocked for notifications');
            };
            document.addEventListener('click', unlockAudio, { once: true });
            document.addEventListener('touchstart', unlockAudio, { once: true });
          }
        }
      } catch (error) {
        console.log('Audio context initialization failed:', error);
      }
    };
    
    const initNotifications = async () => {
      try {
        await notificationManager.requestPermission();
        console.log('Notification manager initialized');
      } catch (error) {
        console.log('Notification manager initialization failed:', error);
      }
    };
    
    initializeAudio();
    initNotifications();
  }, []);

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      return apiRequest(`/api/delivery/orders/${orderId}/status`, 'PATCH', { status });
    },
    onSuccess: () => {
      // Invalidate both orders and stats to refresh earnings
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/order-history'] });
      toast({
        title: 'Status Updated',
        description: 'Order status updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order status',
        variant: 'destructive'
      });
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('delivery_token');
    localStorage.removeItem('delivery_user');
    setLocation('/delivery/login');
  };

  const handleInstallPWA = async () => {
    const result = await pwaInstaller.showInstallPrompt();
    if (result.success) {
      setShowPWAInstall(false);
      toast({
        title: "App Installed!",
        description: "CakesBuy Delivery has been installed successfully. You can now access it from your home screen.",
        duration: 5000,
      });
    } else {
      toast({
        title: "Installation Failed",
        description: result.error || "Failed to install the app",
        variant: "destructive",
      });
    }
  };

  const handleEnablePushNotifications = async () => {
    const result = await pushNotificationManager.subscribeToPushNotifications();
    if (result.success) {
      toast({
        title: "Notifications Enabled!",
        description: "You'll now receive push notifications for new orders even when the app is closed.",
        duration: 5000,
      });
    } else {
      toast({
        title: "Notification Setup Failed",
        description: result.error || "Failed to enable push notifications",
        variant: "destructive",
      });
    }
  };

  const sendTestPushNotification = async () => {
    const result = await pushNotificationManager.sendTestNotification();
    if (result.success) {
      toast({
        title: "Test Notification Sent",
        description: "Check your device for the test notification",
      });
    } else {
      toast({
        title: "Test Failed",
        description: result.error || "Failed to send test notification",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = (orderId: number, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };

  const rejectOrderMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: number; reason: string }) => {
      return apiRequest(`/api/delivery/orders/${orderId}/reject`, 'POST', { reason });
    },
    onSuccess: () => {
      // Invalidate all relevant queries when order is rejected
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/order-history'] });
      setRejectDialogOpen(false);
      setOrderToReject(null);
      setRejectionReason('');
      toast({
        title: "Success",
        description: "Order rejected and will be reassigned",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject order",
        variant: "destructive",
      });
    },
  });

  const handleRejectOrder = (orderId: number) => {
    setOrderToReject(orderId);
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = () => {
    if (orderToReject && rejectionReason.trim()) {
      rejectOrderMutation.mutate({ orderId: orderToReject, reason: rejectionReason });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDeliverySlot = (slot: string) => {
    switch (slot) {
      case 'slot1': return '9:00 AM - 12:00 PM';
      case 'slot2': return '12:00 PM - 3:00 PM';
      case 'slot3': return '3:00 PM - 6:00 PM';
      case 'slot4': return '6:00 PM - 9:00 PM';
      case 'midnight': return '11:30 PM - 12:30 AM';
      default: return slot;
    }
  };

  if (!deliveryBoy) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PWA Install Banner */}
      {showPWAInstall && (
        <div className="bg-caramel text-white p-3 relative">
          <div className="flex items-center justify-between max-w-7xl mx-auto px-4">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5" />
              <div>
                <p className="text-sm font-medium">Install CakesBuy Delivery App</p>
                <p className="text-xs opacity-90">Get instant notifications and offline access</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleInstallPWA}
                className="text-caramel bg-white hover:bg-gray-100"
              >
                <Download className="h-4 w-4 mr-1" />
                Install
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPWAInstall(false)}
                className="text-white hover:bg-white/20"
              >
                ×
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Header */}
      <div className="bg-caramel text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <Truck className="h-6 w-6" />
              <div>
                <h1 className="text-lg sm:text-xl font-semibold">Delivery Dashboard</h1>
                <p className="text-sm opacity-90">Welcome, {deliveryBoy.name}</p>
                <p className="text-xs opacity-75">Total Earnings: ₹{profile?.totalEarnings || '0'}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              {/* Notification Status */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded">
                  {isConnected ? (
                    <>
                      <BellRing className="h-4 w-4 text-green-300" />
                      <span className="text-xs">Connected</span>
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4 text-yellow-300" />
                      <span className="text-xs">Offline</span>
                    </>
                  )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const result = await notificationManager.testNotification();
                        toast({
                          title: result.success ? "🔔 Notification Test" : "⚠️ Partial Success",
                          description: result.success 
                            ? (result.error 
                                ? `Sound and vibration working! Note: ${result.error}` 
                                : "Perfect! You should hear sound, feel vibration, and see a notification!")
                            : result.error || "Test failed",
                          variant: result.success ? "default" : "destructive",
                          duration: 7000,
                        });
                      } catch (error) {
                        console.error('Test failed:', error);
                        toast({
                          title: "❌ Test Failed",
                          description: "Could not test notification system",
                          variant: "destructive",
                          duration: 3000,
                        });
                      }
                    }}
                    className="text-xs text-white border-white/30 bg-white/10 hover:bg-white/20 hover:text-white flex-1 sm:flex-none"
                  >
                    <BellRing className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      notificationManager.stopRingtone();
                      toast({
                        title: "🔇 Stopped",
                        description: "Notification sounds stopped",
                        duration: 2000,
                      });
                    }}
                    className="text-xs text-white border-white/30 bg-white/10 hover:bg-white/20 hover:text-white flex-1 sm:flex-none"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Stop
                  </Button>
                </div>
                
                {unreadCount > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={markAllAsRead}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 animate-pulse shadow-lg ring-2 ring-red-400 ring-opacity-50 w-full sm:w-auto"
                  >
                    🔔 {unreadCount} New Order{unreadCount > 1 ? 's' : ''}
                  </Button>
                )}
              </div>
              
              <Button 
                variant="secondary" 
                onClick={handleLogout} 
                className="bg-white text-caramel hover:bg-gray-100 w-full sm:w-auto"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
              <Truck className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Statistics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
              <History className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Order History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
              <Smartphone className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">App Settings</span>
              <span className="sm:hidden">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">{orders.length}</div>
              <div className="text-xs sm:text-sm text-gray-600">Total Orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-2xl font-bold text-orange-600">
                {orders.filter(o => o.status === 'out_for_delivery').length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Out for Delivery</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-600">
                {orders.filter(o => o.status === 'delivered').length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Delivered</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">
                {orders.filter(o => o.status === 'confirmed' || o.status === 'preparing').length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Ready for Pickup</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-600">₹{stats?.totalEarnings || '0'}</div>
              <div className="text-xs sm:text-sm text-gray-600">Total Earnings</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Profile Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="bg-caramel text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold">
                      {deliveryBoy.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold">{deliveryBoy.name}</h3>
                  <p className="text-sm text-gray-600">{deliveryBoy.phone}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Vehicle</span>
                    <span className="text-sm font-medium capitalize">{deliveryBoy.vehicleType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Rating</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">{deliveryBoy.rating}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Deliveries</span>
                    <span className="text-sm font-medium">{stats?.deliveredOrders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Earnings</span>
                    <div className="flex items-center">
                      <Wallet className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm font-medium text-green-600">₹{stats?.totalEarnings || '0'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Section */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Your Assigned Orders ({orders.length})
                </CardTitle>
                <CardDescription>
                  Manage your delivery orders and update their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No orders assigned to you yet</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="space-y-2">
                    {orders.map((order) => (
                      <AccordionItem key={order.id} value={order.id.toString()} className="border border-gray-200 rounded-lg">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                          <div className="flex justify-between items-center w-full">
                            <div className="flex items-center space-x-4">
                              <div className="text-left">
                                <h3 className="font-semibold text-lg">#{order.orderNumber}</h3>
                                <div className="text-sm space-y-1">
                                  <p className="text-green-600 font-medium">Total: ₹{order.total} | Fee: ₹{order.deliveryFee || '0'}</p>
                                  <p className="text-gray-600">{order.deliveryAddress.name} • {order.paymentMethod?.toUpperCase() || 'COD'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        
                        <AccordionContent className="px-4 pb-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">#{order.orderNumber}</h3>
                              <div className="text-sm space-y-1">
                                <p className="text-green-600 font-medium">Order Total: ₹{order.total}</p>
                                <p className="text-blue-600 font-medium">Delivery Fee: ₹{order.deliveryFee || '0'}</p>
                                <p className="text-gray-600">Payment: {order.paymentMethod?.toUpperCase() || 'COD'}</p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h4 className="font-medium mb-2">Customer Details</h4>
                              <div className="space-y-1 text-sm">
                                <p className="flex items-center">
                                  <span className="text-gray-600 mr-2">Name:</span>
                                  {order.deliveryAddress.name}
                                </p>
                                <p className="flex items-center">
                                  <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                  {order.deliveryAddress.phone}
                                </p>
                                <p className="flex items-start">
                                  <MapPin className="h-3 w-3 mr-2 text-gray-400 mt-0.5" />
                                  <span className="text-gray-600">
                                    {typeof order.deliveryAddress === 'string' 
                                      ? order.deliveryAddress 
                                      : `${order.deliveryAddress.address}, ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}`
                                    }
                                  </span>
                                </p>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Delivery Details</h4>
                              <div className="space-y-1 text-sm">
                                <p className="flex items-center">
                                  <Clock className="h-3 w-3 mr-2 text-gray-400" />
                                  <span className="font-medium text-blue-600">
                                    {new Date(order.deliveryDate).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </p>
                                <p className="flex items-center">
                                  <Clock className="h-3 w-3 mr-2 text-gray-400" />
                                  <span className="font-medium text-orange-600">
                                    {formatDeliverySlot(order.deliveryTime)}
                                  </span>
                                </p>
                                {order.deliveryOccasion && (
                                  <p className="text-gray-600">
                                    Occasion: {order.deliveryOccasion}
                                  </p>
                                )}
                                {order.specialInstructions && (
                                  <p className="text-gray-600">
                                    Instructions: {order.specialInstructions}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Order Items</h4>
                            <div className="space-y-1">
                              {order.items.map((item, index) => (
                                <p key={index} className="text-sm text-gray-600">
                                  {item.quantity}x {item.name} ({item.weight})
                                </p>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            {/* Status Update Actions */}
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                              <h5 className="font-medium text-sm mb-3 text-blue-800">Order Status Management:</h5>
                              
                              {/* Current Status Display */}
                              <div className="mb-3">
                                <span className="text-xs text-gray-600">Current Status:</span>
                                <Badge className={`ml-2 ${getStatusColor(order.status)}`}>
                                  {order.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 flex-wrap">
                                {/* New Orders - Ready for Pickup */}
                                {(order.status === 'confirmed' || order.status === 'preparing') && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleStatusUpdate(order.id, 'out_for_delivery')}
                                      disabled={updateStatusMutation.isPending}
                                      className="bg-orange-600 hover:bg-orange-700 text-white"
                                    >
                                      <Navigation className="h-4 w-4 mr-1" />
                                      Pick Up & Start Delivery
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRejectOrder(order.id)}
                                      disabled={updateStatusMutation.isPending}
                                      className="border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject Order
                                    </Button>
                                  </>
                                )}
                                
                                {/* Out for Delivery - Multiple Status Options */}
                                {order.status === 'out_for_delivery' && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleStatusUpdate(order.id, 'delivered')}
                                      disabled={updateStatusMutation.isPending}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Mark Delivered
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                                      disabled={updateStatusMutation.isPending}
                                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                    >
                                      <Package className="h-4 w-4 mr-1" />
                                      Return to Store
                                    </Button>
                                  </>
                                )}
                                
                                {/* Delivered Orders - Option to Mark as Issues */}
                                {order.status === 'delivered' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusUpdate(order.id, 'out_for_delivery')}
                                    disabled={updateStatusMutation.isPending}
                                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                  >
                                    <Navigation className="h-4 w-4 mr-1" />
                                    Mark as Out for Delivery
                                  </Button>
                                )}

                                {/* Help Text for Delivery Process */}
                                {order.status === 'confirmed' || order.status === 'preparing' ? (
                                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                    📦 Order is ready for pickup. Click "Pick Up & Start Delivery" when you collect it from the store.
                                  </div>
                                ) : order.status === 'out_for_delivery' ? (
                                  <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                                    🚚 You're on the way! Click "Mark Delivered" when you complete the delivery.
                                  </div>
                                ) : null}

                                {order.status === 'delivered' && (
                                  <div className="text-green-600 font-medium text-sm flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Order Completed Successfully
                                  </div>
                                )}

                                {order.status === 'cancelled' && (
                                  <div className="text-red-600 font-medium text-sm flex items-center">
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Order Cancelled
                                  </div>
                                )}
                              </div>

                              {/* Status Update Loading */}
                              {updateStatusMutation.isPending && (
                                <div className="mt-2 text-sm text-blue-600">
                                  Updating status...
                                </div>
                              )}
                            </div>

                            {/* Contact Actions */}
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(`tel:${order.deliveryAddress.phone}`, '_self')}
                              >
                                <Phone className="h-4 w-4 mr-1" />
                                Call Customer
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(
                                  typeof order.deliveryAddress === 'string' 
                                    ? order.deliveryAddress 
                                    : `${order.deliveryAddress.address}, ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}`
                                )}`, '_blank')}
                              >
                                <MapPin className="h-4 w-4 mr-1" />
                                Navigate
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            {stats && (
              <>
                {/* Performance Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                          <p className="text-2xl font-bold text-blue-600">{stats.deliveredOrders}</p>
                        </div>
                        <Package className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                          <p className="text-2xl font-bold text-green-600">₹{stats.totalEarnings}</p>
                        </div>
                        <Wallet className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Average Rating</p>
                          <p className="text-2xl font-bold text-yellow-600">{stats.averageRating}</p>
                        </div>
                        <Star className="h-8 w-8 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Success Rate</p>
                          <p className="text-2xl font-bold text-purple-600">{stats.successRate}%</p>
                        </div>
                        <Target className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly & Weekly Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        This Month
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Deliveries</span>
                        <span className="font-semibold text-lg">{stats.monthlyDeliveries}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Earnings</span>
                        <span className="font-semibold text-lg text-green-600">₹{stats.monthlyEarnings}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">This Week Deliveries</span>
                        <span className="font-semibold text-lg">{stats.weeklyDeliveries}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Avg Delivery Time</span>
                        <span className="font-semibold text-lg">{stats.avgDeliveryTime}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">On-Time Rate</span>
                        <span className="font-semibold text-lg text-green-600">{stats.onTimeDeliveryRate}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Achievement Badges */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="h-5 w-5 mr-2" />
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {stats.deliveredOrders >= 10 && (
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <p className="text-sm font-medium">10+ Deliveries</p>
                        </div>
                      )}
                      {parseFloat(stats.successRate) >= 90 && (
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <p className="text-sm font-medium">High Success Rate</p>
                        </div>
                      )}
                      {stats.averageRating >= 4.5 && (
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                          <p className="text-sm font-medium">Top Rated</p>
                        </div>
                      )}
                      {stats.monthlyDeliveries >= 15 && (
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <p className="text-sm font-medium">Monthly Hero</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Order History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Order History
                </CardTitle>
                <CardDescription>
                  View all your completed and past deliveries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orderHistory?.orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No delivery history found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderHistory?.orders.map((order) => (
                      <Card key={order.id} className="border-l-4 border-l-gray-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Badge className={getStatusColor(order.status)}>
                                  {order.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <span className="font-medium">#{order.orderNumber}</span>
                              </div>
                              
                              <div className="text-sm text-gray-600">
                                <p className="font-medium">
                                  {typeof order.deliveryAddress === 'string' 
                                    ? order.deliveryAddress 
                                    : order.deliveryAddress.name}
                                </p>
                                <p>
                                  {typeof order.deliveryAddress === 'string' 
                                    ? '' 
                                    : `${order.deliveryAddress.address}, ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}`}
                                </p>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {new Date(order.deliveryDate).toLocaleDateString()}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {formatDeliverySlot(order.deliveryTime)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-semibold text-lg">₹{order.total}</p>
                              <p className="text-sm text-green-600">
                                Delivery Fee: ₹{order.deliveryFee}
                              </p>
                            </div>
                          </div>
                          
                          {/* Order Items */}
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                            <div className="space-y-1">
                              {order.items.map((item, index) => (
                                <div key={index} className="text-sm text-gray-600">
                                  {item.quantity}x {item.name} ({item.weight})
                                  {item.flavor && ` - ${item.flavor}`}
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5" />
                  <span>Mobile App Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure your delivery app for the best mobile experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Push Notifications */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Background Notifications</h3>
                  <PushNotificationManager deliveryBoyToken={deliveryBoyToken || ""} />
                </div>

                {/* PWA Installation */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Install Mobile App</h3>
                  <p className="text-sm text-gray-600">
                    Install CakesBuy Delivery as a mobile app for better performance and offline access.
                  </p>
                  
                  <div className="flex flex-col space-y-2">
                    {pwaInstaller.isAppInstalled() ? (
                      <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">App is installed!</span>
                      </div>
                    ) : pwaInstaller.canInstall() ? (
                      <Button onClick={handleInstallPWA} className="w-full sm:w-auto">
                        <Download className="h-4 w-4 mr-2" />
                        Install App
                      </Button>
                    ) : (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-2">Manual Installation</p>
                        <p className="text-xs text-blue-700">
                          {pwaInstaller.getInstallInstructions()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Push Notifications */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Push Notifications</h3>
                  <p className="text-sm text-gray-600">
                    Enable push notifications to receive order alerts even when the app is closed.
                  </p>
                  
                  <div className="space-y-2">
                    <Button
                      onClick={handleEnablePushNotifications}
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Enable Push Notifications
                    </Button>
                    
                    <Button
                      onClick={sendTestPushNotification}
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      <BellRing className="h-4 w-4 mr-2" />
                      Test Push Notification
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* App Features */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">App Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Bell className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Real-time Notifications</p>
                        <p className="text-xs text-gray-600">Get instant alerts for new orders</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Navigation className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Offline Access</p>
                        <p className="text-xs text-gray-600">View orders even without internet</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Star className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium">Performance Tracking</p>
                        <p className="text-xs text-gray-600">Monitor your delivery statistics</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Smartphone className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium">Native App Feel</p>
                        <p className="text-xs text-gray-600">Works like a native mobile app</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Troubleshooting */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Troubleshooting</h3>
                  <div className="space-y-2">
                    <details className="p-3 bg-gray-50 rounded-lg">
                      <summary className="text-sm font-medium cursor-pointer">
                        Not receiving notifications?
                      </summary>
                      <div className="mt-2 text-xs text-gray-600">
                        <p>1. Check if notifications are enabled in your browser/device settings</p>
                        <p>2. Make sure the app is installed as a PWA</p>
                        <p>3. Try the "Test Push Notification" button above</p>
                      </div>
                    </details>
                    
                    <details className="p-3 bg-gray-50 rounded-lg">
                      <summary className="text-sm font-medium cursor-pointer">
                        App not working offline?
                      </summary>
                      <div className="mt-2 text-xs text-gray-600">
                        <p>1. Make sure the app is installed as a PWA</p>
                        <p>2. Try refreshing the page while online</p>
                        <p>3. Check if your browser supports PWA features</p>
                      </div>
                    </details>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Order Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please provide a reason for rejecting this order. The order will be unassigned and made available for reassignment.
            </p>
            
            <div>
              <Label htmlFor="rejection-reason">Reason for Rejection</Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., Vehicle breakdown, personal emergency, unable to deliver to location..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectionReason('');
                }}
                disabled={rejectOrderMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectSubmit}
                disabled={rejectOrderMutation.isPending || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {rejectOrderMutation.isPending ? 'Rejecting...' : 'Reject Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}