import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Truck, Plus, Edit, Trash2, User, Star, 
  Phone, MapPin, CheckCircle, XCircle, 
  BarChart3, Clock, Wallet, TrendingUp,
  Package, Calendar
} from 'lucide-react';
import { DeliveryBoy, Order } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const deliveryBoySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  vehicleType: z.enum(['bike', 'scooter', 'car'], {
    required_error: 'Please select a vehicle type',
  }),
});

type DeliveryBoyFormData = z.infer<typeof deliveryBoySchema>;

export default function AdminDelivery() {
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState<DeliveryBoy | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedForTracking, setSelectedForTracking] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch delivery boys
  const { data: deliveryBoys = [], isLoading } = useQuery<DeliveryBoy[]>({
    queryKey: ['/api/admin/delivery-boys'],
  });

  // Fetch orders for assignment
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
  });

  // Fetch specific delivery boy orders for tracking
  const { data: trackingOrders = [] } = useQuery<Order[]>({
    queryKey: ['/api/admin/delivery-boys', selectedForTracking, 'orders'],
    enabled: !!selectedForTracking,
  });

  const form = useForm<DeliveryBoyFormData>({
    resolver: zodResolver(deliveryBoySchema),
    defaultValues: {
      name: '',
      phone: '',
      password: '',
      vehicleType: 'bike',
    },
  });

  // Create delivery boy mutation
  const createMutation = useMutation({
    mutationFn: async (data: DeliveryBoyFormData) => {
      return apiRequest('/api/admin/delivery-boys', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery-boys'] });
      toast({
        title: 'Success',
        description: 'Delivery boy registered successfully',
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Create delivery boy error:', error);
      let errorMessage = 'Failed to register delivery boy';
      
      // Parse validation errors if they exist
      if (error.message.includes('Validation failed')) {
        try {
          const errorData = JSON.parse(error.message.split(': ')[1]);
          if (errorData.errors && errorData.errors.length > 0) {
            errorMessage = errorData.errors.map((e: any) => e.message).join(', ');
          }
        } catch (e) {
          // Fallback to generic message
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Update delivery boy mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DeliveryBoyFormData> }) => {
      return apiRequest(`/api/admin/delivery-boys/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery-boys'] });
      toast({
        title: 'Success',
        description: 'Delivery boy updated successfully',
      });
      setSelectedDeliveryBoy(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update delivery boy',
        variant: 'destructive',
      });
    },
  });

  // Delete delivery boy mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/delivery-boys/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery-boys'] });
      toast({
        title: 'Success',
        description: 'Delivery boy deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete delivery boy',
        variant: 'destructive',
      });
    },
  });

  // Order assignment mutation
  const assignOrderMutation = useMutation({
    mutationFn: async ({ orderId, deliveryBoyId }: { orderId: number; deliveryBoyId: number }) => {
      return apiRequest(`/api/admin/orders/${orderId}/assign`, 'POST', { deliveryBoyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({
        title: 'Success',
        description: 'Order assigned successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign order',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: DeliveryBoyFormData) => {
    if (selectedDeliveryBoy) {
      updateMutation.mutate({ id: selectedDeliveryBoy.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (deliveryBoy: DeliveryBoy) => {
    setSelectedDeliveryBoy(deliveryBoy);
    form.reset({
      name: deliveryBoy.name,
      phone: deliveryBoy.phone,
      password: '', // Don't populate password
      vehicleType: deliveryBoy.vehicleType as 'bike' | 'scooter' | 'car',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this delivery boy?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleStatus = (deliveryBoy: DeliveryBoy) => {
    updateMutation.mutate({
      id: deliveryBoy.id,
      data: { isActive: !deliveryBoy.isActive }
    });
  };

  const unassignedOrders = orders.filter(order => !order.deliveryBoyId && order.status !== 'delivered' && order.status !== 'cancelled');

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const getDeliveryBoyStats = (deliveryBoyId: number) => {
    const deliveryBoyOrders = orders.filter(order => order.deliveryBoyId === deliveryBoyId);
    const delivered = deliveryBoyOrders.filter(order => order.status === 'delivered');
    const totalEarnings = delivered.reduce((sum, order) => sum + Number(order.deliveryFee || 0), 0);
    
    return {
      totalOrders: deliveryBoyOrders.length,
      delivered: delivered.length,
      pending: deliveryBoyOrders.filter(order => order.status !== 'delivered' && order.status !== 'cancelled').length,
      earnings: totalEarnings,
      successRate: deliveryBoyOrders.length > 0 ? ((delivered.length / deliveryBoyOrders.length) * 100).toFixed(1) : '0'
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-charcoal mb-2">Delivery Management</h1>
          <p className="text-charcoal opacity-70">Manage delivery boys, track performance and view reports</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setSelectedDeliveryBoy(null);
                form.reset();
              }}
              className="bg-caramel hover:bg-caramel/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Delivery Boy
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedDeliveryBoy ? 'Edit Delivery Boy' : 'Add New Delivery Boy'}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {selectedDeliveryBoy ? 'New Password (leave blank to keep current)' : 'Password'}
                      </FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bike">Bike</SelectItem>
                          <SelectItem value="scooter">Scooter</SelectItem>
                          <SelectItem value="car">Car</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                

                
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 bg-caramel hover:bg-caramel/80"
                  >
                    {selectedDeliveryBoy ? 'Update' : 'Register'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
          <TabsTrigger value="reports">Performance Reports</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Delivery Boys</p>
                    <p className="text-2xl font-bold text-blue-600">{deliveryBoys.length}</p>
                  </div>
                  <User className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Delivery Boys</p>
                    <p className="text-2xl font-bold text-green-600">
                      {deliveryBoys.filter(db => db.isActive).length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Orders in Progress</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {orders.filter(order => order.deliveryBoyId && order.status !== 'delivered' && order.status !== 'cancelled').length}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unassigned Orders</p>
                    <p className="text-2xl font-bold text-red-600">{unassignedOrders.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Performance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deliveryBoys.map((deliveryBoy) => {
              const stats = getDeliveryBoyStats(deliveryBoy.id);
              return (
                <Card key={deliveryBoy.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-caramel text-white rounded-full w-10 h-10 flex items-center justify-center">
                          <span className="text-sm font-bold">
                            {deliveryBoy.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-lg">{deliveryBoy.name}</CardTitle>
                          <p className="text-sm text-gray-600">{deliveryBoy.vehicleType}</p>
                        </div>
                      </div>
                      <Badge className={deliveryBoy.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {deliveryBoy.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total Orders</p>
                        <p className="font-semibold">{stats.totalOrders}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Delivered</p>
                        <p className="font-semibold text-green-600">{stats.delivered}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Earnings</p>
                        <p className="font-semibold text-blue-600">₹{stats.earnings}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Success Rate</p>
                        <p className="font-semibold">{stats.successRate}%</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => setSelectedForTracking(deliveryBoy.id)}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Live Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Live Order Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.filter(order => order.deliveryBoyId && order.status !== 'delivered' && order.status !== 'cancelled').map((order) => {
                  const deliveryBoy = deliveryBoys.find(db => db.id === order.deliveryBoyId);
                  return (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className="bg-blue-100 text-blue-800">
                              {order.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <span className="font-medium">#{order.orderNumber}</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Assigned to: <span className="font-medium">{deliveryBoy?.name}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Customer: {typeof order.deliveryAddress === 'string' 
                              ? order.deliveryAddress 
                              : order.deliveryAddress.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{order.total}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.deliveryDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deliveryBoys
                    .map(db => ({ ...db, stats: getDeliveryBoyStats(db.id) }))
                    .sort((a, b) => b.stats.delivered - a.stats.delivered)
                    .slice(0, 5)
                    .map((deliveryBoy, index) => (
                      <div key={deliveryBoy.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{deliveryBoy.name}</p>
                            <p className="text-sm text-gray-600">{deliveryBoy.stats.delivered} deliveries</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">₹{deliveryBoy.stats.earnings}</p>
                          <p className="text-sm text-gray-600">{deliveryBoy.stats.successRate}% success</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Daily Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Today's Deliveries</span>
                    <span className="font-semibold">
                      {orders.filter(order => order.status === 'delivered' && 
                        new Date(order.deliveryDate).toDateString() === new Date().toDateString()).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending Deliveries</span>
                    <span className="font-semibold text-orange-600">
                      {orders.filter(order => order.deliveryBoyId && order.status !== 'delivered' && order.status !== 'cancelled').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Earnings Today</span>
                    <span className="font-semibold text-green-600">
                      ₹{orders.filter(order => order.status === 'delivered' && 
                        new Date(order.deliveryDate).toDateString() === new Date().toDateString())
                        .reduce((sum, order) => sum + Number(order.deliveryFee || 0), 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Management Tab - Original Delivery Boys List */}
        <TabsContent value="management" className="space-y-6">
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Delivery Boys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deliveryBoys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No delivery boys registered yet
              </div>
            ) : (
              deliveryBoys.map((deliveryBoy) => (
                <div 
                  key={deliveryBoy.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{deliveryBoy.name}</h3>
                        <Badge variant={deliveryBoy.isActive ? 'default' : 'secondary'}>
                          {deliveryBoy.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {deliveryBoy.phone}
                        </span>
                        <span className="capitalize">{deliveryBoy.vehicleType}</span>
                        {deliveryBoy.area && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {deliveryBoy.area}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {deliveryBoy.rating || 0}/5
                        </span>
                        <span>
                          {deliveryBoy.totalDeliveries || 0} deliveries
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus(deliveryBoy)}
                      disabled={updateMutation.isPending}
                    >
                      {deliveryBoy.isActive ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(deliveryBoy)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(deliveryBoy.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Assignment */}
      {unassignedOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unassignedOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                    <p className="text-sm text-muted-foreground">
                      {order.deliveryAddress?.address}, {order.deliveryAddress?.city}
                    </p>
                    <p className="text-sm">
                      Delivery: {new Date(order.deliveryDate).toLocaleDateString()} - {order.deliveryTime}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      onValueChange={(value) => {
                        const deliveryBoyId = parseInt(value);
                        assignOrderMutation.mutate({ orderId: order.id, deliveryBoyId });
                      }}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Assign to delivery boy" />
                      </SelectTrigger>
                      <SelectContent>
                        {deliveryBoys
                          .filter(db => db.isActive)
                          .map((deliveryBoy) => (
                            <SelectItem key={deliveryBoy.id} value={deliveryBoy.id.toString()}>
                              {deliveryBoy.name} ({deliveryBoy.vehicleType})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
}