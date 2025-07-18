import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Truck
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
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: any[];
}

export default function VendorDashboard() {
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    queryKey: ["/api/vendors/orders"],
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "preparing": return "bg-orange-100 text-orange-800";
      case "ready": return "bg-purple-100 text-purple-800";
      case "out_for_delivery": return "bg-indigo-100 text-indigo-800";
      case "delivered": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "confirmed": return <CheckCircle className="h-4 w-4" />;
      case "preparing": return <Package className="h-4 w-4" />;
      case "ready": return <AlertCircle className="h-4 w-4" />;
      case "out_for_delivery": return <Truck className="h-4 w-4" />;
      case "delivered": return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (!vendor) {
    return <div>Loading...</div>;
  }

  const orders = ordersData?.orders || [];
  const totalOrders = ordersData?.total || 0;
  const completedOrders = orders.filter((order: Order) => order.status === "delivered").length;
  const pendingOrders = orders.filter((order: Order) => order.status !== "delivered").length;

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
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{vendor.name}</p>
                <p className="text-xs text-gray-500">{vendor.email}</p>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <CardTitle>My Orders</CardTitle>
                <CardDescription>Orders assigned to your business</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div>Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No orders assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: Order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">Order #{order.orderNumber}</h3>
                            <p className="text-sm text-gray-600">{order.customerName} • {order.customerPhone}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">₹{order.totalAmount}</div>
                            <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">Delivery Address:</p>
                          <p className="text-sm">{order.deliveryAddress}</p>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1 capitalize">{order.status.replace("_", " ")}</span>
                            </Badge>
                            <Badge variant="outline">
                              {order.paymentStatus}
                            </Badge>
                          </div>
                          
                          <Select
                            value={order.status}
                            onValueChange={(status) => updateOrderStatusMutation.mutate({ orderId: order.id, status })}
                            disabled={updateOrderStatusMutation.isPending}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="preparing">Preparing</SelectItem>
                              <SelectItem value="ready">Ready</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
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