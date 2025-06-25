import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, Package, Users, Percent, 
  TrendingUp, Clock, CheckCircle, XCircle 
} from 'lucide-react';
import { Order, Cake, Category, PromoCode } from '@shared/schema';
import { formatPrice } from '@/lib/utils';

export default function AdminDashboard() {
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
  });

  const { data: cakes = [] } = useQuery<Cake[]>({
    queryKey: ['/api/cakes'],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: promoCodes = [] } = useQuery<PromoCode[]>({
    queryKey: ['/api/admin/promo-codes'],
  });

  // Calculate stats
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const completedOrders = orders.filter(order => order.status === 'delivered').length;
  const activePromoCodes = promoCodes.filter(promo => promo.isActive).length;

  const recentOrders = orders.slice(0, 5);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-charcoal mb-2">Admin Dashboard</h1>
        <p className="text-charcoal opacity-70">Manage your CakesBuy store</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-mint" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brown">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {orders.length} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-caramel" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">{cakes.length}</div>
            <p className="text-xs text-muted-foreground">
              {categories.length} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promos</CardTitle>
            <Percent className="h-4 w-4 text-pink" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">{activePromoCodes}</div>
            <p className="text-xs text-muted-foreground">
              {promoCodes.length} total codes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-center text-charcoal opacity-60 py-8">No orders yet</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium text-charcoal">{order.orderNumber}</p>
                      <p className="text-sm text-charcoal opacity-60">
                        {order.deliveryAddress.name} • {order.deliveryAddress.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                    <div className="text-right">
                      <p className="font-medium text-brown">{formatPrice(order.total)}</p>
                      <p className="text-xs text-charcoal opacity-60">
                        {new Date(order.createdAt || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Completed Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completedOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5 text-caramel" />
              Best Selling Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium text-charcoal">Birthday Cakes</div>
            <p className="text-sm text-charcoal opacity-60">Most popular</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-mint" />
              Average Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brown">
              {formatPrice(orders.length > 0 ? totalRevenue / orders.length : 0)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}