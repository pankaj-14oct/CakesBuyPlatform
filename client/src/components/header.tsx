import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ShoppingCart, Menu, MapPin, Search, User, LogOut, Package, Heart, Calendar, Wallet, MapPinIcon, MessageCircle, Settings, Truck, FileText } from 'lucide-react';
import { useCart } from './cart-context';
import { useAuth } from '@/hooks/use-auth';

export default function Header() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { state: cartState } = useCart();
  const { user, isAuthenticated, logoutMutation } = useAuth();

  const navItems = [
    { href: '/category/eggless-cakes', label: 'Cakes' },
    { href: '/category/theme-cakes', label: 'Theme Cakes' },
    { href: '/category/relationship-cakes', label: 'By Relationship' },
    { href: '/category/desserts', label: 'Desserts' },
    { href: '/category/birthday-cakes', label: 'Birthday' },
    { href: '/category/hampers', label: 'Hampers', badge: 'New' },
    { href: '/category/anniversary-cakes', label: 'Anniversary' },
    { href: '/occasions', label: 'Occasion' },
    { href: '/customized-cakes', label: 'Customized Cakes' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsMobileSearchOpen(false);
    }
  };

  return (
    <>
      {/* Top Header */}
      <header className="bg-red-500 text-white sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Menu Button */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-red-600 p-2">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Mobile Track Order */}
                  <Link href="/track-order" onClick={() => setIsSheetOpen(false)}>
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
                        onClick={() => setIsSheetOpen(false)}
                        className={`font-medium transition-colors ${
                          location === item.href
                            ? 'text-red-500'
                            : 'text-gray-700 hover:text-red-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {item.label}
                          {item.badge && (
                            <Badge className="bg-red-500 text-white text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile User Menu */}
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
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
                          onClick={() => {
                            setLocation('/orders');
                            setIsSheetOpen(false);
                          }}
                          variant="outline" 
                          className="w-full justify-start gap-3"
                        >
                          <Package className="h-4 w-4" />
                          My Orders
                        </Button>
                        
                        <Button 
                          onClick={() => {
                            setLocation('/wishlist');
                            setIsSheetOpen(false);
                          }}
                          variant="outline" 
                          className="w-full justify-start gap-3"
                        >
                          <Heart className="h-4 w-4" />
                          My Favourites
                        </Button>
                        
                        <Button 
                          onClick={() => {
                            setLocation('/occasions');
                            setIsSheetOpen(false);
                          }}
                          variant="outline" 
                          className="w-full justify-start gap-3"
                        >
                          <Calendar className="h-4 w-4" />
                          My Occasions
                        </Button>
                        
                        <Button 
                          onClick={() => {
                            setLocation('/profile');
                            setIsSheetOpen(false);
                          }}
                          variant="outline" 
                          className="w-full justify-start gap-3"
                        >
                          <MapPinIcon className="h-4 w-4" />
                          Manage Address
                        </Button>
                        
                        <Button 
                          onClick={() => {
                            setLocation('/loyalty');
                            setIsSheetOpen(false);
                          }}
                          variant="outline" 
                          className="w-full justify-start gap-3"
                        >
                          <Wallet className="h-4 w-4" />
                          My Wallet
                        </Button>
                        
                        <Button 
                          onClick={() => {
                            logoutMutation.mutate();
                            setIsSheetOpen(false);
                          }}
                          variant="outline" 
                          className="w-full justify-start gap-3 text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Link href="/auth" onClick={() => setIsSheetOpen(false)}>
                      <Button className="bg-red-500 text-white hover:bg-red-600 w-full">
                        <User className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="text-2xl font-bold text-white">
                CakesBuy
              </div>
            </Link>

            {/* Location Selector - Desktop */}
            <div className="hidden md:flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">Gurgaon</span>
            </div>

            {/* Search Bar - Desktop */}
            <div className="flex-1 max-w-md mx-8 hidden md:block">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Search For Cakes, Occasion, Flavour And More..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-gray-900 bg-white rounded-lg border-0 focus:ring-2 focus:ring-red-300"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </form>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-1">
              {/* Track Order - Desktop */}
              <Link href="/track-order">
                <Button variant="ghost" className="text-white hover:bg-red-600 hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium">
                  <Truck className="h-4 w-4" />
                  Track Order
                </Button>
              </Link>

              {/* Search - Mobile */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden text-white hover:bg-red-600 p-2"
                onClick={() => setIsMobileSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Cart */}
              <Link href="/cart" className="relative">
                <Button variant="ghost" size="icon" className="text-white hover:bg-red-600 p-2">
                  <ShoppingCart className="h-5 w-5" />
                  {cartState.itemCount > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-1 -right-1 bg-yellow-400 text-red-900 text-xs h-5 w-5 flex items-center justify-center p-0 rounded-full"
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
                    <Button variant="ghost" size="icon" className="text-white hover:bg-red-600 p-2 hidden md:flex">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-0">
                    <div className="p-3 border-b bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
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
                        onClick={() => setLocation('/invoices')}
                        className="cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                      >
                        <FileText className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">My Invoices</span>
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
                <>
                  <Link href="/auth">
                    <Button variant="ghost" className="text-white hover:bg-red-600 hidden md:flex">
                      <User className="h-4 w-4 mr-2" />
                      My Account
                    </Button>
                  </Link>
                  {/* Mobile User Icon */}
                  <Link href="/auth">
                    <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-red-600 p-2">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Menu */}
      <nav className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-8 py-3 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap font-medium transition-colors hover:text-red-500 ${
                  location === item.href
                    ? 'text-red-500'
                    : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.label}
                  {item.badge && (
                    <Badge className="bg-red-500 text-white text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden">
          <div className="flex flex-col h-full">
            {/* Search Header */}
            <div className="bg-red-500 text-white p-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="text-white hover:bg-red-600 p-2"
                >
                  <span className="text-xl">×</span>
                </Button>
                <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search For Cakes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-gray-900 bg-white rounded-lg border-0 text-lg"
                      autoFocus
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </form>
              </div>
            </div>

            {/* Track Order Button */}
            <div className="p-4">
              <Link href="/track-order" onClick={() => setIsMobileSearchOpen(false)}>
                <Button className="bg-red-500 text-white hover:bg-red-600 w-full flex items-center justify-center gap-2 py-4 text-lg rounded-lg">
                  <Truck className="h-5 w-5" />
                  Track Order
                </Button>
              </Link>
            </div>

            {/* Navigation Categories */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileSearchOpen(false)}
                    className="block py-3 text-lg font-medium text-gray-700 hover:text-red-500 border-b border-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      {item.label}
                      {item.badge && (
                        <Badge className="bg-red-500 text-white text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}