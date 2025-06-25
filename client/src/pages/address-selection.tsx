import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Home, Building, MapPin, Plus, Check } from 'lucide-react';

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

interface AddressSelectionProps {
  selectedAddressId?: string;
  onAddressSelect: (address: any) => void;
  showAddNew?: boolean;
}

export default function AddressSelection({ 
  selectedAddressId, 
  onAddressSelect, 
  showAddNew = true 
}: AddressSelectionProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);

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

  // Add address mutation
  const addAddressMutation = useMutation({
    mutationFn: async (data: AddressForm) => {
      const addressData = {
        ...data,
        id: `addr_${Date.now()}`,
      };

      const res = await apiRequest('POST', '/api/auth/addresses', addressData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/addresses'] });
      setShowAddDialog(false);
      addressForm.reset();
      onAddressSelect(data.address);
      toast({
        title: "Address added",
        description: "Your new address has been saved and selected."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add address",
        variant: "destructive"
      });
    }
  });

  const onSubmitAddress = (data: AddressForm) => {
    addAddressMutation.mutate(data);
  };

  const handleAddNew = () => {
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
    return (
      <Card>
        <CardHeader>
          <CardTitle>Delivery Address</CardTitle>
          <CardDescription>
            Please sign in to manage your delivery addresses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-charcoal opacity-70 py-4">
            Sign in to save and select delivery addresses
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Select Delivery Address</CardTitle>
          <CardDescription>
            Choose from your saved addresses or add a new one
          </CardDescription>
        </div>
        {showAddNew && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Address</DialogTitle>
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
                      disabled={addAddressMutation.isPending}
                    >
                      {addAddressMutation.isPending ? 'Adding...' : 'Add Address'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
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
          <RadioGroup 
            value={selectedAddressId} 
            onValueChange={(value) => {
              const address = addresses.find((addr: any) => addr.id === value);
              if (address) onAddressSelect(address);
            }}
            className="space-y-4"
          >
            {addresses.map((address: any) => (
              <div key={address.id} className="relative">
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value={address.id} id={address.id} />
                  <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      {getAddressIcon(address.type)}
                      <span className="font-medium">{address.name}</span>
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
                  </Label>
                  {selectedAddressId === address.id && (
                    <Check className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
}