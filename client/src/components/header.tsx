import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ShoppingCart, Menu, MapPin, Search, User, LogOut, Package, Heart, Calendar, Wallet, MapPinIcon, MessageCircle, Settings, Truck } from 'lucide-react';
import { useCart } from './cart-context';
import { useAuth } from '@/hooks/use-auth';

export default function Header() {
  const [location, setLocation] = useLocation();
  const [pincode, setPincode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { state: cartState } = useCart();
  const { user, isAuthenticated, logoutMutation } = useAuth();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/category/eggless-cakes', label: 'Eggless Cakes' },
    { href: '/category/birthday-cakes', label: 'Birthday' },
    { href: '/category/wedding-cakes', label: 'Wedding' },
    { href: '/occasions', label: 'Occasions' },
    { href: '/delivery', label: 'Online Delivery' },
  ];

  const checkPincode = async () => {
    if (!pincode) {
      alert('Please enter a pincode');
      return;
    }
    
    try {
      const response = await fetch(`/api/delivery-areas/check/${pincode}`);
      const data = await response.json();
      
      if (data.available) {
        alert(`✅ ${data.message}\nDelivery Fee: ₹${data.area.deliveryFee}\nFree delivery on orders above ₹${data.area.freeDeliveryThreshold}`);
      } else {
        alert(`❌ ${data.message}\nWe currently deliver to: 122001, 122002, 122003, 122004, 122005, 122006, 122007, 122009, 122011, 122012, 122015, 122016, 122017, 122018, 122051, 122052`);
      }
    } catch (error) {
      console.error('Error checking pincode:', error);
      alert('Error checking delivery area. Please try again.');
    }
  };

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-brown">
              🥚 CakesBuy
            </div>
            <Badge className="bg-green-500 text-white text-xs px-2 py-1">100% EGGLESS</Badge>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-medium transition-colors ${
                  location === item.href
                    ? 'text-caramel'
                    : 'text-charcoal hover:text-caramel'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Pincode Checker */}
            <div className="hidden lg:flex items-center bg-gray-100 rounded-lg px-3 py-1">
              <MapPin className="h-4 w-4 text-caramel mr-2" />
              <Input
                type="text"
                placeholder="Enter pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="bg-transparent border-0 text-sm w-24 h-auto p-0 focus:ring-0"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-caramel text-sm font-medium h-auto p-1"
                onClick={checkPincode}
              >
                Check
              </Button>
            </div>

            {/* Track Order */}
            <Link href="/track-order">
              <Button className="bg-red-500 text-white hover:bg-red-600 hidden lg:flex items-center gap-2 px-4 py-2 text-sm font-medium">
                <Truck className="h-4 w-4" />
                Track Order
              </Button>
            </Link>

            {/* Search - Mobile */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>

            {/* Cart */}
            <Link href="/cart" className="relative">
              <Button variant="ghost" size="icon" className="text-charcoal hover:text-caramel">
                <ShoppingCart className="h-5 w-5" />
                {cartState.itemCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 bg-pink text-white text-xs h-5 w-5 flex items-center justify-center p-0"
                  >
                    {cartState.itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 hidden sm:flex hover:bg-gray-50">
                    <div className="w-8 h-8 bg-pink rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user?.phone?.slice(-1) || 'P'}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-900">
                        Hey {user?.phone?.slice(-4) || 'User'}!
                      </div>
                      <div className="text-xs text-gray-500">
                        {user?.phone || user?.email}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-0">
                  <div className="p-3 border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink rounded-full flex items-center justify-center text-white font-semibold">
                        {user?.phone?.slice(-1) || 'P'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          Hey {user?.phone?.slice(-4) || 'User'}!
                        </div>
                        <div className="text-sm text-gray-500">
                          {user?.phone || user?.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-1">
                    <DropdownMenuItem 
                      onClick={() => setLocation('/orders')}
                      className="cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                    >
                      <Package className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">My Orders</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => setLocation('/wishlist')}
                      className="cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                    >
                      <Heart className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">My Favourites</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => setLocation('/occasions')}
                      className="cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                    >
                      <Calendar className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">My Occasions</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => setLocation('/profile')}
                      className="cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                    >
                      <MapPinIcon className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">Manage Address</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => setLocation('/loyalty')}
                      className="cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                    >
                      <Wallet className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">My Wallet</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => setLocation('/profile')}
                      className="cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                    >
                      <Settings className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">My Reviews</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => window.open('https://wa.me/1234567890', '_blank')}
                      className="cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                    >
                      <MessageCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">WhatsApp</span>
                    </DropdownMenuItem>
                  </div>
                  
                  <div className="border-t p-1">
                    <DropdownMenuItem 
                      onClick={() => logoutMutation.mutate()}
                      className="cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">Logout</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button className="bg-caramel text-white hover:bg-brown hidden sm:flex">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Mobile Pincode Checker */}
                  <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
                    <MapPin className="h-4 w-4 text-caramel mr-2" />
                    <Input
                      type="text"
                      placeholder="Enter pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="bg-transparent border-0 text-sm flex-1"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-caramel"
                      onClick={checkPincode}
                    >
                      Check
                    </Button>
                  </div>

                  {/* Mobile Track Order */}
                  <Link href="/track-order">
                    <Button className="bg-red-500 text-white hover:bg-red-600 w-full flex items-center justify-center gap-2 py-3">
                      <Truck className="h-5 w-5" />
                      Track Order
                    </Button>
                  </Link>

                  {/* Mobile Navigation */}
                  <nav className="flex flex-col space-y-4">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`font-medium transition-colors ${
                          location === item.href
                            ? 'text-caramel'
                            : 'text-charcoal hover:text-caramel'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile User Menu */}
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-pink rounded-full flex items-center justify-center text-white font-semibold">
                          {user?.phone?.slice(-1) || 'P'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            Hey {user?.phone?.slice(-4) || 'User'}!
                          </div>
                          <div className="text-sm text-gray-500">
                            {user?.phone || user?.email}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Button 
                          onClick={() => setLocation('/orders')}
                          variant="outline" 
                          className="w-full justify-start gap-3"
                        >
                          <Package className="h-4 w-4" />
                          My Orders
                        </Button>
                        
                        <Button 
                          onClick={() => setLocation('/wishlist')}
                          variant="outline" 
                          className="w-full justify-start gap-3"
                        >
                          <Heart className="h-4 w-4" />
                          My Favourites
                        </Button>
                        
                        <Button 
                          onClick={() => setLocation('/occasions')}
                          variant="outline" 
                          className="w-full justify-start gap-3"
                        >
                          <Calendar className="h-4 w-4" />
                          My Occasions
                        </Button>
                        
                        <Button 
                          onClick={() => setLocation('/profile')}
                          variant="outline" 
                          className="w-full justify-start gap-3"
                        >
                          <MapPinIcon className="h-4 w-4" />
                          Manage Address
                        </Button>
                        
                        <Button 
                          onClick={() => setLocation('/loyalty')}
                          variant="outline" 
                          className="w-full justify-start gap-3"
                        >
                          <Wallet className="h-4 w-4" />
                          My Wallet
                        </Button>
                        
                        <Button 
                          onClick={() => window.open('https://wa.me/1234567890', '_blank')}
                          variant="outline" 
                          className="w-full justify-start gap-3"
                        >
                          <MessageCircle className="h-4 w-4 text-green-600" />
                          WhatsApp
                        </Button>
                        
                        <Button 
                          onClick={() => logoutMutation.mutate()}
                          variant="outline" 
                          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Link href="/auth">
                      <Button className="bg-caramel text-white hover:bg-brown w-full">
                        <User className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
