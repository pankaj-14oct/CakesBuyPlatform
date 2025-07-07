import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Phone, MapPin, CheckCircle, XCircle
} from 'lucide-react';
import { DeliveryBoy, Order } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const deliveryBoySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  vehicleType: z.enum(['bike', 'scooter', 'car'], {
    required_error: 'Please select a vehicle type',
  }),
  licenseNumber: z.string().min(1, 'License number is required'),
  area: z.string().min(1, 'Area is required'),
});

type DeliveryBoyFormData = z.infer<typeof deliveryBoySchema>;

export default function AdminDelivery() {
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState<DeliveryBoy | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const form = useForm<DeliveryBoyFormData>({
    resolver: zodResolver(deliveryBoySchema),
    defaultValues: {
      name: '',
      phone: '',
      password: '',
      vehicleType: 'bike',
      licenseNumber: '',
      area: '',
    },
  });

  // Create delivery boy mutation
  const createMutation = useMutation({
    mutationFn: async (data: DeliveryBoyFormData) => {
      return apiRequest('/api/admin/delivery-boys', {
        method: 'POST',
        body: JSON.stringify(data),
      });
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
      toast({
        title: 'Error',
        description: error.message || 'Failed to register delivery boy',
        variant: 'destructive',
      });
    },
  });

  // Update delivery boy mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DeliveryBoyFormData> }) => {
      return apiRequest(`/api/admin/delivery-boys/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
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
      return apiRequest(`/api/admin/delivery-boys/${id}`, {
        method: 'DELETE',
      });
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
      return apiRequest(`/api/admin/orders/${orderId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ deliveryBoyId }),
      });
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
      licenseNumber: deliveryBoy.licenseNumber || '',
      area: deliveryBoy.area || '',
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-charcoal mb-2">Delivery Management</h1>
          <p className="text-charcoal opacity-70">Manage delivery boys and order assignments</p>
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
                
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter license number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Area</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter service area" {...field} />
                      </FormControl>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Delivery Boys</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryBoys.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Delivery Boys</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliveryBoys.filter(db => db.isActive).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned Orders</CardTitle>
            <Truck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unassignedOrders.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliveryBoys.length > 0 
                ? (deliveryBoys.reduce((acc, db) => acc + (db.rating || 0), 0) / deliveryBoys.length).toFixed(1)
                : '0.0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Boys List */}
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
    </div>
  );
}