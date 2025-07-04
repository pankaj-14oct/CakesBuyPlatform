import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { forgotPasswordSchema, resetPasswordSchema } from "@shared/schema";
import { z } from "zod";

export default function ForgotPassword() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Step 1: Send OTP form
  const phoneForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      phone: "",
    },
  });

  // Step 2: Reset password form
  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      phone: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const sendOtpMutation = useMutation({
    mutationFn: async (data: z.infer<typeof forgotPasswordSchema>) => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to send OTP");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "OTP Sent!",
        description: "Password reset OTP has been sent to your phone.",
      });
      setPhone(phoneForm.getValues().phone);
      setOtp(data.otp || ''); // For demo purposes
      setStep('otp');
      resetForm.setValue('phone', phoneForm.getValues().phone);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof resetPasswordSchema>) => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to reset password");
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Successful!",
        description: "Your password has been reset. You can now login with your new password.",
      });
      navigate("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSendOtp = (values: z.infer<typeof forgotPasswordSchema>) => {
    sendOtpMutation.mutate(values);
  };

  const onResetPassword = (values: z.infer<typeof resetPasswordSchema>) => {
    resetPasswordMutation.mutate(values);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-orange-800">
            Reset Password
          </CardTitle>
          <CardDescription className="text-center">
            {step === 'phone' 
              ? "Enter your phone number to receive a password reset OTP"
              : "Enter the OTP and your new password"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'phone' ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onSendOtp)} className="space-y-4">
                <FormField
                  control={phoneForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your 10-digit phone number"
                          {...field}
                          disabled={sendOtpMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={sendOtpMutation.isPending}
                >
                  {sendOtpMutation.isPending ? "Sending OTP..." : "Send Reset OTP"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Demo OTP:</strong> {otp}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    In production, this would be sent via SMS
                  </p>
                </div>
                
                <FormField
                  control={resetForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OTP</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter 6-digit OTP"
                          {...field}
                          disabled={resetPasswordMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={resetForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Enter new password"
                          {...field}
                          disabled={resetPasswordMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={resetForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Confirm new password"
                          {...field}
                          disabled={resetPasswordMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setStep('phone')}
                    disabled={resetPasswordMutation.isPending}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
          
          <div className="text-center text-sm text-gray-600">
            Remember your password?{" "}
            <Link href="/auth" className="text-orange-600 hover:text-orange-800 font-medium">
              Login here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}