import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Database, Trash2, Download, Upload, Mail, Send, FileText, FileDown, FileUp, AlertCircle, MessageCircle, CheckCircle, XCircle } from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<"products" | "categories" | "users">("products");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [authStatus, setAuthStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [whatsappStatus, setWhatsappStatus] = useState<any>(null);
  const [testWhatsAppPhone, setTestWhatsAppPhone] = useState("");
  const [testWhatsAppMessage, setTestWhatsAppMessage] = useState("");

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setAuthStatus('invalid');
        return;
      }

      // If we have a token, assume it's valid for now
      setAuthStatus('valid');
    };

    const checkWhatsApp = async () => {
      try {
        const response = await fetch('/api/admin/whatsapp/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          }
        });
        if (response.ok) {
          const status = await response.json();
          setWhatsappStatus(status);
        }
      } catch (error) {
        console.error('Failed to check WhatsApp status:', error);
      }
    };

    checkAuth();
    checkWhatsApp();
  }, []);

  const importDummyDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/admin/import-dummy-data", "POST");
      return response.json();
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
      const response = await apiRequest("/api/admin/clear-data", "DELETE");
      return response.json();
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
      const response = await apiRequest("/api/admin/test-email", "POST", { email });
      return response.json();
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

  const testWhatsAppMutation = useMutation({
    mutationFn: async ({ phone, message }: { phone: string; message: string }) => {
      const response = await apiRequest("/api/admin/whatsapp/test", "POST", { phone, message });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "WhatsApp test completed successfully",
      });
      setTestWhatsAppPhone("");
      setTestWhatsAppMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to test WhatsApp",
        variant: "destructive",
      });
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async (type: string) => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Please log in as admin to export data');
      }
      
      const response = await fetch(`/api/admin/export/${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Export failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return response.blob();
    },
    onSuccess: (blob, type) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `${type} data exported successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      // Use fetch with manual token since apiRequest doesn't support FormData
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Please log in as admin to upload files');
      }
      
      const response = await fetch('/api/admin/bulk-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Upload failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Successfully uploaded ${data.count} records`,
      });
      setSelectedFile(null);
      setPreviewData([]);
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload data",
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      parseCSVPreview(file);
    } else {
      toast({
        title: "Error",
        description: "Please select a valid CSV file",
        variant: "destructive",
      });
    }
  };

  const parseCSVPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0]?.split(',').map(h => h.trim());
      const preview = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: any = {};
        headers?.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });
      setPreviewData(preview);
    };
    reader.readAsText(file);
  };

  const handleExport = (type: string) => {
    exportDataMutation.mutate(type);
  };

  const handleBulkUpload = () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    bulkUploadMutation.mutate({ file: selectedFile, type: uploadType });
  };

  const handleDownloadSample = (type: string) => {
    const link = document.createElement('a');
    link.href = `/api/admin/sample-csv/${type}`;
    link.download = `sample_${type}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Sample Downloaded",
      description: `Sample ${type} CSV template downloaded successfully`,
    });
  };

  const getFieldsForType = (type: string) => {
    switch (type) {
      case 'products':
        return ['name', 'slug', 'description', 'flavors', 'weights', 'prices', 'category_id', 'images', 'is_bestseller', 'is_photo_cake'];
      case 'categories':
        return ['name', 'slug', 'description', 'image'];
      case 'users':
        return ['phone', 'email', 'name', 'role'];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-charcoal">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your application data and settings</p>
      </div>

      {authStatus === 'invalid' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Authentication Required</h3>
                <p className="text-sm text-red-700">
                  Your admin session has expired. Please{" "}
                  <a href="/admin-login" className="underline font-medium">
                    log in again
                  </a>{" "}
                  to use upload and export features.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="data-management" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="data-management">Data Management</TabsTrigger>
          <TabsTrigger value="import-export">Import & Export</TabsTrigger>
          <TabsTrigger value="email-testing">Email Testing</TabsTrigger>
          <TabsTrigger value="whatsapp-testing">WhatsApp Testing</TabsTrigger>
          <TabsTrigger value="app-info">App Info</TabsTrigger>
        </TabsList>

        <TabsContent value="data-management" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="import-export" className="space-y-6">
          {/* Export Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="h-5 w-5" />
                Export Data
              </CardTitle>
              <CardDescription>
                Download your data as CSV files for backup or external use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Button
                  onClick={() => handleExport('products')}
                  disabled={exportDataMutation.isPending}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                >
                  <FileText className="h-6 w-6" />
                  Export Products
                </Button>
                <Button
                  onClick={() => handleExport('categories')}
                  disabled={exportDataMutation.isPending}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                >
                  <FileText className="h-6 w-6" />
                  Export Categories
                </Button>
                <Button
                  onClick={() => handleExport('users')}
                  disabled={exportDataMutation.isPending}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                >
                  <FileText className="h-6 w-6" />
                  Export Users
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Import Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5" />
                Bulk Import Data
              </CardTitle>
              <CardDescription>
                Upload CSV files to bulk import products, categories, or users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sample CSV Downloads */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-3">Download Sample CSV Templates</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={() => handleDownloadSample('products')}
                    variant="outline"
                    size="sm"
                    className="h-auto flex-col gap-1 p-3"
                  >
                    <Download className="h-4 w-4" />
                    Products Sample
                  </Button>
                  <Button
                    onClick={() => handleDownloadSample('categories')}
                    variant="outline"
                    size="sm"
                    className="h-auto flex-col gap-1 p-3"
                  >
                    <Download className="h-4 w-4" />
                    Categories Sample
                  </Button>
                  <Button
                    onClick={() => handleDownloadSample('users')}
                    variant="outline"
                    size="sm"
                    className="h-auto flex-col gap-1 p-3"
                  >
                    <Download className="h-4 w-4" />
                    Users Sample
                  </Button>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Download these templates to see the required format and sample data for bulk imports.
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label htmlFor="uploadType">Select Import Type</Label>
                  <Select value={uploadType} onValueChange={(value) => setUploadType(value as any)}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select type to import" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="products">Products</SelectItem>
                      <SelectItem value="categories">Categories</SelectItem>
                      <SelectItem value="users">Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="csvFile">Select CSV File</Label>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="mt-1"
                  />
                </div>

                {selectedFile && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">File Details</h4>
                      <p className="text-sm text-gray-600">Name: {selectedFile.name}</p>
                      <p className="text-sm text-gray-600">Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
                      <p className="text-sm text-gray-600">Type: {uploadType}</p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Expected Fields for {uploadType}:</h4>
                      <div className="flex flex-wrap gap-2">
                        {getFieldsForType(uploadType).map((field) => (
                          <Badge key={field} variant="secondary">{field}</Badge>
                        ))}
                      </div>
                    </div>

                    {previewData.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Preview (First 5 rows):</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full border border-gray-300">
                            <thead className="bg-gray-50">
                              <tr>
                                {Object.keys(previewData[0]).map((header) => (
                                  <th key={header} className="px-4 py-2 text-left text-sm font-medium border-b">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.map((row, index) => (
                                <tr key={index} className="border-b">
                                  {Object.values(row).map((value: any, cellIndex) => (
                                    <td key={cellIndex} className="px-4 py-2 text-sm border-r">
                                      {String(value).substring(0, 50)}
                                      {String(value).length > 50 ? '...' : ''}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleBulkUpload}
                      disabled={bulkUploadMutation.isPending}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {bulkUploadMutation.isPending ? "Uploading..." : "Upload Data"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Import Guidelines:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• CSV files must have headers matching the expected fields</li>
                  <li>• Products require valid category_id references</li>
                  <li>• Use semicolon (;) to separate multiple values:</li>
                  <li>&nbsp;&nbsp;- flavors: "Chocolate;Vanilla;Strawberry"</li>
                  <li>&nbsp;&nbsp;- weights: "500g;1kg;2kg"</li>
                  <li>&nbsp;&nbsp;- prices: "700;1400;2500"</li>
                  <li>&nbsp;&nbsp;- images: "url1.jpg;url2.jpg"</li>
                  <li>• Ensure flavors, weights, and prices arrays have matching counts</li>
                  <li>• Users with duplicate phones will be skipped</li>
                  <li>• Always backup your data before importing</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email-testing" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="whatsapp-testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                WhatsApp Notifications
              </CardTitle>
              <CardDescription>
                Manage and test WhatsApp order notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* WhatsApp Status */}
              <div className="space-y-3">
                <h4 className="font-medium">Connection Status</h4>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  {whatsappStatus?.connected ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Connected</p>
                        <p className="text-sm text-green-600">WhatsApp is ready for order notifications</p>
                      </div>
                    </>
                  ) : whatsappStatus?.qrGenerated ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-800">QR Code Ready</p>
                        <p className="text-sm text-orange-600">Check server logs for QR code to scan</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-800">Disconnected</p>
                        <p className="text-sm text-red-600">WhatsApp service is initializing or unavailable</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* WhatsApp Test */}
              <div className="space-y-3">
                <h4 className="font-medium">Test WhatsApp Message</h4>
                <div className="space-y-2">
                  <Label htmlFor="testWhatsAppPhone">Phone Number (with country code)</Label>
                  <Input
                    id="testWhatsAppPhone"
                    type="tel"
                    placeholder="91XXXXXXXXXX"
                    value={testWhatsAppPhone}
                    onChange={(e) => setTestWhatsAppPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testWhatsAppMessage">Test Message</Label>
                  <Input
                    id="testWhatsAppMessage"
                    placeholder="Enter test message"
                    value={testWhatsAppMessage}
                    onChange={(e) => setTestWhatsAppMessage(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => testWhatsAppMutation.mutate({ phone: testWhatsAppPhone, message: testWhatsAppMessage })}
                  disabled={testWhatsAppMutation.isPending || !testWhatsAppPhone || !testWhatsAppMessage}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {testWhatsAppMutation.isPending ? "Testing..." : "Send Test Message"}
                </Button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">WhatsApp Features:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• ✅ Automatic order confirmation messages</li>
                  <li>• ✅ Delivery completion notifications</li>
                  <li>• ✅ Welcome messages for new customers</li>
                  <li>• ✅ Free messaging using WhatsApp Web</li>
                  <li>• ✅ Rich format with emojis and order details</li>
                  <li>• ✅ Supports Indian phone numbers (+91)</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Setup Instructions:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Check server console for QR code when service starts</li>
                  <li>Scan QR code with WhatsApp on your phone</li>
                  <li>Keep WhatsApp Web session active for notifications</li>
                  <li>Test with your phone number to verify setup</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="app-info" className="space-y-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}