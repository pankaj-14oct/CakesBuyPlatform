import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Phone, Lock, User, Mail, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

// Form schemas
const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
});

const otpVerifySchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const registerSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm = z.infer<typeof otpVerifySchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function OtpAuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [phone, setPhone] = useState('');
  const [otpData, setOtpData] = useState<{ otp: string } | null>(null);

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' }
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { otp: '' }
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  // Send OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: async (data: PhoneForm) => {
      const response = await apiRequest('POST', '/api/auth/send-otp', data);
      return response.json();
    },
    onSuccess: (data) => {
      setPhone(phoneForm.getValues('phone'));
      setOtpData(data); // For demo - contains the OTP
      setStep('otp');
      toast({
        title: "OTP Sent",
        description: `OTP sent to ${phoneForm.getValues('phone')}. For demo: ${data.otp}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    },
  });

  // Register with OTP mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm & { phone: string; otp: string }) => {
      const response = await apiRequest('POST', '/api/auth/register-with-otp', data);
      return response.json();
    },
    onSuccess: (data) => {
      // Store the JWT token
      localStorage.setItem('authToken', data.token);
      toast({
        title: "Registration Successful",
        description: "Welcome to EgglessCakes!",
      });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register",
        variant: "destructive",
      });
    },
  });

  const onPhoneSubmit = (data: PhoneForm) => {
    sendOtpMutation.mutate(data);
  };

  const onOtpSubmit = (data: OtpForm) => {
    setStep('register');
    toast({
      title: "OTP Verified",
      description: "Please complete your registration",
    });
  };

  const onRegisterSubmit = (data: RegisterForm) => {
    if (!otpData) return;
    
    registerMutation.mutate({
      ...data,
      phone,
      otp: otpForm.getValues('otp')
    });
  };

  const goBack = () => {
    if (step === 'otp') {
      setStep('phone');
    } else if (step === 'register') {
      setStep('otp');
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Card className="border-caramel/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              {step !== 'phone' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBack}
                  className="absolute left-6"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="bg-caramel/10 p-3 rounded-full">
                {step === 'phone' && <Phone className="h-6 w-6 text-caramel" />}
                {step === 'otp' && <Lock className="h-6 w-6 text-caramel" />}
                {step === 'register' && <User className="h-6 w-6 text-caramel" />}
              </div>
            </div>
            <CardTitle className="text-2xl text-charcoal">
              {step === 'phone' && 'Enter Phone Number'}
              {step === 'otp' && 'Verify OTP'}
              {step === 'register' && 'Complete Registration'}
            </CardTitle>
            <CardDescription>
              {step === 'phone' && 'We\'ll send you a verification code'}
              {step === 'otp' && `Enter the 6-digit code sent to ${phone}`}
              {step === 'register' && 'Create your EgglessCakes account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'phone' && (
              <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-6">
                  <FormField
                    control={phoneForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-charcoal opacity-50" />
                            <Input
                              {...field}
                              placeholder="9876543210"
                              className="pl-10"
                              maxLength={10}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-caramel hover:bg-brown"
                    disabled={sendOtpMutation.isPending}
                  >
                    {sendOtpMutation.isPending ? 'Sending OTP...' : 'Send OTP'}
                  </Button>
                </form>
              </Form>
            )}

            {step === 'otp' && (
              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OTP Code</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-charcoal opacity-50" />
                            <Input
                              {...field}
                              placeholder="123456"
                              className="pl-10 text-center text-lg tracking-widest"
                              maxLength={6}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        {otpData && (
                          <p className="text-sm text-caramel">
                            Demo OTP: {otpData.otp}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-caramel hover:bg-brown"
                  >
                    Verify OTP
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => sendOtpMutation.mutate({ phone })}
                    disabled={sendOtpMutation.isPending}
                  >
                    {sendOtpMutation.isPending ? 'Resending...' : 'Resend OTP'}
                  </Button>
                </form>
              </Form>
            )}

            {step === 'register' && (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-charcoal opacity-50" />
                            <Input {...field} placeholder="johndoe" className="pl-10" />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-charcoal opacity-50" />
                            <Input {...field} type="email" placeholder="john@example.com" className="pl-10" />
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
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-charcoal opacity-50" />
                            <Input {...field} type="password" placeholder="••••••" className="pl-10" />
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
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-charcoal opacity-50" />
                            <Input {...field} type="password" placeholder="••••••" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-caramel hover:bg-brown"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </Form>
            )}

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => setLocation('/auth')}
                className="text-caramel"
              >
                Use email/password instead
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}