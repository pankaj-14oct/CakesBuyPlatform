import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Menu, MapPin, Search, User } from 'lucide-react';
import { useCart } from './cart-context';

export default function Header() {
  const [location] = useLocation();
  const [pincode, setPincode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { state: cartState } = useCart();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/category/birthday', label: 'Cakes' },
    { href: '/custom', label: 'Custom Orders' },
    { href: '/delivery', label: 'Delivery' },
    { href: '/contact', label: 'Contact' },
  ];

  const checkPincode = async () => {
    if (!pincode) return;
    // API call to check delivery area
    console.log('Checking pincode:', pincode);
  };

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-brown">
              🎂 CakesBuy
            </div>
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

            {/* User Account */}
            <Button className="bg-caramel text-white hover:bg-brown hidden sm:flex">
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>

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

                  {/* Mobile Sign In */}
                  <Button className="bg-caramel text-white hover:bg-brown">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
