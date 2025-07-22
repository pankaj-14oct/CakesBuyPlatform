import { useState, useEffect } from 'react';
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
import { 
  Home, Building, MapPin, Plus, Edit, Trash2, User, Calendar, Bell, Package, Coins,
  Wallet, CreditCard, Star, Settings, FileText, PlusCircle, Mail, Phone
} from 'lucide-react';
import { useLocation, Link } from 'wouter';

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
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  birthday: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, 'Birthday must be in MM-DD format').optional(),
  anniversary: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, 'Anniversary must be in MM-DD format').optional(),
});

type AddressForm = z.infer<typeof addressSchema>;
type ProfileForm = z.infer<typeof profileSchema>;

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeSection, setActiveSection] = useState('orders');

  // Handle URL parameters to set active section
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    if (section) {
      setActiveSection(section);
    }
  }, []);

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

  // Fetch user orders
  const { data: orders, isLoading: ordersLoading } = useQuery<any>({
    queryKey: ['/api/auth/orders'],
    enabled: isAuthenticated
  });

  // Fetch user addresses
  const { data: addresses, isLoading: addressesLoading, error: addressesError } = useQuery({
    queryKey: ['/api/auth/addresses'],
    queryFn: async () => {
      const res = await apiRequest('/api/auth/addresses', 'GET');
      const data = await res.json();
      console.log('Addresses API response:', data);
      return data;
    },
    enabled: isAuthenticated
  });

  // Fetch loyalty stats
  const { data: loyaltyStats } = useQuery<any>({
    queryKey: ['/api/loyalty/stats'],
    enabled: isAuthenticated
  });

  // Fetch wallet balance
  const { data: walletBalance } = useQuery<{ balance: string }>({
    queryKey: ['/api/wallet/balance'],
    enabled: isAuthenticated
  });

  // Fetch wallet transactions
  const { data: walletTransactions } = useQuery<any[]>({
    queryKey: ['/api/wallet/transactions'],
    enabled: isAuthenticated
  });

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
      name: userProfile?.name || '',
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
        name: userProfile.name || '',
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
      const res = await apiRequest(`/api/auth/addresses/${addressId}`, 'DELETE');
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
      isDefault: addresses?.length === 0
    });
    setShowAddDialog(true);
  };

  const handleDeleteAddress = (addressId: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      deleteAddressMutation.mutate(addressId);
    }
  };

  const handleDownloadInvoice = async (orderId: number) => {
    try {
      // First try to get existing invoice for the order
      let invoiceData;
      try {
        const invoiceRes = await apiRequest(`/api/orders/${orderId}/invoice`, 'GET');
        invoiceData = await invoiceRes.json();
      } catch (error) {
        // If invoice doesn't exist, create one
        const createRes = await apiRequest(`/api/orders/${orderId}/invoice`, 'POST');
        invoiceData = await createRes.json();
      }
      
      if (invoiceData.invoiceNumber) {
        // For now, open invoice details in a new tab
        // In future, this can be replaced with actual PDF generation
        window.open(`/invoices/${invoiceData.invoiceNumber}`, '_blank');
        
        toast({
          title: "Success",
          description: "Invoice opened in new tab",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to access invoice",
        variant: "destructive",
      });
    }
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

  const sidebarItems: SidebarItem[] = [
    {
      id: 'orders',
      label: 'My Orders',
      icon: <Package className="h-5 w-5" />
    },
    {
      id: 'wallet',
      label: 'My Wallet',
      icon: <Wallet className="h-5 w-5" />,
      badge: `₹${parseFloat(walletBalance?.balance || "0").toFixed(0)}`,
      badgeColor: 'bg-red-500'
    },
    {
      id: 'addresses',
      label: 'Address Book',
      icon: <Home className="h-5 w-5" />
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: <User className="h-5 w-5" />
    },
    {
      id: 'settings',
      label: 'Account Settings',
      icon: <Settings className="h-5 w-5" />
    }
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 max-w-7xl py-8">
        {/* Header */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-pink-100 p-4 rounded-full">
                <User className="h-8 w-8 text-pink-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {userProfile?.name || user?.phone || 'pankaj'}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  {userProfile?.email && (
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4" />
                      <span>{userProfile.email}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>{userProfile?.phone || user?.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-4">
            <Card className="shadow-sm">
              <CardContent className="p-0">
                <div className="space-y-1">
                  {sidebarItems.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors ${
                        activeSection === item.id 
                          ? 'bg-red-50 border-r-2 border-red-500 text-red-600' 
                          : 'text-gray-700'
                      } ${index === 0 ? 'border-b-2 border-red-500' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.badge && (
                        <Badge 
                          className={`${item.badgeColor || 'bg-gray-500'} text-white text-xs`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-8">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                {activeSection === 'orders' && (
                  <div>
                    <div className="border-b pb-4 mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">My Orders</h2>
                    </div>
                    {ordersLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading orders...</p>
                      </div>
                    ) : orders && orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.map((order: any) => (
                          <Card key={order.id} className="border border-gray-200">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-gray-900">
                                      Order #{order.orderNumber || order.id}
                                    </span>
                                    <Badge 
                                      className={`text-xs ${
                                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                        order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                                        order.status === 'out-for-delivery' ? 'bg-purple-100 text-purple-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ') : 'Pending'}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-600">
                                    Total: ₹{parseFloat(order.total || 0).toFixed(2)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Ordered on {new Date(order.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setLocation(`/track-order?order=${order.orderNumber}`)}
                                  >
                                    View Details
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadInvoice(order.id)}
                                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    Invoice
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No orders found</p>
                        <Button 
                          onClick={() => setLocation('/')}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Start Shopping
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {activeSection === 'wallet' && (
                  <div>
                    <div className="border-b pb-4 mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">My Wallet</h2>
                    </div>
                    <div className="space-y-6">
                      {/* CakesBuy Credits Card */}
                      <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-lg p-6 border border-pink-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">CakesBuy Credits</h3>
                            <p className="text-gray-600 text-sm">
                              Current Balance: <span className="font-semibold text-gray-800">₹{parseFloat(walletBalance?.balance || "0").toFixed(0)}</span> Cash | <span className="font-semibold text-red-600">{loyaltyStats?.points || 0}</span> Rewards
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-gray-900">₹{parseFloat(walletBalance?.balance || "0").toFixed(0)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Transaction History */}
                      <div className="bg-white rounded-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 text-center">Transaction History</h3>
                        </div>
                        <div className="p-6">
                          {walletTransactions && walletTransactions.length > 0 ? (
                            <div className="space-y-4">
                              {walletTransactions.map((transaction: any) => (
                                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                                  <div>
                                    <p className={`font-semibold ${transaction.type === 'credit' || transaction.type === 'cashback' || transaction.type === 'refund' ? 'text-green-600' : 'text-red-600'}`}>
                                      {transaction.type === 'credit' && 'Earn Reward'}
                                      {transaction.type === 'debit' && 'Payment'}
                                      {transaction.type === 'cashback' && 'Cashback'}
                                      {transaction.type === 'refund' && 'Refund'}
                                      {transaction.type === 'admin_credit' && 'Admin Credit'}
                                      {transaction.type === 'admin_debit' && 'Admin Debit'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                                        month: 'short',
                                        day: '2-digit',
                                        year: 'numeric'
                                      })}
                                    </p>
                                    {transaction.description && (
                                      <p className="text-xs text-gray-400 mt-1">{transaction.description}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className={`font-bold ${transaction.type === 'credit' || transaction.type === 'cashback' || transaction.type === 'refund' ? 'text-green-600' : 'text-red-600'}`}>
                                      {transaction.type === 'credit' || transaction.type === 'cashback' || transaction.type === 'refund' || transaction.type === 'admin_credit' ? '+' : '-'}₹{parseFloat(transaction.amount).toFixed(0)}
                                    </p>
                                    {transaction.type === 'credit' && (
                                      <p className="text-xs text-gray-500">
                                        Expire On {new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                                          month: 'short',
                                          day: '2-digit',
                                          year: 'numeric'
                                        })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500">No transactions yet</p>
                              <p className="text-sm text-gray-400 mt-2">Your wallet transactions will appear here</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'addresses' && (
                  <div>
                    <div className="border-b pb-4 mb-6 flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">Address Book</h2>
                      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                        <DialogTrigger asChild>
                          <Button onClick={handleAddNew} className="bg-red-600 hover:bg-red-700">
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
                                      <Input {...field} placeholder="e.g. Home, Office" />
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
                                          <SelectValue placeholder="Select address type" />
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
                                      <Input {...field} placeholder="House number, street, area" />
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

                              <div className="flex justify-end space-x-2 pt-4">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={() => setShowAddDialog(false)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  type="submit" 
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={saveAddressMutation.isPending}
                                >
                                  {saveAddressMutation.isPending ? 'Saving...' : 'Save Address'}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="space-y-4">
                      {addressesLoading ? (
                        <div>Loading addresses...</div>
                      ) : addressesError ? (
                        <div className="text-red-600">Error loading addresses: {addressesError.message}</div>
                      ) : addresses && addresses.length > 0 ? (
                        addresses.map((address: any) => (
                          <Card key={address.id} className="border border-gray-200">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    {getAddressIcon(address.type)}
                                    <span className="font-semibold text-gray-900">{address.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
                                    </Badge>
                                    {address.isDefault && (
                                      <Badge className="bg-green-100 text-green-800 text-xs">Default</Badge>
                                    )}
                                  </div>
                                  <p className="text-gray-600">{address.address}</p>
                                  <p className="text-sm text-gray-500">
                                    {address.city} - {address.pincode}
                                    {address.landmark && ` • Near ${address.landmark}`}
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditAddress(address)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteAddress(address.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">No addresses saved yet</p>
                          <Button onClick={handleAddNew} className="bg-red-600 hover:bg-red-700">
                            Add Your First Address
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}



                {activeSection === 'profile' && (
                  <div>
                    <div className="border-b pb-4 mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">My Profile</h2>
                    </div>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={profileForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Your name" />
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
                                  <div className="space-y-2">
                                    <Input 
                                      type="date"
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          // Convert YYYY-MM-DD to MM-DD format
                                          const date = new Date(e.target.value);
                                          const month = String(date.getMonth() + 1).padStart(2, '0');
                                          const day = String(date.getDate()).padStart(2, '0');
                                          field.onChange(`${month}-${day}`);
                                        } else {
                                          field.onChange('');
                                        }
                                      }}
                                      value={
                                        field.value ? 
                                        (() => {
                                          // Convert MM-DD to YYYY-MM-DD for date input
                                          const [month, day] = field.value.split('-');
                                          if (month && day) {
                                            const currentYear = new Date().getFullYear();
                                            return `${currentYear}-${month}-${day}`;
                                          }
                                          return '';
                                        })() : ''
                                      }
                                      className="w-full"
                                    />
                                    <Input 
                                      {...field} 
                                      placeholder="12-25" 
                                      maxLength={5} 
                                      className="text-sm text-gray-600"
                                      readOnly 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                                <p className="text-xs text-gray-500">
                                  Birthday must be in MM-DD format
                                </p>
                                <p className="text-xs text-gray-500">
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
                                  <div className="space-y-2">
                                    <Input 
                                      type="date"
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          // Convert YYYY-MM-DD to MM-DD format
                                          const date = new Date(e.target.value);
                                          const month = String(date.getMonth() + 1).padStart(2, '0');
                                          const day = String(date.getDate()).padStart(2, '0');
                                          field.onChange(`${month}-${day}`);
                                        } else {
                                          field.onChange('');
                                        }
                                      }}
                                      value={
                                        field.value ? 
                                        (() => {
                                          // Convert MM-DD to YYYY-MM-DD for date input
                                          const [month, day] = field.value.split('-');
                                          if (month && day) {
                                            const currentYear = new Date().getFullYear();
                                            return `${currentYear}-${month}-${day}`;
                                          }
                                          return '';
                                        })() : ''
                                      }
                                      className="w-full"
                                    />
                                    <Input 
                                      {...field} 
                                      placeholder="06-15" 
                                      maxLength={5} 
                                      className="text-sm text-gray-600"
                                      readOnly 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                                <p className="text-xs text-gray-500">
                                  Anniversary must be in MM-DD format
                                </p>
                                <p className="text-xs text-gray-500">
                                  Get reminded to order a special anniversary cake!
                                </p>
                              </FormItem>
                            )}
                          />
                        </div>

                        <Button 
                          type="submit" 
                          className="bg-red-600 hover:bg-red-700"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                        </Button>
                      </form>
                    </Form>
                  </div>
                )}

                {activeSection === 'settings' && (
                  <div>
                    <div className="border-b pb-4 mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
                    </div>
                    <div className="space-y-6">
                      <Card className="border border-gray-200">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Notifications</h3>
                          <p className="text-gray-600 text-sm mb-4">Manage your notification preferences</p>
                          <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                            Manage Notifications
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card className="border border-gray-200">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Privacy Settings</h3>
                          <p className="text-gray-600 text-sm mb-4">Control your privacy and data settings</p>
                          <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                            Privacy Settings
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
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