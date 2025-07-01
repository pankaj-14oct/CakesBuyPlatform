import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/components/cart-context";
import { AuthProvider } from "@/hooks/use-auth";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Home from "@/pages/home";
import Category from "@/pages/category";
import Product from "@/pages/product";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import AuthPage from "@/pages/auth";
import OtpAuthPage from "@/pages/otp-auth";
import ProfilePage from "@/pages/profile";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminCategories from "@/pages/admin/categories";
import AdminProducts from "@/pages/admin/products";
import AdminOrders from "@/pages/admin/orders";
import AdminCoupons from "@/pages/admin/coupons";
import AdminSettings from "@/pages/admin/settings";
import AdminAddons from "@/pages/admin/addons";
import NotFound from "@/pages/not-found";

import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingCart, Tags, Percent, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  const adminNavItems = [
    { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/categories", label: "Categories", icon: Tags },
    { path: "/admin/products", label: "Products", icon: Package },
    { path: "/admin/addons", label: "Addons", icon: Plus },
    { path: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { path: "/admin/coupons", label: "Coupons", icon: Percent },
    { path: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Admin Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-6">
            <Link href="/" className="flex items-center space-x-2 text-caramel hover:text-brown">
              <Package className="h-6 w-6" />
              <span className="font-bold text-xl">CakesBuy Admin</span>
            </Link>
          </div>
          
          <nav className="px-4 space-y-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      isActive 
                        ? "bg-caramel hover:bg-brown text-white" 
                        : "text-charcoal hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
          
          <div className="absolute bottom-4 left-4 right-4">
            <Link href="/">
              <Button variant="outline" className="w-full">
                Back to Store
              </Button>
            </Link>
          </div>
        </div>

        {/* Admin Content */}
        <div className="flex-1">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  
  // Check if we're in admin area
  if (location.startsWith('/admin')) {
    return (
      <AdminLayout>
        <Switch>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/categories" component={AdminCategories} />
          <Route path="/admin/products" component={AdminProducts} />
          <Route path="/admin/addons" component={AdminAddons} />
          <Route path="/admin/orders" component={AdminOrders} />
          <Route path="/admin/coupons" component={AdminCoupons} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route component={NotFound} />
        </Switch>
      </AdminLayout>
    );
  }

  // Regular customer routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/category/:slug" component={Category} />
      <Route path="/product/:slug" component={Product} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/otp-register" component={OtpAuthPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAdminArea = location.startsWith('/admin');

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <CartProvider>
            {isAdminArea ? (
              <Router />
            ) : (
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <Router />
                </main>
                <Footer />
              </div>
            )}
            <Toaster />
          </CartProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
