import { useState } from 'react';
import { Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, MapPin, Calendar, Clock, CreditCard, 
  Smartphone, Wallet, Truck, Shield, CheckCircle 
} from 'lucide-react';
import { useCart } from '@/components/cart-context';
import { formatPrice, generateOrderNumber, calculateDeliveryDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const checkoutSchema = z.object({
  // Delivery Address
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode'),
  city: z.string().min(2, 'City is required'),
  landmark: z.string().optional(),
  
  // Delivery Options
  deliveryDate: z.string().min(1, 'Delivery date is required'),
  deliveryTime: z.string().min(1, 'Delivery time is required'),
  
  // Payment
  paymentMethod: z.string().min(1, 'Payment method is required'),
  
  // Optional
  specialInstructions: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { state: cartState, dispatch } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const { toast } = useToast();

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryDate: new Date().toISOString().split('T')[0],
      deliveryTime: 'evening',
      paymentMethod: 'upi',
      city: 'Gurgaon'
    }
  });

  const subtotal = cartState.total;
  const deliveryFee = subtotal >= 500 ? 0 : 50;
  const total = subtotal + deliveryFee;

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest('POST', '/api/orders', orderData);
      return response.json();
    },
    onSuccess: (data) => {
      setOrderNumber(data.orderNumber);
      setOrderPlaced(true);
      dispatch({ type: 'CLEAR_CART' });
      toast({
        title: "Order placed successfully!",
        description: `Your order ${data.orderNumber} has been confirmed.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Order failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (data: CheckoutForm) => {
    setIsPlacingOrder(true);
    
    const orderData = {
      items: cartState.items.map(item => ({
        cakeId: item.cake.id,
        name: item.cake.name,
        quantity: item.quantity,
        weight: item.weight,
        flavor: item.flavor,
        customMessage: item.customMessage,
        price: item.price,
        addons: item.addons.map(addon => ({
          id: addon.addon.id,
          name: addon.addon.name,
          price: parseFloat(addon.addon.price),
          quantity: addon.quantity
        }))
      })),
      subtotal: subtotal.toString(),
      deliveryFee: deliveryFee.toString(),
      total: total.toString(),
      deliveryAddress: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        pincode: data.pincode,
        city: data.city,
        landmark: data.landmark
      },
      deliveryDate: calculateDeliveryDate(data.deliveryTime).toISOString(),
      deliveryTime: data.deliveryTime,
      paymentMethod: data.paymentMethod,
      specialInstructions: data.specialInstructions,
      status: 'pending',
      paymentStatus: data.paymentMethod === 'cod' ? 'pending' : 'paid'
    };

    createOrderMutation.mutate(orderData);
    setIsPlacingOrder(false);
  };

  if (cartState.items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-charcoal mb-4">No Items to Checkout</h1>
          <p className="text-charcoal opacity-70 mb-6">Your cart is empty. Add some cakes first!</p>
          <Link href="/category/all">
            <Button className="bg-caramel hover:bg-brown">Start Shopping</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto text-center p-8">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold text-charcoal mb-4">Order Confirmed!</h1>
            <p className="text-lg text-charcoal opacity-70 mb-6">
              Thank you for your order. We'll start preparing your delicious cake right away!
            </p>
            
            <Card className="bg-mint/10 border-mint/20 p-6 mb-8">
              <h3 className="font-semibold text-charcoal mb-2">Order Details</h3>
              <p className="text-2xl font-bold text-brown mb-2">{orderNumber}</p>
              <p className="text-sm text-charcoal opacity-70">
                You'll receive SMS and email updates about your order status.
              </p>
            </Card>

            <div className="space-y-4">
              <Link href={`/track-order/${orderNumber}`}>
                <Button size="lg" className="bg-brown text-white hover:bg-opacity-90">
                  Track Your Order
                </Button>
              </Link>
              <div>
                <Link href="/category/all">
                  <Button variant="outline" size="lg" className="border-caramel text-caramel hover:bg-caramel hover:text-white">
                    Order More Cakes
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link href="/cart">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-charcoal">Checkout</h1>
            <Badge variant="secondary" className="bg-caramel text-white">
              {cartState.itemCount} {cartState.itemCount === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-caramel" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        {...form.register('name')}
                        placeholder="Enter your full name"
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phone">Mobile Number *</Label>
                      <Input
                        id="phone"
                        {...form.register('phone')}
                        placeholder="Enter 10-digit mobile number"
                      />
                      {form.formState.errors.phone && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Complete Address *</Label>
                    <Textarea
                      id="address"
                      {...form.register('address')}
                      placeholder="House/Flat number, Street name, Area"
                      rows={3}
                    />
                    {form.formState.errors.address && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input
                        id="pincode"
                        {...form.register('pincode')}
                        placeholder="122001"
                      />
                      {form.formState.errors.pincode && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.pincode.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        {...form.register('city')}
                        value="Gurgaon"
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="landmark">Landmark (Optional)</Label>
                      <Input
                        id="landmark"
                        {...form.register('landmark')}
                        placeholder="Near metro station"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-caramel" />
                    Delivery Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deliveryDate">Delivery Date *</Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        {...form.register('deliveryDate')}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {form.formState.errors.deliveryDate && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.deliveryDate.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Delivery Time *</Label>
                      <Select onValueChange={(value) => form.setValue('deliveryTime', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time slot" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12 PM - 4 PM)</SelectItem>
                          <SelectItem value="evening">Evening (4 PM - 8 PM)</SelectItem>
                          <SelectItem value="midnight">Midnight (11:30 PM - 12:30 AM)</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.deliveryTime && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.deliveryTime.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-mint/10 border border-mint/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-mint mb-2">
                      <Truck className="h-4 w-4" />
                      <span className="font-medium">Delivery Information</span>
                    </div>
                    <ul className="text-sm text-charcoal space-y-1">
                      <li>✓ Same-day delivery available for orders before 6 PM</li>
                      <li>✓ Midnight delivery available with 2-hour advance booking</li>
                      <li>✓ Temperature-controlled packaging for freshness</li>
                      <li>✓ Free delivery on orders above ₹500</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5 text-caramel" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    onValueChange={(value) => form.setValue('paymentMethod', value)}
                    defaultValue="upi"
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex items-center space-x-2 cursor-pointer flex-1">
                        <Smartphone className="h-4 w-4 text-caramel" />
                        <span>UPI Payment (PhonePe, GPay, Paytm)</span>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center space-x-2 cursor-pointer flex-1">
                        <CreditCard className="h-4 w-4 text-caramel" />
                        <span>Credit/Debit Card</span>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex items-center space-x-2 cursor-pointer flex-1">
                        <Wallet className="h-4 w-4 text-caramel" />
                        <span>Cash on Delivery</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {form.formState.errors.paymentMethod && (
                    <p className="text-sm text-red-500 mt-2">
                      {form.formState.errors.paymentMethod.message}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Special Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Special Instructions (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    {...form.register('specialInstructions')}
                    placeholder="Any special instructions for delivery or cake preparation..."
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartState.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img 
                        src={item.cake.images[0] || '/placeholder-cake.jpg'} 
                        alt={item.cake.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-charcoal text-sm">{item.cake.name}</h4>
                        <p className="text-xs text-charcoal opacity-70">
                          {item.weight} • {item.flavor} • Qty: {item.quantity}
                        </p>
                        {item.addons.length > 0 && (
                          <p className="text-xs text-charcoal opacity-60">
                            + {item.addons.length} add-on{item.addons.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <div className="text-sm font-medium text-brown">
                        {formatPrice((item.price + item.addons.reduce((sum, addon) => 
                          sum + parseFloat(addon.addon.price) * addon.quantity, 0
                        )) * item.quantity)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Price Breakdown */}
              <Card>
                <CardContent className="p-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-charcoal">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-charcoal">Delivery Fee</span>
                    <span className="font-medium">
                      {deliveryFee === 0 ? (
                        <Badge className="bg-mint text-white text-xs">FREE</Badge>
                      ) : (
                        formatPrice(deliveryFee)
                      )}
                    </span>
                  </div>

                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-charcoal">Total</span>
                    <span className="text-brown">{formatPrice(total)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Place Order Button */}
              <Button
                type="submit"
                size="lg"
                disabled={isPlacingOrder || createOrderMutation.isPending}
                className="w-full bg-brown text-white hover:bg-opacity-90"
              >
                {isPlacingOrder || createOrderMutation.isPending ? (
                  'Placing Order...'
                ) : (
                  `Place Order - ${formatPrice(total)}`
                )}
              </Button>

              {/* Security Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-charcoal mb-2">
                  <Shield className="h-4 w-4 text-mint" />
                  <span className="font-medium text-sm">Secure Checkout</span>
                </div>
                <ul className="text-xs text-charcoal opacity-70 space-y-1">
                  <li>✓ SSL encrypted payment</li>
                  <li>✓ 100% secure data protection</li>
                  <li>✓ No card details stored</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
