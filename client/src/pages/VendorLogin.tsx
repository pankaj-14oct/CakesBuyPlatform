import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { vendorLoginSchema, type VendorLoginRequest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Store, ArrowLeft } from "lucide-react";

export default function VendorLogin() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<VendorLoginRequest>({
    resolver: zodResolver(vendorLoginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = async (data: VendorLoginRequest) => {
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("/api/vendors/login", {
        method: "POST",
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Store vendor token in localStorage
        localStorage.setItem("vendor_token", result.token);
        localStorage.setItem("vendor_info", JSON.stringify(result.vendor));
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${result.vendor.name}!`,
        });
        
        // Navigate to vendor dashboard
        navigate("/vendor-dashboard");
      } else {
        const error = await response.json();
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An error occurred during login",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-caramel-100 rounded-full mb-4">
              <Store className="h-8 w-8 text-caramel-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Login</h1>
            <p className="text-gray-600 mt-2">Access your vendor dashboard</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your vendor account to manage orders and products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="your@email.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Your password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/vendor-register" className="text-caramel-600 hover:underline">
                Register here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}