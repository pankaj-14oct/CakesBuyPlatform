import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/components/cart-context";
import { AuthProvider } from "@/hooks/use-auth";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useEffect } from "react";
import Home from "@/pages/home";
import Category from "@/pages/category";
import Product from "@/pages/product";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import DeliveryPage from "@/pages/delivery";
import AuthPage from "@/pages/auth";
import OtpAuthPage from "@/pages/otp-auth";
import ForgotPassword from "@/pages/ForgotPassword";
import OccasionReminder from "@/pages/OccasionReminderSimple";
import ProfilePage from "@/pages/profile";
import OrdersPage from "@/pages/orders";
import InvoicesPage from "@/pages/Invoices";
import InvoiceDetailPage from "@/pages/InvoiceDetail";
import LoyaltyPage from "@/pages/loyalty";
import TrackOrderPage from "@/pages/track-order";
import SearchPage from "@/pages/search";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminCategories from "@/pages/admin/categories";
import AdminProducts from "@/pages/admin/products";
import AdminOrders from "@/pages/admin/orders";
import AdminUsers from "@/pages/admin/users";
import AdminCoupons from "@/pages/admin/coupons";
import AdminSettings from "@/pages/admin/settings";
import AdminAddons from "@/pages/admin/addons";
import AdminInvoices from "@/pages/admin/invoices";
import AdminWallet from "@/pages/admin/wallet";
import AdminReminders from "@/pages/AdminReminders";
import AdminLogin from "@/pages/AdminLogin";
import AdminProtected from "@/components/AdminProtected";
import NotFound from "@/pages/not-found";

import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingCart, Tags, Percent, Settings, Plus, Mail, Users, FileText, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Component to handle scroll restoration on route changes
function ScrollRestoration() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  const adminNavItems = [
    { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/categories", label: "Categories", icon: Tags },
    { path: "/admin/products", label: "Products", icon: Package },
    { path: "/admin/addons", label: "Addons", icon: Plus },
    { path: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { path: "/admin/users", label: "Users", icon: Users },
    { path: "/admin/coupons", label: "Coupons", icon: Percent },
    { path: "/admin/invoices", label: "Invoices", icon: FileText },
    { path: "/admin/wallet", label: "Wallet Management", icon: Wallet },
    { path: "/admin/reminders", label: "Email Reminders", icon: Mail },
    { path: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Admin Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r flex flex-col">
          <div className="p-6">
            <Link href="/" className="flex items-center space-x-2 text-caramel hover:text-brown">
              <Package className="h-6 w-6" />
              <span className="font-bold text-xl">CakesBuy Admin</span>
            </Link>
          </div>
          
          <nav className="px-4 space-y-2 flex-1">
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
          
          <div className="p-4 border-t">
            <Link href="/">
              <Button variant="outline" className="w-full">
                Back to Store
              </Button>
            </Link>
          </div>
        </div>

        {/* Admin Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 min-h-full">
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
    // Admin login page should not be protected
    if (location === '/admin-login') {
      return (
        <>
          <ScrollRestoration />
          <AdminLogin />
        </>
      );
    }
    
    return (
      <AdminProtected>
        <AdminLayout>
          <ScrollRestoration />
          <Switch>
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/categories" component={AdminCategories} />
            <Route path="/admin/products" component={AdminProducts} />
            <Route path="/admin/addons" component={AdminAddons} />
            <Route path="/admin/orders" component={AdminOrders} />
            <Route path="/admin/users" component={AdminUsers} />
            <Route path="/admin/coupons" component={AdminCoupons} />
            <Route path="/admin/invoices" component={AdminInvoices} />
            <Route path="/admin/wallet" component={AdminWallet} />
            <Route path="/admin/reminders" component={AdminReminders} />
            <Route path="/admin/settings" component={AdminSettings} />
            <Route component={NotFound} />
          </Switch>
        </AdminLayout>
      </AdminProtected>
    );
  }

  // Regular customer routes
  return (
    <>
      <ScrollRestoration />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/search" component={SearchPage} />
        <Route path="/category/:slug" component={Category} />
        <Route path="/product/:slug" component={Product} />
        <Route path="/cart" component={Cart} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/delivery" component={DeliveryPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/otp-register" component={OtpAuthPage} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/admin-login" component={AdminLogin} />
        <Route path="/occasions" component={OccasionReminder} />
        <Route path="/occasion-reminder" component={OccasionReminder} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/orders" component={OrdersPage} />
        <Route path="/invoices" component={InvoicesPage} />
        <Route path="/invoices/:invoiceNumber" component={InvoiceDetailPage} />
        <Route path="/loyalty" component={LoyaltyPage} />
        <Route path="/track-order" component={TrackOrderPage} />
        <Route component={NotFound} />
      </Switch>
    </>
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
