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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Home, Building, MapPin, Plus, Edit, Trash2, User, Calendar, Bell, Package, Coins } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import { useEffect } from 'react';

const addressSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Address name is required'),
  type: z.enum(['home', 'work', 'other']),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode'),
  city: z.string().min(2, 'City is required'),
  landmark: z.string().optional(),
  isDefault: z.boolean().default(false)
});

const profileSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  birthday: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, 'Birthday must be in MM-DD format').optional(),
  anniversary: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, 'Anniversary must be in MM-DD format').optional(),
});

type AddressForm = z.infer<typeof addressSchema>;
type ProfileForm = z.infer<typeof profileSchema>;

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

  // Fetch user profile
  const { data: userProfile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ['/api/profile'],
    enabled: isAuthenticated
  });

  // Fetch user reminders
  const { data: reminders, isLoading: remindersLoading } = useQuery<any>({
    queryKey: ['/api/reminders'],
    enabled: isAuthenticated
  });

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

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: userProfile?.username || '',
      email: userProfile?.email || '',
      phone: userProfile?.phone || '',
      birthday: userProfile?.birthday || '',
      anniversary: userProfile?.anniversary || '',
    }
  });

  // Update form when profile data loads
  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        username: userProfile.username || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        birthday: userProfile.birthday || '',
        anniversary: userProfile.anniversary || '',
      });
    }
  }, [userProfile, profileForm]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return apiRequest('/api/profile', 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  // Add/Update address mutation
  const saveAddressMutation = useMutation({
    mutationFn: async (data: AddressForm) => {
      const addressData = {
        ...data,
        id: data.id || `addr_${Date.now()}`,
      };

      if (editingAddress) {
        const res = await apiRequest(`/api/auth/addresses/${editingAddress.id}`, 'PUT', addressData);
        return res.json();
      } else {
        const res = await apiRequest('/api/auth/addresses', 'POST', addressData);
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
      case 'work':
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
          <p className="text-charcoal opacity-70">Manage your account, special dates, and delivery addresses</p>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/orders">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-caramel">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-caramel/10 p-3 rounded-lg">
                    <Package className="h-6 w-6 text-caramel" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal">My Orders</h3>
                    <p className="text-sm text-charcoal opacity-70">View order history and track deliveries</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/loyalty">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-caramel">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-caramel/10 p-3 rounded-lg">
                    <Coins className="h-6 w-6 text-caramel" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal">Loyalty Program</h3>
                    <p className="text-sm text-charcoal opacity-70">Earn points and redeem rewards</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Event Reminders
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your profile details and special dates for personalized reminders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Your username" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="your@email.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+91 9876543210" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="birthday"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Birthday (MM-DD)
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="12-25" maxLength={5} />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-charcoal opacity-70">
                              We'll send you a cake reminder one week before your birthday!
                            </p>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="anniversary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Anniversary (MM-DD)
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="06-15" maxLength={5} />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-charcoal opacity-70">
                              Get reminded to order a special anniversary cake!
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="bg-caramel hover:bg-brown"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card>
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
                                  <SelectItem value="work">Work</SelectItem>
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
                                <Input {...field} placeholder="Near Metro Station" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" disabled={saveAddressMutation.isPending} className="w-full bg-caramel hover:bg-brown">
                          {saveAddressMutation.isPending ? 'Saving...' : 'Save Address'}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-charcoal opacity-70">
                  Address management will be implemented here
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Event Reminders Tab */}
          <TabsContent value="reminders">
            <Card>
              <CardHeader>
                <CardTitle>Event Reminders</CardTitle>
                <CardDescription>
                  View your upcoming birthday and anniversary reminders
                </CardDescription>
              </CardHeader>
              <CardContent>
                {remindersLoading ? (
                  <p className="text-center py-8 text-charcoal opacity-70">Loading reminders...</p>
                ) : !reminders || !Array.isArray(reminders) || reminders.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-charcoal opacity-30 mb-4" />
                    <p className="text-charcoal opacity-70 mb-4">No event reminders set up yet</p>
                    <p className="text-sm text-charcoal opacity-60">
                      Add your birthday and anniversary in Personal Info to get reminders!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reminders.map((reminder: any) => (
                      <div key={reminder.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-charcoal capitalize">
                              {reminder.eventType} Reminder
                            </h3>
                            <p className="text-sm text-charcoal opacity-70">
                              Event Date: {reminder.eventDate} • Reminder: {new Date(reminder.reminderDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {reminder.notificationSent ? (
                              <Badge variant="secondary">Sent</Badge>
                            ) : (
                              <Badge className="bg-caramel">Pending</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}