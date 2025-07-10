import { useState } from 'react';
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
import { Cake, User, Mail, Lock, Phone } from 'lucide-react';
import { useEffect } from 'react';

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
  const { user, loginMutation, registerMutation, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

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
    registerMutation.mutate(data);
  };

  // Don't render if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-red-400/50 rounded-full p-4">
              <User className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">My Account</h1>
          <p className="text-white/90 text-sm">Welcome to CakesBuy</p>
        </div>

        <div className="bg-red-400/30 backdrop-blur-sm rounded-2xl border border-red-400/40 p-6 shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-red-400/40 backdrop-blur-sm border-0 mb-6 p-1 rounded-xl">
              <TabsTrigger 
                value="login" 
                className="text-white data-[state=active]:bg-red-400/60 data-[state=active]:text-white rounded-lg py-2 text-sm font-medium"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="text-white data-[state=active]:bg-red-400/60 data-[state=active]:text-white rounded-lg py-2 text-sm font-medium"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm font-medium">Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                              <Input
                                {...field}
                                type="tel"
                                placeholder="Enter your phone number"
                                className="pl-10 bg-red-400/40 border-red-400/50 text-white placeholder:text-white/70 focus:border-red-300 focus:ring-red-300/50 rounded-lg"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-200" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm font-medium">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                              <Input
                                {...field}
                                type="password"
                                placeholder="Enter your password"
                                className="pl-10 bg-red-400/40 border-red-400/50 text-white placeholder:text-white/70 focus:border-red-300 focus:ring-red-300/50 rounded-lg"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-200" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-red-400/60 hover:bg-red-400/70 text-white border-0 rounded-lg py-3 font-medium"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-4 text-center text-sm">
                  <Link href="/forgot-password" className="text-white/80 hover:text-white font-medium">
                    Forgot your password?
                  </Link>
                </div>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-white mb-1">Create Account</h2>
                <p className="text-white/80 text-sm">Join CakesBuy and start ordering delicious cakes</p>
              </div>
                
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm font-medium">Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                              <Input
                                {...field}
                                type="tel"
                                placeholder="Enter your phone number"
                                className="pl-10 bg-red-400/40 border-red-400/50 text-white placeholder:text-white/70 focus:border-red-300 focus:ring-red-300/50 rounded-lg"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-200" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm font-medium">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                              <Input
                                {...field}
                                type="email"
                                placeholder="Enter your email"
                                className="pl-10 bg-red-400/40 border-red-400/50 text-white placeholder:text-white/70 focus:border-red-300 focus:ring-red-300/50 rounded-lg"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-200" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm font-medium">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                              <Input
                                {...field}
                                type="password"
                                placeholder="Create a password"
                                className="pl-10 bg-red-400/40 border-red-400/50 text-white placeholder:text-white/70 focus:border-red-300 focus:ring-red-300/50 rounded-lg"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-200" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm font-medium">Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                              <Input
                                {...field}
                                type="password"
                                placeholder="Confirm your password"
                                className="pl-10 bg-red-400/40 border-red-400/50 text-white placeholder:text-white/70 focus:border-red-300 focus:ring-red-300/50 rounded-lg"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-200" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-red-400/60 hover:bg-red-400/70 text-white border-0 rounded-lg py-3 font-medium"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}