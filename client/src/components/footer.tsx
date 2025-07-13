import { Link } from 'wouter';
import { Facebook, Instagram, Twitter, MessageCircle, Phone, Mail, MapPin, Clock, Gift, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export default function Footer() {
  const { isAuthenticated } = useAuth();
  
  return (
    <footer className="bg-charcoal text-white py-16">
      <div className="container mx-auto px-4">
        {/* Wallet Reward Banner for non-authenticated users */}
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 mb-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Gift className="h-6 w-6 text-white" />
              <span className="text-xl font-bold text-white">New User Special!</span>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Wallet className="h-8 w-8 text-white" />
                <span className="text-3xl font-bold text-white">₹50</span>
                <span className="text-lg text-white">instant wallet credit</span>
              </div>
              <p className="text-sm text-orange-100">Sign up now and get ₹50 credit to use on your first order!</p>
            </div>
            <Link href="/auth">
              <Button className="bg-white text-orange-600 hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg">
                <Gift className="h-4 w-4 mr-2" />
                Claim Your ₹50 Now
              </Button>
            </Link>
          </div>
        )}
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <div className="text-2xl font-bold mb-6">
              🥚 CakesBuy
            </div>
            <p className="text-gray-300 mb-6">
              100% eggless cakes delivered online across Gurgaon. Perfect for vegetarians and health-conscious families since 2018.
            </p>
            
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="bg-caramel text-white p-2 rounded-lg hover:bg-brown transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="bg-caramel text-white p-2 rounded-lg hover:bg-brown transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="bg-caramel text-white p-2 rounded-lg hover:bg-brown transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="bg-caramel text-white p-2 rounded-lg hover:bg-brown transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/category/eggless-cakes" className="text-gray-300 hover:text-caramel transition-colors">
                  All Eggless Cakes
                </Link>
              </li>
              <li>
                <Link href="/category/birthday-cakes" className="text-gray-300 hover:text-caramel transition-colors">
                  Eggless Birthday
                </Link>
              </li>
              <li>
                <Link href="/category/wedding-cakes" className="text-gray-300 hover:text-caramel transition-colors">
                  Eggless Wedding
                </Link>
              </li>
              <li>
                <Link href="/category/theme-cakes" className="text-gray-300 hover:text-caramel transition-colors">
                  Custom Eggless
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="text-gray-300 hover:text-caramel transition-colors">
                  Online Delivery
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="font-semibold mb-6">Customer Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/track-order" className="text-gray-300 hover:text-caramel transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/delivery-info" className="text-gray-300 hover:text-caramel transition-colors">
                  Delivery Info
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="text-gray-300 hover:text-caramel transition-colors">
                  Return Policy
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-caramel transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-caramel transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/delivery/login" className="text-gray-300 hover:text-caramel transition-colors">
                  Delivery Partner Login
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-300 hover:text-caramel transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-caramel transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="font-semibold mb-6">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-caramel" />
                <span className="text-gray-300">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-caramel" />
                <span className="text-gray-300">order@cakesbuy.com</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-caramel mt-1" />
                <span className="text-gray-300">Sector 14, Gurgaon, Haryana 122001</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-caramel" />
                <span className="text-gray-300">24/7 Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-12 pt-8 text-center">
          <p className="text-gray-300">
            © 2024 CakesBuy. All rights reserved. | 
            <Link href="/privacy" className="text-caramel hover:underline ml-1">
              Privacy Policy
            </Link> | 
            <Link href="/terms" className="text-caramel hover:underline ml-1">
              Terms & Conditions
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
