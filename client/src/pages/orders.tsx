import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, Calendar, Clock, MapPin, CreditCard, Search,
  Truck, CheckCircle, AlertCircle, Timer, RefreshCw,
  ShoppingBag, ArrowLeft, Eye, Star, MessageSquare
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { formatPrice } from '@/lib/utils';

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: string;
  subtotal: string;
  deliveryFee: string;
  discount: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryAddress: {
    name: string;
    phone: string;
    address: string;
    pincode: string;
    city: string;
    landmark?: string;
  };
  items: Array<{
    cakeId: number;
    name: string;
    quantity: number;
    weight: string;
    flavor: string;
    price: number;
    customMessage?: string;
    customImage?: string;
    addons?: Array<{
      id: number;
      name: string;
      price: number;
      quantity: number;
      customInput?: string;
    }>;
  }>;
  specialInstructions?: string;
  promoCode?: string;
  createdAt: string;
  updatedAt: string;
  rating?: {
    id: number;
    overallRating: number;
    comment?: string;
    createdAt: string;
  };
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusIcons = {
  pending: Timer,
  confirmed: CheckCircle,
  preparing: RefreshCw,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  cancelled: AlertCircle
};

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800'
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  // Fetch user orders
  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ['/api/auth/orders'],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Package className="h-16 w-16 text-caramel mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-charcoal mb-4">View Your Orders</h1>
          <p className="text-charcoal opacity-70 mb-6">
            Sign in to view your order history and track deliveries
          </p>
          <Link href="/auth">
            <Button className="bg-caramel hover:bg-brown">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-caramel mx-auto mb-4 animate-pulse" />
          <p className="text-charcoal opacity-70">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error || !orders) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-charcoal mb-2">Failed to load orders</h2>
          <p className="text-charcoal opacity-70 mb-4">There was an error loading your orders. Please try again.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'upi': return 'UPI';
      case 'card': return 'Credit/Debit Card';
      case 'cod': return 'Cash on Delivery';
      default: return method || 'Not specified';
    }
  };

  const formatDeliveryTime = (time: string) => {
    switch (time) {
      case '9am-12pm': return '9:00 AM - 12:00 PM';
      case '12pm-3pm': return '12:00 PM - 3:00 PM';
      case '3pm-6pm': return '3:00 PM - 6:00 PM';
      case '6pm-9pm': return '6:00 PM - 9:00 PM';
      case '9pm-11pm': return '9:00 PM - 11:00 PM';
      case '11:30pm-12:30am': return '11:30 PM - 12:30 AM (₹250 delivery charge)';
      // Legacy support for old slot names
      case 'slot1': return '9:00 AM - 12:00 PM';
      case 'slot2': return '12:00 PM - 3:00 PM';
      case 'slot3': return '3:00 PM - 6:00 PM';
      case 'slot4': return '6:00 PM - 9:00 PM';
      case 'midnight': return '11:30 PM - 12:30 AM (₹250 delivery charge)';
      case 'morning': return '9:00 AM - 12:00 PM';
      case 'afternoon': return '12:00 PM - 3:00 PM';
      case 'evening': return '3:00 PM - 6:00 PM';
      default: return time || 'Not specified';
    }
  };



  return (
    <div className="min-h-screen bg-cream">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-charcoal">My Orders</h1>
            <p className="text-charcoal opacity-70">View and track your order history</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()} 
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-charcoal opacity-50" />
                <Input
                  placeholder="Search by order number or cake name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <ShoppingBag className="h-16 w-16 text-caramel mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-charcoal mb-2">
              {orders.length === 0 ? 'No orders yet' : 'No orders found'}
            </h2>
            <p className="text-charcoal opacity-70 mb-6">
              {orders.length === 0 
                ? 'Place your first order to see it here'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {orders.length === 0 && (
              <Link href="/category/all">
                <Button className="bg-caramel hover:bg-brown">Start Shopping</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const StatusIcon = statusIcons[order.status as keyof typeof statusIcons] || Timer;
              const isExpanded = expandedOrder === order.id;
              
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <StatusIcon className="h-5 w-5 text-caramel" />
                        <div>
                          <CardTitle className="text-lg font-semibold">#{order.orderNumber}</CardTitle>
                          <p className="text-sm text-charcoal opacity-70">
                            Placed on {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold text-charcoal">{formatPrice(parseFloat(order.total))}</p>
                          <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                            {formatStatus(order.status)}
                          </Badge>
                        </div>
                        
                        {/* Rate Order Button - Show in header for delivered orders */}
                        {console.log('Order debug:', { id: order.id, status: order.status, rating: order.rating })}
                        {order.status === 'delivered' && (
                          order.rating ? (
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`h-3 w-3 ${star <= order.rating!.overallRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          ) : (
                            <Link href={`/rate-order/${order.id}`}>
                              <Button variant="outline" size="sm" className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100">
                                <Star className="h-4 w-4 mr-1" />
                                Rate Order
                              </Button>
                            </Link>
                          )
                        )}
                        
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="p-6 pt-0">
                      <Separator className="mb-6" />
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Order Items */}
                        <div>
                          <h3 className="font-semibold text-charcoal mb-4">Order Items</h3>
                          <div className="space-y-4">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <h4 className="font-medium text-charcoal">{item.name}</h4>
                                  <div className="text-sm text-charcoal opacity-70 space-y-1">
                                    <p>Weight: {item.weight} • Flavor: {item.flavor}</p>
                                    <p>Quantity: {item.quantity}</p>
                                    {item.customMessage && (
                                      <p>Message: "{item.customMessage}"</p>
                                    )}
                                    {item.customImage && (
                                      <div className="mt-3">
                                        <p className="font-medium text-pink-600 mb-2">📸 Custom Photo:</p>
                                        <div className="bg-white p-2 rounded border inline-block">
                                          <img
                                            src={item.customImage}
                                            width="200"
                                            height="200"
                                            className="rounded border-0 object-cover"
                                            alt="Custom cake design"
                                          />
                                        </div>
                                      </div>
                                    )}
                                    {item.addons && item.addons.length > 0 && (
                                      <div>
                                        <p className="font-medium">Add-ons:</p>
                                        {item.addons.map((addon, addonIndex) => (
                                          <p key={addonIndex} className="ml-2">
                                            • {addon.name}
                                            {addon.customInput && (
                                              <span className="text-gray-600"> ({addon.customInput})</span>
                                            )}
                                            {' '}x{addon.quantity} - {formatPrice(addon.price)}
                                          </p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-charcoal">{formatPrice(item.price)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Order Summary */}
                          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-charcoal mb-3">Order Summary</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>{formatPrice(parseFloat(order.subtotal))}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Delivery Fee:</span>
                                <span>{formatPrice(parseFloat(order.deliveryFee))}</span>
                              </div>
                              {parseFloat(order.discount) > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>Discount:</span>
                                  <span>-{formatPrice(parseFloat(order.discount))}</span>
                                </div>
                              )}
                              <Separator />
                              <div className="flex justify-between font-semibold">
                                <span>Total:</span>
                                <span>{formatPrice(parseFloat(order.total))}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Order Details */}
                        <div className="space-y-6">
                          {/* Delivery Information */}
                          <div>
                            <h3 className="font-semibold text-charcoal mb-4">Delivery Information</h3>
                            <div className="space-y-3">
                              <div className="flex items-start space-x-3">
                                <MapPin className="h-4 w-4 text-caramel mt-1" />
                                <div>
                                  <p className="font-medium text-charcoal">{order.deliveryAddress.name}</p>
                                  <p className="text-sm text-charcoal opacity-70">
                                    {order.deliveryAddress.address}
                                    {order.deliveryAddress.landmark && `, ${order.deliveryAddress.landmark}`}
                                  </p>
                                  <p className="text-sm text-charcoal opacity-70">
                                    {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
                                  </p>
                                  <p className="text-sm text-charcoal opacity-70">
                                    Phone: {order.deliveryAddress.phone}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <Calendar className="h-4 w-4 text-caramel" />
                                <div>
                                  <p className="font-medium text-charcoal">
                                    {new Date(order.deliveryDate).toLocaleDateString()}
                                  </p>
                                  <p className="text-sm text-charcoal opacity-70">
                                    {formatDeliveryTime(order.deliveryTime)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Payment Information */}
                          <div>
                            <h3 className="font-semibold text-charcoal mb-4">Payment Information</h3>
                            <div className="flex items-center space-x-3">
                              <CreditCard className="h-4 w-4 text-caramel" />
                              <div>
                                <p className="font-medium text-charcoal">
                                  {formatPaymentMethod(order.paymentMethod)}
                                </p>
                                <Badge className={paymentStatusColors[order.paymentStatus as keyof typeof paymentStatusColors]}>
                                  {formatStatus(order.paymentStatus)}
                                </Badge>
                              </div>
                            </div>
                            {order.promoCode && (
                              <div className="mt-3 flex items-center space-x-3">
                                <Package className="h-4 w-4 text-caramel" />
                                <div>
                                  <p className="font-medium text-charcoal">Promo Code Applied</p>
                                  <p className="text-sm text-charcoal opacity-70">{order.promoCode}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Special Instructions */}
                          {order.specialInstructions && (
                            <div>
                              <h3 className="font-semibold text-charcoal mb-4">Special Instructions</h3>
                              <p className="text-sm text-charcoal opacity-70 p-3 bg-gray-50 rounded-lg">
                                {order.specialInstructions}
                              </p>
                            </div>
                          )}
                          
                          {/* Order Actions */}
                          <div className="flex flex-wrap gap-3">
                            {/* Rate Order Button - Show only for delivered orders */}
                            {order.status === 'delivered' && (
                              order.rating ? (
                                <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star 
                                        key={star} 
                                        className={`h-4 w-4 ${star <= order.rating!.overallRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm font-medium text-yellow-800">
                                    Rated {order.rating.overallRating}/5
                                  </span>
                                </div>
                              ) : (
                                <Link href={`/rate-order/${order.id}`}>
                                  <Button variant="outline" size="sm" className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100">
                                    <Star className="h-4 w-4 mr-2" />
                                    Rate Order
                                  </Button>
                                </Link>
                              )
                            )}
                            
                            <Link href={`/orders/${order.orderNumber}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </Link>
                            
                            {order.status === 'delivered' && (
                              <Button variant="outline" size="sm">
                                Reorder
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}