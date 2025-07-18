import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, Eye, Package, Truck, CheckCircle, 
  Clock, XCircle, MapPin, Phone, Calendar, UserPlus, Mail, Star, RefreshCw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Order, DeliveryBoy } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';

export default function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [vendorAssignDialogOpen, setVendorAssignDialogOpen] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
  const [orderToReassign, setOrderToReassign] = useState<Order | null>(null);
  const [orderToAssignVendor, setOrderToAssignVendor] = useState<Order | null>(null);
  const [deliveryPrice, setDeliveryPrice] = useState<string>('');
  const [vendorPrice, setVendorPrice] = useState<string>('');
  const [selectedDeliveryBoyId, setSelectedDeliveryBoyId] = useState<string>('');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const formatDeliveryTime = (time: string) => {
    switch (time) {
      case '9am-12pm': return '9:00 AM - 12:00 PM';
      case '12pm-3pm': return '12:00 PM - 3:00 PM';
      case '3pm-6pm': return '3:00 PM - 6:00 PM';
      case '6pm-9pm': return '6:00 PM - 9:00 PM';
      case '9pm-11pm': return '9:00 PM - 11:00 PM';
      case '11:30pm-12:30am': return '11:30 PM - 12:30 AM';
      // Legacy support for old slot names
      case 'slot1': return '9:00 AM - 12:00 PM';
      case 'slot2': return '12:00 PM - 3:00 PM';
      case 'slot3': return '3:00 PM - 6:00 PM';
      case 'slot4': return '6:00 PM - 9:00 PM';
      case 'midnight': return '11:30 PM - 12:30 AM';
      default: return time || 'Not specified';
    }
  };

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders', statusFilter],
  });

  // Fetch delivery boys for assignment
  const { data: deliveryBoys = [] } = useQuery<DeliveryBoy[]>({
    queryKey: ['/api/admin/delivery-boys'],
  });

  // Fetch vendors for assignment
  const { data: vendorsData } = useQuery({
    queryKey: ['/api/admin/vendors'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/vendors?page=1&limit=100', "GET", undefined, {
        "Authorization": `Bearer ${localStorage.getItem("admin_token")}`
      });
      return response.json();
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest(`/api/admin/orders/${id}/status`, 'PATCH', { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Order status updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update order status", variant: "destructive" });
    }
  });

  const assignDeliveryBoyMutation = useMutation({
    mutationFn: async ({ orderId, deliveryBoyId, deliveryPrice }: { orderId: number; deliveryBoyId: number; deliveryPrice?: string }) => {
      const payload: any = { deliveryBoyId };
      if (deliveryPrice) {
        payload.deliveryPrice = parseFloat(deliveryPrice);
      }
      const response = await apiRequest(`/api/admin/orders/${orderId}/assign`, 'POST', payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Delivery boy assigned successfully!" });
      setAssignDialogOpen(false);
      setOrderToAssign(null);
      setDeliveryPrice('');
      setSelectedDeliveryBoyId('');
    },
    onError: () => {
      toast({ title: "Failed to assign delivery boy", variant: "destructive" });
    }
  });

  const sendRatingEmailMutation = useMutation({
    mutationFn: async ({ orderId, customerEmail }: { orderId: number; customerEmail?: string }) => {
      const payload: any = {};
      if (customerEmail) {
        payload.customerEmail = customerEmail;
      }
      const response = await apiRequest(`/api/orders/${orderId}/send-rating-email`, 'POST', payload);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Rating email sent successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to send rating email", 
        description: error.message || "Please try again later.",
        variant: "destructive" 
      });
    }
  });

  const assignVendorMutation = useMutation({
    mutationFn: async ({ orderId, vendorId, vendorPrice }: { orderId: number; vendorId: number; vendorPrice: string }) => {
      const response = await apiRequest(`/api/admin/orders/${orderId}/assign-vendor`, 'PATCH', {
        vendorId,
        vendorPrice: parseFloat(vendorPrice)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Vendor assigned successfully!" });
      setVendorAssignDialogOpen(false);
      setOrderToAssignVendor(null);
      setVendorPrice('');
      setSelectedVendorId('');
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to assign vendor", 
        description: error.message || "Please try again later.",
        variant: "destructive" 
      });
    }
  });

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateOrderMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleAssignDeliveryBoy = (order: Order) => {
    setOrderToAssign(order);
    setDeliveryPrice(order.deliveryFee || '');
    setSelectedDeliveryBoyId('');
    setAssignDialogOpen(true);
  };

  const handleReassignDeliveryBoy = (order: Order) => {
    setOrderToReassign(order);
    setDeliveryPrice(order.deliveryFee || '');
    setSelectedDeliveryBoyId('');
    setReassignDialogOpen(true);
  };

  const handleAssignmentSubmit = () => {
    if (orderToAssign && selectedDeliveryBoyId) {
      assignDeliveryBoyMutation.mutate({ 
        orderId: orderToAssign.id, 
        deliveryBoyId: parseInt(selectedDeliveryBoyId),
        deliveryPrice: deliveryPrice
      });
    }
  };

  const handleReassignmentSubmit = () => {
    if (orderToReassign && selectedDeliveryBoyId) {
      assignDeliveryBoyMutation.mutate({ 
        orderId: orderToReassign.id, 
        deliveryBoyId: parseInt(selectedDeliveryBoyId),
        deliveryPrice: deliveryPrice
      });
      setReassignDialogOpen(false);
      setOrderToReassign(null);
    }
  };

  const handleAssignVendor = (order: Order) => {
    setOrderToAssignVendor(order);
    setVendorPrice(order.total || '');
    setSelectedVendorId('');
    setVendorAssignDialogOpen(true);
  };

  const handleVendorAssignmentSubmit = () => {
    if (orderToAssignVendor && selectedVendorId && vendorPrice) {
      assignVendorMutation.mutate({
        orderId: orderToAssignVendor.id,
        vendorId: parseInt(selectedVendorId),
        vendorPrice: vendorPrice
      });
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    preparing: 'bg-purple-100 text-purple-800 border-purple-200',
    out_for_delivery: 'bg-orange-100 text-orange-800 border-orange-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  };

  const statusIcons = {
    pending: Clock,
    confirmed: CheckCircle,
    preparing: Package,
    out_for_delivery: Truck,
    delivered: CheckCircle,
    cancelled: XCircle
  };

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Orders</h1>
          <p className="text-charcoal opacity-70">Manage customer orders</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
              toast({ title: "Orders refreshed!" });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload
          </Button>
        </div>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-charcoal">{orderStats.total}</div>
            <div className="text-sm text-charcoal opacity-60">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
            <div className="text-sm text-charcoal opacity-60">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{orderStats.confirmed}</div>
            <div className="text-sm text-charcoal opacity-60">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{orderStats.preparing}</div>
            <div className="text-sm text-charcoal opacity-60">Preparing</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{orderStats.out_for_delivery}</div>
            <div className="text-sm text-charcoal opacity-60">Delivery</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{orderStats.delivered}</div>
            <div className="text-sm text-charcoal opacity-60">Delivered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{orderStats.cancelled}</div>
            <div className="text-sm text-charcoal opacity-60">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Orders ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-charcoal opacity-60">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Delivery Boy</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-sm text-charcoal opacity-60">
                          {new Date(order.createdAt || '').toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.deliveryAddress.name}</p>
                        <p className="text-sm text-charcoal opacity-60">{order.deliveryAddress.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-brown">{formatPrice(order.total)}</p>
                        <p className="text-sm text-charcoal opacity-60">{order.paymentMethod}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge className={statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{new Date(order.deliveryDate).toLocaleDateString()}</p>
                        <p className="text-xs text-charcoal opacity-60">{order.deliveryTime}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {order.vendorId ? (
                          <div className="space-y-1">
                            <p className="text-sm text-purple-600 font-medium">Assigned</p>
                            <p className="text-xs text-charcoal opacity-60">ID: {order.vendorId}</p>
                            {order.vendorPrice && (
                              <p className="text-xs text-brown font-medium">Price: {formatPrice(order.vendorPrice)}</p>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-6"
                              onClick={() => handleAssignVendor(order)}
                            >
                              <Package className="h-3 w-3 mr-1" />
                              Change
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleAssignVendor(order)}
                          >
                            <Package className="h-3 w-3 mr-1" />
                            Assign
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {order.deliveryBoyId ? (
                          <div className="space-y-1">
                            <p className="text-sm text-green-600 font-medium">Assigned</p>
                            <p className="text-xs text-charcoal opacity-60">ID: {order.deliveryBoyId}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-6"
                              onClick={() => handleReassignDeliveryBoy(order)}
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Change
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleAssignDeliveryBoy(order)}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Assign
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Order Details - {order.orderNumber}</DialogTitle>
                            </DialogHeader>
                            
                            {selectedOrder && (
                              <div className="space-y-6">
                                {/* Order Status Update */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Update Status</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex items-center gap-4">
                                      <Select
                                        value={selectedOrder.status}
                                        onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                                      >
                                        <SelectTrigger className="w-48">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="confirmed">Confirmed</SelectItem>
                                          <SelectItem value="preparing">Preparing</SelectItem>
                                          <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                                          <SelectItem value="delivered">Delivered</SelectItem>
                                          <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      
                                      {selectedOrder.status === 'delivered' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => sendRatingEmailMutation.mutate({ orderId: selectedOrder.id })}
                                          disabled={sendRatingEmailMutation.isPending}
                                          className="flex items-center gap-2"
                                        >
                                          <Mail className="h-4 w-4" />
                                          {sendRatingEmailMutation.isPending ? 'Sending...' : 'Send Rating Email'}
                                        </Button>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                <div className="grid md:grid-cols-2 gap-6">
                                  {/* Customer Information */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg flex items-center">
                                        <MapPin className="mr-2 h-5 w-5" />
                                        Delivery Information
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div>
                                        <p className="font-medium">{selectedOrder.deliveryAddress.name}</p>
                                        <p className="text-sm text-charcoal opacity-70 flex items-center">
                                          <Phone className="mr-1 h-4 w-4" />
                                          {selectedOrder.deliveryAddress.phone}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm">{selectedOrder.deliveryAddress.address}</p>
                                        <p className="text-sm text-charcoal opacity-70">
                                          {selectedOrder.deliveryAddress.city} - {selectedOrder.deliveryAddress.pincode}
                                        </p>
                                        {selectedOrder.deliveryAddress.landmark && (
                                          <p className="text-sm text-charcoal opacity-70">
                                            Landmark: {selectedOrder.deliveryAddress.landmark}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center text-sm text-charcoal opacity-70">
                                        <Calendar className="mr-1 h-4 w-4" />
                                        {new Date(selectedOrder.deliveryDate).toLocaleDateString()} 
                                        ({formatDeliveryTime(selectedOrder.deliveryTime)})
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Order Summary */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">Order Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(selectedOrder.subtotal)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Delivery Fee</span>
                                        <span>{formatPrice(selectedOrder.deliveryFee || 0)}</span>
                                      </div>
                                      {parseFloat(selectedOrder.discount || '0') > 0 && (
                                        <div className="flex justify-between text-green-600">
                                          <span>Discount</span>
                                          <span>-{formatPrice(selectedOrder.discount || 0)}</span>
                                        </div>
                                      )}
                                      <div className="border-t pt-2">
                                        <div className="flex justify-between font-bold text-lg">
                                          <span>Total</span>
                                          <span className="text-brown">{formatPrice(selectedOrder.total)}</span>
                                        </div>
                                      </div>
                                      <div className="text-sm text-charcoal opacity-70">
                                        Payment: {selectedOrder.paymentMethod} • {selectedOrder.paymentStatus}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Order Items */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Order Items</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      {selectedOrder.items.map((item, index) => (
                                        <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                                          <div className="flex-1">
                                            <h4 className="font-medium">{item.name}</h4>
                                            <div className="text-sm text-charcoal opacity-70 space-y-1">
                                              <p>Weight: {item.weight} • Flavor: {item.flavor}</p>
                                              {item.customMessage && (
                                                <p>Message: "{item.customMessage}"</p>
                                              )}
                                              {item.photoCustomization?.compositeImage && (
                                                <div className="mt-3">
                                                  <p className="font-medium text-pink-600 mb-2">📸 Personalized Photo Cake:</p>
                                                  <div className="bg-white p-2 rounded border inline-block">
                                                    <iframe
                                                      src={item.photoCustomization.compositeImage}
                                                      width="200"
                                                      height="200"
                                                      className="rounded border-0"
                                                      title="Personalized cake preview"
                                                    />
                                                  </div>
                                                </div>
                                              )}
                                              {item.addons && item.addons.length > 0 && (
                                                <p>
                                                  Add-ons: {item.addons.map(addon => 
                                                    `${addon.name}${addon.customInput ? ` (${addon.customInput})` : ''} x${addon.quantity}`
                                                  ).join(', ')}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <p className="font-medium">Qty: {item.quantity}</p>
                                            <p className="text-brown font-medium">{formatPrice(item.price)}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Special Instructions */}
                                {selectedOrder.specialInstructions && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">Special Instructions</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-charcoal">{selectedOrder.specialInstructions}</p>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delivery Boy Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Delivery Boy</DialogTitle>
          </DialogHeader>
          
          {orderToAssign && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">Order: {orderToAssign.orderNumber}</h4>
                <p className="text-sm text-gray-600">
                  Customer: {orderToAssign.deliveryAddress.name} ({orderToAssign.deliveryAddress.phone})
                </p>
                <p className="text-sm text-gray-600">
                  Address: {orderToAssign.deliveryAddress.address}, {orderToAssign.deliveryAddress.city}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Delivery Price (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter delivery price"
                    value={deliveryPrice}
                    onChange={(e) => setDeliveryPrice(e.target.value)}
                    className="mt-1"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: ₹{orderToAssign.deliveryFee || '0'}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Select Delivery Boy</Label>
                  <Select
                    value={selectedDeliveryBoyId}
                    onValueChange={setSelectedDeliveryBoyId}
                    disabled={assignDeliveryBoyMutation.isPending}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a delivery boy" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryBoys.filter(db => db.isActive).map((deliveryBoy) => (
                        <SelectItem key={deliveryBoy.id} value={deliveryBoy.id.toString()}>
                          {deliveryBoy.name} - {deliveryBoy.vehicleType} ({deliveryBoy.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setAssignDialogOpen(false)}
                    disabled={assignDeliveryBoyMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignmentSubmit}
                    disabled={assignDeliveryBoyMutation.isPending || !selectedDeliveryBoyId}
                    className="bg-caramel hover:bg-caramel/80"
                  >
                    {assignDeliveryBoyMutation.isPending ? 'Assigning...' : 'Assign'}
                  </Button>
                </div>
              </div>
              
              {deliveryBoys.filter(db => db.isActive).length === 0 && (
                <p className="text-sm text-red-600">
                  No active delivery boys available. Please activate delivery boys first.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delivery Boy Reassignment Dialog */}
      <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Delivery Boy</DialogTitle>
          </DialogHeader>
          
          {orderToReassign && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">Order: {orderToReassign.orderNumber}</h4>
                <p className="text-sm text-gray-600">
                  Customer: {orderToReassign.deliveryAddress.name} ({orderToReassign.deliveryAddress.phone})
                </p>
                <p className="text-sm text-gray-600">
                  Address: {orderToReassign.deliveryAddress.address}, {orderToReassign.deliveryAddress.city}
                </p>
                <p className="text-sm text-orange-600 font-medium">
                  Currently assigned to: Delivery Boy ID {orderToReassign.deliveryBoyId}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Delivery Price (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter delivery price"
                    value={deliveryPrice}
                    onChange={(e) => setDeliveryPrice(e.target.value)}
                    className="mt-1"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: ₹{orderToReassign.deliveryFee || '0'}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Select New Delivery Boy</Label>
                  <Select
                    value={selectedDeliveryBoyId}
                    onValueChange={setSelectedDeliveryBoyId}
                    disabled={assignDeliveryBoyMutation.isPending}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a delivery boy" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryBoys.filter(db => db.isActive).map((deliveryBoy) => (
                        <SelectItem key={deliveryBoy.id} value={deliveryBoy.id.toString()}>
                          {deliveryBoy.name} - {deliveryBoy.vehicleType} ({deliveryBoy.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setReassignDialogOpen(false)}
                    disabled={assignDeliveryBoyMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReassignmentSubmit}
                    disabled={assignDeliveryBoyMutation.isPending || !selectedDeliveryBoyId}
                    className="bg-caramel hover:bg-caramel/80"
                  >
                    {assignDeliveryBoyMutation.isPending ? 'Reassigning...' : 'Reassign'}
                  </Button>
                </div>
              </div>
              
              {deliveryBoys.filter(db => db.isActive).length === 0 && (
                <p className="text-sm text-red-600">
                  No active delivery boys available. Please activate delivery boys first.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Vendor Assignment Dialog */}
      <Dialog open={vendorAssignDialogOpen} onOpenChange={setVendorAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Order to Vendor</DialogTitle>
          </DialogHeader>
          
          {orderToAssignVendor && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">Order Details</h3>
                <p className="text-sm text-gray-600">Order: {orderToAssignVendor.orderNumber}</p>
                <p className="text-sm text-gray-600">Total: {formatPrice(orderToAssignVendor.total)}</p>
                <p className="text-sm text-gray-600">Customer: {orderToAssignVendor.deliveryAddress.name}</p>
              </div>
              
              <div>
                <Label htmlFor="vendor-select">Select Vendor</Label>
                <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorsData?.vendors?.filter((vendor: any) => vendor.isActive && vendor.isVerified).map((vendor: any) => (
                      <SelectItem key={vendor.id} value={vendor.id.toString()}>
                        {vendor.name} - {vendor.businessName} ({vendor.phone})
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="vendor-price">Vendor Price (₹)</Label>
                <Input
                  id="vendor-price"
                  type="number"
                  value={vendorPrice}
                  onChange={(e) => setVendorPrice(e.target.value)}
                  placeholder="Enter price for vendor"
                  className="mt-1"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the price the vendor will receive for this order
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setVendorAssignDialogOpen(false)}
                  disabled={assignVendorMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVendorAssignmentSubmit}
                  disabled={assignVendorMutation.isPending || !selectedVendorId || !vendorPrice}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {assignVendorMutation.isPending ? 'Assigning...' : 'Assign Vendor'}
                </Button>
              </div>
            </div>
          )}
          
          {(!vendorsData?.vendors || vendorsData.vendors.filter((vendor: any) => vendor.isActive && vendor.isVerified).length === 0) && (
            <p className="text-sm text-red-600">
              No active and verified vendors available. Please activate and verify vendors first.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}