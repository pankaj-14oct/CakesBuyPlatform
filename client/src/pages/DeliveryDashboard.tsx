import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Navigation
} from "lucide-react";

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
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  totalAmount: string;
  status: string;
  deliveryDate: string;
  deliverySlot: string;
  items: Array<{
    name: string;
    quantity: number;
    weight: string;
  }>;
}

export default function DeliveryDashboard() {
  const [, setLocation] = useLocation();
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
  }, [setLocation]);

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

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      return apiRequest(`/api/delivery/orders/${orderId}/status`, 'PATCH', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/orders'] });
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

  const handleStatusUpdate = (orderId: number, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
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
      {/* Simple Header */}
      <div className="bg-caramel text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Truck className="h-6 w-6" />
              <div>
                <h1 className="text-xl font-semibold">Delivery Dashboard</h1>
                <p className="text-sm opacity-90">Welcome, {deliveryBoy.name}</p>
              </div>
            </div>
            
            <Button variant="secondary" onClick={handleLogout} className="bg-white text-caramel hover:bg-gray-100">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                    <span className="text-sm font-medium">{profile?.totalDeliveries || 0}</span>
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
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">#{order.orderNumber}</h3>
                              <p className="text-sm text-gray-600">₹{order.totalAmount}</p>
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
                                  {order.customerName}
                                </p>
                                <p className="flex items-center">
                                  <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                  {order.customerPhone}
                                </p>
                                <p className="flex items-start">
                                  <MapPin className="h-3 w-3 mr-2 text-gray-400 mt-0.5" />
                                  <span className="text-gray-600">{order.deliveryAddress}</span>
                                </p>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Delivery Details</h4>
                              <div className="space-y-1 text-sm">
                                <p className="flex items-center">
                                  <Clock className="h-3 w-3 mr-2 text-gray-400" />
                                  {new Date(order.deliveryDate).toLocaleDateString()}
                                </p>
                                <p className="text-gray-600">
                                  Time: {formatDeliverySlot(order.deliverySlot)}
                                </p>
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

                          <div className="flex gap-2">
                            {order.status === 'confirmed' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(order.id, 'out_for_delivery')}
                                disabled={updateStatusMutation.isPending}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                <Navigation className="h-4 w-4 mr-1" />
                                Start Delivery
                              </Button>
                            )}
                            
                            {order.status === 'out_for_delivery' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(order.id, 'delivered')}
                                disabled={updateStatusMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark Delivered
                              </Button>
                            )}

                            <Button variant="outline" size="sm">
                              <Phone className="h-4 w-4 mr-1" />
                              Call Customer
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}