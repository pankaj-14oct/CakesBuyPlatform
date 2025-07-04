import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, Search, MapPin, Clock, CheckCircle, 
  Truck, User, Phone, Calendar, ArrowLeft 
} from 'lucide-react';
import { Order } from '@shared/schema';
import { formatPrice } from '@/lib/utils';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [searchClicked, setSearchClicked] = useState(false);
  const { isAuthenticated } = useAuth();

  // Fetch order details
  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ['/api/orders', orderNumber],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderNumber}`);
      if (!response.ok) {
        throw new Error('Order not found');
      }
      return response.json();
    },
    enabled: searchClicked && orderNumber.length > 0,
  });

  const handleTrackOrder = () => {
    if (orderNumber.trim()) {
      setSearchClicked(true);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'confirmed': return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'preparing': return <Package className="h-5 w-5 text-orange-600" />;
      case 'out_for_delivery': return <Truck className="h-5 w-5 text-purple-600" />;
      case 'delivered': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled': return <Package className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDeliveryTime = (time: string) => {
    switch (time) {
      case 'slot1': return '9 AM - 12 PM';
      case 'slot2': return '12 PM - 3 PM';
      case 'slot3': return '3 PM - 6 PM';
      case 'slot4': return '6 PM - 9 PM';
      case 'midnight': return '11:30 PM - 12:30 AM (₹250 delivery charge)';
      // Legacy support for old time slots
      case 'morning': return '9 AM - 12 PM';
      case 'afternoon': return '12 PM - 3 PM';
      case 'evening': return '3 PM - 6 PM';
      default: return time || 'Not specified';
    }
  };

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'upi': return 'UPI';
      case 'card': return 'Credit/Debit Card';
      case 'cod': return 'Cash on Delivery';
      default: return method || 'Not specified';
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Track Your Order</h1>
            <p className="text-charcoal opacity-70">Enter your order number to track your delivery</p>
          </div>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-caramel" />
              Find Your Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Enter your order number (e.g., CK123456789)"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="h-12"
                />
              </div>
              <Button 
                onClick={handleTrackOrder}
                className="bg-red-500 text-white hover:bg-red-600 px-8 h-12"
                disabled={!orderNumber.trim()}
              >
                <Search className="h-4 w-4 mr-2" />
                Track Order
              </Button>
            </div>
            
            {!isAuthenticated && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Sign in to view all your orders automatically without entering order numbers.
                  <Link href="/auth" className="ml-2 text-blue-600 hover:text-blue-800 underline">
                    Sign In
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-caramel mx-auto mb-4 animate-pulse" />
              <p className="text-charcoal opacity-70">Searching for your order...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && searchClicked && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-charcoal mb-2">Order Not Found</h3>
              <p className="text-charcoal opacity-70 mb-4">
                We couldn't find an order with number "{orderNumber}". Please check the order number and try again.
              </p>
              <div className="text-sm text-charcoal opacity-60">
                <p>Order numbers usually start with "CK" followed by numbers (e.g., CK1234567890)</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    Order #{order.orderNumber}
                  </span>
                  <Badge className={getStatusColor(order.status)}>
                    {formatStatus(order.status)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold text-charcoal mb-2">Order Total</h4>
                    <p className="text-2xl font-bold text-caramel">{formatPrice(parseFloat(order.total))}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal mb-2">Payment Method</h4>
                    <p className="text-charcoal">{formatPaymentMethod(order.paymentMethod || '')}</p>
                    <Badge className={order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal mb-2">Delivery Date</h4>
                    <p className="text-charcoal">
                      {new Date(order.deliveryDate).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-charcoal opacity-70">
                      {formatDeliveryTime(order.deliveryTime || '')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-caramel" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">{order.deliveryAddress.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{order.deliveryAddress.phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <p>{order.deliveryAddress.address}</p>
                      <p>{order.deliveryAddress.city} - {order.deliveryAddress.pincode}</p>
                      {order.deliveryAddress.landmark && (
                        <p className="text-sm text-charcoal opacity-70">Landmark: {order.deliveryAddress.landmark}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-caramel" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-caramel" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-charcoal">{item.name}</h4>
                        <div className="text-sm text-charcoal opacity-70 space-y-1">
                          <p>Weight: {item.weight} | Flavor: {item.flavor}</p>
                          <p>Quantity: {item.quantity}</p>
                          {item.customMessage && (
                            <p>Message: "{item.customMessage}"</p>
                          )}
                          {item.addons && item.addons.length > 0 && (
                            <p>Add-ons: {item.addons.map(addon => addon.name).join(', ')}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-charcoal">{formatPrice(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(parseFloat(order.subtotal || '0'))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{formatPrice(parseFloat(order.deliveryFee?.toString() || '0'))}</span>
                  </div>
                  {parseFloat(order.discount?.toString() || '0') > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(parseFloat(order.discount?.toString() || '0'))}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-caramel">{formatPrice(parseFloat(order.total || '0'))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Special Instructions */}
            {order.specialInstructions && (
              <Card>
                <CardHeader>
                  <CardTitle>Special Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-charcoal bg-gray-50 p-4 rounded-lg">{order.specialInstructions}</p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4 justify-center">
                  {isAuthenticated && (
                    <Link href="/orders">
                      <Button variant="outline">
                        View All Orders
                      </Button>
                    </Link>
                  )}
                  <Link href="/">
                    <Button className="bg-caramel text-white hover:bg-brown">
                      Order More Cakes
                    </Button>
                  </Link>
                  <Button 
                    variant="outline"
                    onClick={() => window.open('https://wa.me/1234567890', '_blank')}
                  >
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}