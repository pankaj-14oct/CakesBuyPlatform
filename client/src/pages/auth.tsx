import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useLocation, Link } from 'wouter';
import { Cake, User, Mail, Lock, Phone, ArrowLeft, Wallet, Gift, Star } from 'lucide-react';
import WelcomeCelebration from '@/components/WelcomeCelebration';

const loginSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const registerSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [showCelebration, setShowCelebration] = useState(false);
  const { user, loginMutation, registerMutation, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();







  // Redirect if already logged in (but not if showing celebration)
  useEffect(() => {
    if (isAuthenticated && !showCelebration) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation, showCelebration]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: ''
    }
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterForm) => {
    registerMutation.mutate(data, {
      onSuccess: (response) => {
        // Show celebration modal immediately before any redirect
        setShowCelebration(true);
      }
    });
  };



  // Don't render if user is authenticated (unless showing celebration)
  if (isAuthenticated && !showCelebration) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[600px]">
          {/* Left Side - Form */}
          <div className="w-full lg:w-1/2 p-4 sm:p-8 lg:p-12">
            {/* Mobile Back Button */}
            <div className="lg:hidden mb-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 p-0"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Button>
            </div>
            
            <div className="mb-8">
              <div className="flex items-center mb-4 sm:mb-6">
                <Cake className="h-6 w-6 sm:h-8 sm:w-8 text-caramel mr-2 sm:mr-3" />
                <h1 className="text-xl sm:text-2xl font-bold text-charcoal">CakesBuy</h1>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-charcoal mb-2">
                {activeTab === 'login' ? 'Welcome Back!' : 'Create Account'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                {activeTab === 'login' 
                  ? 'Sign in to your account to continue ordering delicious cakes'
                  : 'Join CakesBuy and start ordering 100% eggless cakes'
                }
              </p>
              
              {/* Wallet Reward Banner for Signup */}
              {activeTab === 'register' && (
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Gift className="h-5 w-5 text-orange-600" />
                    <span className="text-lg font-bold text-orange-800">Welcome Bonus!</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Wallet className="h-6 w-6 text-orange-600" />
                      <span className="text-2xl font-bold text-orange-800">₹50</span>
                      <span className="text-sm text-orange-700">instant wallet credit</span>
                    </div>
                    <p className="text-xs text-orange-600 font-medium">Use immediately on your first order!</p>
                  </div>
                </div>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8 bg-gray-100">
                <TabsTrigger value="login" className="data-[state=active]:bg-white text-sm sm:text-base">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-white text-sm sm:text-base">Sign Up</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-6">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-3 sm:space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-charcoal font-medium text-sm sm:text-base">Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type="tel"
                                placeholder="Enter your phone number"
                                className="pl-10 border-gray-300 focus:border-caramel focus:ring-caramel/20"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-charcoal font-medium text-sm sm:text-base">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type="password"
                                placeholder="Enter your password"
                                className="pl-10 border-gray-300 focus:border-caramel focus:ring-caramel/20"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="text-right">
                      <Link href="/forgot-password" className="text-caramel hover:text-brown text-sm font-medium">
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-caramel hover:bg-brown text-white py-3 font-medium"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-6">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-3 sm:space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-charcoal font-medium text-sm sm:text-base">Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type="tel"
                                placeholder="Enter your phone number"
                                className="pl-10 border-gray-300 focus:border-caramel focus:ring-caramel/20"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-charcoal font-medium text-sm sm:text-base">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type="email"
                                placeholder="Enter your email"
                                className="pl-10 border-gray-300 focus:border-caramel focus:ring-caramel/20"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-charcoal font-medium text-sm sm:text-base">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type="password"
                                placeholder="Create a password"
                                className="pl-10 border-gray-300 focus:border-caramel focus:ring-caramel/20"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-charcoal font-medium text-sm sm:text-base">Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type="password"
                                placeholder="Confirm your password"
                                className="pl-10 border-gray-300 focus:border-caramel focus:ring-caramel/20"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={registerMutation.isPending}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Gift className="h-5 w-5" />
                        <span>{registerMutation.isPending ? 'Creating Account...' : 'Create Account & Get ₹50'}</span>
                      </div>
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Side - Text Area */}
          <div className="w-full lg:w-1/2 bg-gradient-to-br from-caramel to-brown p-6 sm:p-8 lg:p-12 flex items-center justify-center text-white">
            <div className="text-center max-w-md">
              <div className="mb-6 sm:mb-8">
                <Cake className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-4 sm:mb-6 opacity-90" />
                <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                  {activeTab === 'login' ? 'Sweet Moments Await!' : 'Join & Get ₹50 Instantly!'}
                </h3>
                <p className="text-base sm:text-lg opacity-90 leading-relaxed">
                  {activeTab === 'login' 
                    ? 'Welcome back to CakesBuy - your trusted partner for 100% eggless cakes. Continue your sweet journey with us and create memorable moments with every bite.'
                    : 'Sign up now and get ₹50 wallet credit instantly! Discover the joy of 100% eggless cakes made with love. Join thousands of happy customers who trust CakesBuy for their special celebrations.'
                  }
                </p>
              </div>
              
              <div className="space-y-3 sm:space-y-4 text-left">
                {activeTab === 'register' && (
                  <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <span className="text-sm sm:text-base font-semibold">₹50 Instant Wallet Credit</span>
                      <p className="text-xs opacity-80">Use immediately on your first order!</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">✓</span>
                  </div>
                  <span className="text-sm sm:text-base">100% Eggless & Fresh Cakes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">✓</span>
                  </div>
                  <span className="text-sm sm:text-base">Same Day Delivery in Gurgaon</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">✓</span>
                  </div>
                  <span className="text-sm sm:text-base">Custom Photo Cakes Available</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">✓</span>
                  </div>
                  <span className="text-sm sm:text-base">Loyalty Rewards & Special Offers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      


      {/* Welcome Celebration Modal */}
      <WelcomeCelebration 
        isVisible={showCelebration}
        onClose={() => {
          setShowCelebration(false);
          setLocation('/');
        }}
      />
    </div>
  );
}