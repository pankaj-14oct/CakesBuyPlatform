import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";

interface AdminProtectedProps {
  children: React.ReactNode;
}

export default function AdminProtected({ children }: AdminProtectedProps) {
  const [, setLocation] = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsVerifying(false);
          return;
        }

        // Try to access an admin endpoint to verify admin status
        const response = await apiRequest("/api/admin/users", "GET");
        if (response.ok) {
          setIsAdmin(true);
        } else {
          // If admin verification fails, clear token and redirect to admin login
          localStorage.removeItem('token');
          setIsVerifying(false);
        }
      } catch (error) {
        console.log("Admin verification failed:", error);
        // Clear invalid token and redirect to admin login
        localStorage.removeItem('token');
        setIsVerifying(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAdmin();
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-caramel-50 to-brown-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-caramel-600" />
              <p className="text-center text-gray-600">Verifying admin access...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-caramel-50 to-brown-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-charcoal">Access Denied</CardTitle>
              <CardDescription>
                You need admin privileges to access this area
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Please log in with an admin account to continue.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => setLocation("/admin-login")}
                className="w-full bg-caramel-600 hover:bg-caramel-700"
              >
                Go to Admin Login
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="w-full"
              >
                Back to Main Site
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}