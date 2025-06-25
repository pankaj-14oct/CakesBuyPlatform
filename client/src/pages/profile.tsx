import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Home, Building, MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

const addressSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Address name is required'),
  type: z.enum(['home', 'office', 'other']),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode'),
  city: z.string().min(2, 'City is required'),
  landmark: z.string().optional(),
  isDefault: z.boolean().default(false)
});

type AddressForm = z.infer<typeof addressSchema>;

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/auth');
    }
  }, [isAuthenticated, setLocation]);

  // Fetch user addresses
  const { data: addressesData, isLoading } = useQuery({
    queryKey: ['/api/auth/addresses'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/auth/addresses');
      return res.json();
    },
    enabled: isAuthenticated
  });

  const addresses = addressesData?.addresses || [];

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: '',
      type: 'home',
      address: '',
      pincode: '',
      city: 'Gurgaon',
      landmark: '',
      isDefault: false
    }
  });

  // Add/Update address mutation
  const saveAddressMutation = useMutation({
    mutationFn: async (data: AddressForm) => {
      const addressData = {
        ...data,
        id: data.id || `addr_${Date.now()}`,
      };

      if (editingAddress) {
        const res = await apiRequest('PUT', `/api/auth/addresses/${editingAddress.id}`, addressData);
        return res.json();
      } else {
        const res = await apiRequest('POST', '/api/auth/addresses', addressData);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/addresses'] });
      setShowAddDialog(false);
      setEditingAddress(null);
      addressForm.reset();
      toast({
        title: editingAddress ? "Address updated" : "Address added",
        description: "Your address has been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save address",
        variant: "destructive"
      });
    }
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const res = await apiRequest('DELETE', `/api/auth/addresses/${addressId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/addresses'] });
      toast({
        title: "Address deleted",
        description: "Address has been removed successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete address",
        variant: "destructive"
      });
    }
  });

  const onSubmitAddress = (data: AddressForm) => {
    saveAddressMutation.mutate(data);
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    addressForm.reset(address);
    setShowAddDialog(true);
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    addressForm.reset({
      name: '',
      type: 'home',
      address: '',
      pincode: '',
      city: 'Gurgaon',
      landmark: '',
      isDefault: addresses.length === 0
    });
    setShowAddDialog(true);
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'office':
        return <Building className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-2">My Profile</h1>
          <p className="text-charcoal opacity-70">Manage your account and delivery addresses</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Info */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-charcoal opacity-70">Username</p>
                <p className="font-medium">{user?.username}</p>
              </div>
              <div>
                <p className="text-sm text-charcoal opacity-70">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              {user?.phone && (
                <div>
                  <p className="text-sm text-charcoal opacity-70">Phone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Delivery Addresses</CardTitle>
                <CardDescription>
                  Manage your saved delivery addresses
                </CardDescription>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddNew} className="bg-caramel hover:bg-brown">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...addressForm}>
                    <form onSubmit={addressForm.handleSubmit(onSubmitAddress)} className="space-y-4">
                      <FormField
                        control={addressForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Home, Office" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addressForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="home">Home</SelectItem>
                                <SelectItem value="office">Office</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addressForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Address</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="House/Flat no, Street, Area" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={addressForm.control}
                          name="pincode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pincode</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="122001" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={addressForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Gurgaon" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={addressForm.control}
                        name="landmark"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Landmark (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Near metro station" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-between pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-caramel hover:bg-brown"
                          disabled={saveAddressMutation.isPending}
                        >
                          {saveAddressMutation.isPending 
                            ? 'Saving...' 
                            : editingAddress ? 'Update' : 'Add'
                          }
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-8 text-charcoal opacity-70">Loading addresses...</p>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-charcoal opacity-30 mb-4" />
                  <p className="text-charcoal opacity-70 mb-4">No addresses saved yet</p>
                  <Button onClick={handleAddNew} className="bg-caramel hover:bg-brown">
                    Add Your First Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address: any) => (
                    <div
                      key={address.id}
                      className="border rounded-lg p-4 bg-white relative"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getAddressIcon(address.type)}
                            <h3 className="font-medium text-charcoal">{address.name}</h3>
                            {address.isDefault && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                          <p className="text-sm text-charcoal opacity-80 mb-1">
                            {address.address}
                          </p>
                          <p className="text-sm text-charcoal opacity-70">
                            {address.city}, {address.pincode}
                            {address.landmark && ` • ${address.landmark}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAddress(address)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAddressMutation.mutate(address.id)}
                            disabled={deleteAddressMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}