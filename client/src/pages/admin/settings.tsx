import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Database, Trash2, Download, Upload, Mail, Send } from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const importDummyDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/import-dummy-data");
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dummy data imported successfully",
      });
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import dummy data",
        variant: "destructive",
      });
    },
  });

  const clearDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/admin/clear-data");
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "All data cleared successfully",
      });
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear data",
        variant: "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/admin/test-email", { email });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test email sent successfully",
      });
      setTestEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    },
  });

  const handleImportDummyData = () => {
    setIsLoading(true);
    importDummyDataMutation.mutate();
    setIsLoading(false);
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to delete all data? This action cannot be undone.")) {
      setIsLoading(true);
      clearDataMutation.mutate();
      setIsLoading(false);
    }
  };

  const handleTestEmail = () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    testEmailMutation.mutate(testEmail);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-charcoal">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your application data and settings</p>
      </div>

      <div className="grid gap-6">
        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Import dummy data for testing or clear all existing data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">Import Dummy Data</h3>
                <p className="text-sm text-gray-600">
                  Creates sample data for testing and development
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary">25 Products</Badge>
                  <Badge variant="secondary">10 Categories</Badge>
                  <Badge variant="secondary">10 Users</Badge>
                  <Badge variant="secondary">5 Orders</Badge>
                </div>
                <Button 
                  onClick={handleImportDummyData}
                  disabled={importDummyDataMutation.isPending || isLoading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {importDummyDataMutation.isPending ? "Importing..." : "Import Dummy Data"}
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-red-600">Clear All Data</h3>
                <p className="text-sm text-gray-600">
                  Permanently delete all products, categories, users, and orders
                </p>
                <div className="mb-3">
                  <Badge variant="destructive">Destructive Action</Badge>
                </div>
                <Button 
                  onClick={handleClearData}
                  disabled={clearDataMutation.isPending || isLoading}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {clearDataMutation.isPending ? "Clearing..." : "Clear All Data"}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Dummy data import will add to existing data, not replace it</li>
                <li>• Clear data action is permanent and cannot be undone</li>
                <li>• Always backup important data before performing destructive actions</li>
                <li>• Import creates realistic sample data for development and testing</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Email Service Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Service Testing
            </CardTitle>
            <CardDescription>
              Test email functionality and verify service configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Test Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="Enter email address to test"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleTestEmail}
                  disabled={testEmailMutation.isPending || !testEmail}
                  className="min-w-[100px]"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {testEmailMutation.isPending ? "Sending..." : "Send Test"}
                </Button>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Email Testing Information:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• This will send a test email to verify service configuration</li>
                <li>• Check that Gmail SMTP credentials are properly configured</li>
                <li>• Useful for testing before sending customer notifications</li>
                <li>• Test email includes system information and timestamp</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Application Info */}
        <Card>
          <CardHeader>
            <CardTitle>Application Information</CardTitle>
            <CardDescription>
              Current application status and configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Environment</h4>
                <p className="text-sm text-gray-600">Development</p>
              </div>
              <div>
                <h4 className="font-medium">Database</h4>
                <p className="text-sm text-gray-600">PostgreSQL (Connected)</p>
              </div>
              <div>
                <h4 className="font-medium">Version</h4>
                <p className="text-sm text-gray-600">1.0.0</p>
              </div>
              <div>
                <h4 className="font-medium">Platform</h4>
                <p className="text-sm text-gray-600">Replit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}