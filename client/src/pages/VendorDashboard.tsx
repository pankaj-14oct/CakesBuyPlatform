import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Store, 
  Package, 
  TrendingUp, 
  Users, 
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  ZoomIn,
  Eye,
  RefreshCw,
  Calendar,
  CalendarDays
} from "lucide-react";

interface VendorInfo {
  id: number;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  address?: string;
  description?: string;
  isActive: boolean;
  isVerified: boolean;
}

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  totalAmount: string;
  vendorPrice?: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  deliveryDate?: string;
  deliveryTime?: string;
  items: any[];
}

export default function VendorDashboard() {
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState<string>('all');

  const formatDeliveryTime = (slot: string) => {
    switch (slot) {
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
      default: return slot;
    }
  };

  useEffect(() => {
    const vendorToken = localStorage.getItem("vendor_token");
    const vendorInfo = localStorage.getItem("vendor_info");
    
    if (!vendorToken || !vendorInfo) {
      navigate("/vendor-login");
      return;
    }
    
    setVendor(JSON.parse(vendorInfo));
  }, [navigate]);

  const { data: vendorData } = useQuery({
    queryKey: ["/api/vendors/me"],
    queryFn: async () => {
      const response = await apiRequest("/api/vendors/me", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("vendor_token")}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch vendor info");
      }
      
      return response.json();
    },
    enabled: !!vendor
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/vendors/orders", dateFilter],
    queryFn: async () => {
      const response = await apiRequest("/api/vendors/orders", "GET", undefined, {
        "Authorization": `Bearer ${localStorage.getItem("vendor_token")}`
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      
      return response.json();
    },
    enabled: !!vendor
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await apiRequest(`/api/vendors/orders/${orderId}/status`, "PATCH", { status }, {
        "Authorization": `Bearer ${localStorage.getItem("vendor_token")}`
      });
      
      if (!response.ok) {
        throw new Error("Failed to update order status");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Order status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("vendor_token");
    localStorage.removeItem("vendor_info");
    navigate("/vendor-login");
  };

  // Date filtering function
  const filterOrdersByDate = (orders: OrderInfo[]) => {
    if (!orders || dateFilter === 'all') return orders;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return orders.filter(order => {
      const orderDate = new Date(order.deliveryDate);
      const orderDateString = orderDate.toDateString();
      
      switch (dateFilter) {
        case 'today':
          return orderDateString === today.toDateString();
        case 'tomorrow':
          return orderDateString === tomorrow.toDateString();
        case 'custom':
          // For custom date, we'll need to implement date picker
          return true;
        default:
          return true;
      }
    });
  };

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case 'today':
        return 'Today\'s Orders';
      case 'tomorrow':
        return 'Tomorrow\'s Orders';
      case 'custom':
        return 'Custom Date Orders';
      default:
        return 'All Orders';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "preparing": return "bg-orange-100 text-orange-800";
      case "out_for_delivery": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "confirmed": return <CheckCircle className="h-4 w-4" />;
      case "preparing": return <Package className="h-4 w-4" />;
      case "out_for_delivery": return <Truck className="h-4 w-4" />;
      case "delivered": return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (!vendor) {
    return <div>Loading...</div>;
  }

  const orders = ordersData?.orders || [];
  const filteredOrders = filterOrdersByDate(orders);
  const totalOrders = ordersData?.total || 0;
  const completedOrders = filteredOrders.filter((order: Order) => order.status === "delivered").length;
  const pendingOrders = filteredOrders.filter((order: Order) => order.status !== "delivered").length;

  // Calculate date-based statistics
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysOrders = orders.filter(order => {
    const orderDate = new Date(order.deliveryDate);
    return orderDate.toDateString() === today.toDateString();
  });

  const tomorrowsOrders = orders.filter(order => {
    const orderDate = new Date(order.deliveryDate);
    return orderDate.toDateString() === tomorrow.toDateString();
  });

  // Calculate revenue
  const todaysRevenue = todaysOrders.reduce((sum, order) => sum + parseFloat(order.vendorPrice || order.totalAmount || 0), 0);
  const tomorrowsRevenue = tomorrowsOrders.reduce((sum, order) => sum + parseFloat(order.vendorPrice || order.totalAmount || 0), 0);
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.vendorPrice || order.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Store className="h-8 w-8 text-caramel-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Vendor Dashboard</h1>
                  <p className="text-sm text-gray-600">{vendor.businessName}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Date Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Filter:</label>
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Orders</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                </select>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{vendor.name}</p>
                <p className="text-xs text-gray-500">{vendor.email}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/vendors/orders"] });
                  toast({ title: "Orders refreshed!" });
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date-based Order Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Today's Orders</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{todaysOrders.length}</div>
              <p className="text-xs text-blue-700 mt-1">
                Revenue: ₹{todaysRevenue.toFixed(0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Tomorrow's Orders</CardTitle>
              <CalendarDays className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{tomorrowsOrders.length}</div>
              <p className="text-xs text-green-700 mt-1">
                Revenue: ₹{tomorrowsRevenue.toFixed(0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">₹{totalRevenue.toFixed(0)}</div>
              <p className="text-xs text-purple-700 mt-1">
                From {totalOrders} orders
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vendor.isActive ? (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>My Orders</span>
                  <span className="text-sm font-normal text-gray-500">({getDateFilterLabel()})</span>
                </CardTitle>
                <CardDescription>
                  Orders assigned to your business
                  {dateFilter !== 'all' && (
                    <span className="ml-2 text-blue-600 font-medium">
                      - Showing {filteredOrders.length} of {orders.length} orders
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div>Loading orders...</div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {dateFilter === 'all' ? 'No orders assigned yet' : `No orders found for ${getDateFilterLabel().toLowerCase()}`}
                    </p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="space-y-2">
                    {filteredOrders.map((order: Order) => (
                      <AccordionItem key={order.id} value={`order-${order.id}`} className="border rounded-lg">
                        <AccordionTrigger className="hover:no-underline px-4 py-3">
                          <div className="flex items-center justify-between w-full mr-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(order.status)}
                                <span className="font-medium">#{order.orderNumber}</span>
                              </div>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-6 text-sm">
                              <div className="text-right">
                                <div className="font-medium">{order.customerName}</div>
                                <div className="text-gray-500">{order.customerPhone}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-green-600">₹{order.vendorPrice || order.totalAmount}</div>
                                <div className="text-gray-500 text-xs">Revenue</div>
                              </div>
                              <div className="text-right">
                                <div className="text-gray-600">{new Date(order.deliveryDate || order.createdAt).toLocaleDateString()}</div>
                                <div className="text-gray-500 text-xs">
                                  {order.deliveryTime ? formatDeliveryTime(order.deliveryTime) : 'Standard'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Customer Information */}
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <h4 className="font-semibold text-blue-900 mb-2">Customer Details</h4>
                              <div className="space-y-1 text-sm">
                                <div><span className="font-medium">Name:</span> {order.customerName}</div>
                                <div><span className="font-medium">Phone:</span> {order.customerPhone}</div>
                                <div><span className="font-medium">Order Date:</span> {new Date(order.createdAt).toLocaleDateString()}</div>
                              </div>
                            </div>

                            {/* Delivery Information */}
                            <div className="bg-green-50 p-3 rounded-lg">
                              <h4 className="font-semibold text-green-900 mb-2">Delivery Info</h4>
                              <div className="space-y-1 text-sm">
                                <div><span className="font-medium">Date:</span> {new Date(order.deliveryDate || order.createdAt).toLocaleDateString()}</div>
                                <div><span className="font-medium">Time:</span> {order.deliveryTime ? formatDeliveryTime(order.deliveryTime) : 'Standard Delivery'}</div>
                                <div><span className="font-medium">Address:</span> {order.deliveryAddress}</div>
                              </div>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="mt-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Order Items ({order.items?.length || 0})</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {order.items && order.items.length > 0 ? (
                                order.items.map((item: any, index: number) => (
                                  <div key={index} className="bg-gray-50 p-3 rounded-lg border">
                                    <div className="flex gap-3">
                                      {/* Product Image */}
                                      <div className="flex-shrink-0">
                                        {item.images && item.images.length > 0 ? (
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <div className="relative cursor-pointer group">
                                                <img 
                                                  src={item.images[0]} 
                                                  alt={item.cakeName || item.name}
                                                  className="w-12 h-12 object-cover rounded border hover:opacity-90 transition-opacity"
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded flex items-center justify-center transition-all">
                                                  <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                              </div>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                              <DialogHeader>
                                                <DialogTitle>Product Image - {item.cakeName || item.name}</DialogTitle>
                                              </DialogHeader>
                                              <img 
                                                src={item.images[0]} 
                                                alt={item.cakeName || item.name}
                                                className="w-full max-h-96 object-contain rounded-lg"
                                              />
                                            </DialogContent>
                                          </Dialog>
                                        ) : (
                                          <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                                            <Package className="h-5 w-5 text-gray-400" />
                                          </div>
                                        )}
                                      </div>

                                      {/* Product Details */}
                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-medium text-sm text-gray-900 truncate">
                                          {item.cakeName || item.name}
                                        </h5>
                                        <div className="text-xs text-gray-600 space-y-1 mt-1">
                                          <div>Qty: {item.quantity}</div>
                                          {item.weight && <div>Weight: {item.weight}</div>}
                                          {item.flavor && <div>Flavor: {item.flavor}</div>}
                                          {item.addons && item.addons.length > 0 && (
                                            <div>
                                              <span className="font-medium">Addons:</span>
                                              <div className="mt-1">
                                                {item.addons.map((addon: any, addonIndex: number) => (
                                                  <div key={addonIndex} className="text-xs">
                                                    • {addon.name} {addon.quantity > 1 ? `(${addon.quantity})` : ''}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-full text-center text-gray-500 py-4">
                                  No items found for this order
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status Update Section */}
                          <div className="mt-4 pt-4 border-t flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(order.status)}
                              <span className="text-sm font-medium">Current Status:</span>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Select
                                value={order.status}
                                onValueChange={(newStatus) => updateOrderStatus.mutate({ orderId: order.id, status: newStatus })}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="preparing">Preparing</SelectItem>
                                  <SelectItem value="out_for_delivery">Ready for Delivery</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>Your business information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Business Name</label>
                    <p className="text-sm text-gray-900">{vendor.businessName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Owner Name</label>
                    <p className="text-sm text-gray-900">{vendor.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{vendor.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{vendor.phone}</p>
                  </div>
                </div>
                
                {vendor.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <p className="text-sm text-gray-900">{vendor.address}</p>
                  </div>
                )}
                
                {vendor.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm text-gray-900">{vendor.description}</p>
                  </div>
                )}
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <Badge className={vendor.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {vendor.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Verified:</span>
                    <Badge className={vendor.isVerified ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                      {vendor.isVerified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}