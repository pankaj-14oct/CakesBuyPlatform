import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Eye, 
  Settings, 
  Download, 
  Search, 
  Calendar,
  DollarSign,
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
  CreditCard
} from "lucide-react";

interface Invoice {
  id: number;
  invoiceNumber: string;
  orderId: number;
  userId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    description?: string;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  taxRate: number;
  paymentTerms: string;
  notes: string;
  logoUrl?: string;
}

export default function AdminInvoices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    companyName: "CakesBuy",
    companyAddress: "Sector 14, Gurgaon, Haryana 122001",
    companyPhone: "+91 99999 99999",
    companyEmail: "order.cakesbuy@gmail.com",
    taxRate: 18,
    paymentTerms: "Payment is due within 15 days",
    notes: "Thank you for your business! We appreciate your trust in CakesBuy for your special occasions.",
    logoUrl: ""
  });

  // Fetch all invoices
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/admin/invoices"],
  });

  // Update invoice settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: InvoiceSettings) => {
      const response = await apiRequest("/api/admin/invoice-settings", "PUT", settings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice settings",
        variant: "destructive",
      });
    },
  });

  // Update invoice status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest(`/api/admin/invoices/${id}/status`, "PATCH", { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice status",
        variant: "destructive",
      });
    },
  });

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(invoiceSettings);
  };

  const handleUpdateStatus = (invoiceId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: invoiceId, status: newStatus });
  };

  const renderInvoicePreview = (invoice: Invoice) => (
    <div className="bg-white p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-caramel-600">{invoiceSettings.companyName}</h1>
          <p className="text-gray-600 mt-2">{invoiceSettings.companyAddress}</p>
          <p className="text-gray-600">{invoiceSettings.companyPhone}</p>
          <p className="text-gray-600">{invoiceSettings.companyEmail}</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
          <p className="text-gray-600 mt-2">#{invoice.invoiceNumber}</p>
          <p className="text-gray-600">Date: {new Date(invoice.issueDate).toLocaleDateString()}</p>
          <p className="text-gray-600">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill To:</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-medium text-gray-900">{invoice.customerName}</p>
          <p className="text-gray-600">{invoice.customerEmail}</p>
          <p className="text-gray-600">{invoice.customerPhone}</p>
          {invoice.billingAddress && (
            <div className="text-gray-600">
              {typeof invoice.billingAddress === 'string' ? (
                <p>{invoice.billingAddress}</p>
              ) : (
                <div>
                  <p>{(invoice.billingAddress as any).address}</p>
                  <p>{(invoice.billingAddress as any).city} - {(invoice.billingAddress as any).pincode}</p>
                  {(invoice.billingAddress as any).landmark && (
                    <p>Landmark: {(invoice.billingAddress as any).landmark}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="mb-8">
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 p-3 text-left">Item</th>
              <th className="border border-gray-200 p-3 text-center">Qty</th>
              <th className="border border-gray-200 p-3 text-right">Price</th>
              <th className="border border-gray-200 p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-200 p-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                  </div>
                </td>
                <td className="border border-gray-200 p-3 text-center">{item.quantity}</td>
                <td className="border border-gray-200 p-3 text-right">₹{Number(item.price).toFixed(2)}</td>
                <td className="border border-gray-200 p-3 text-right">₹{(Number(item.quantity) * Number(item.price)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">₹{Number(invoice.subtotal).toFixed(2)}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Discount:</span>
              <span className="font-medium text-green-600">-₹{Number(invoice.discountAmount).toFixed(2)}</span>
            </div>
          )}
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Tax ({invoiceSettings.taxRate}%):</span>
              <span className="font-medium">₹{Number(invoice.taxAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t border-gray-200">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-lg font-bold text-caramel-600">₹{Number(invoice.totalAmount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Information</h3>
          <p className="text-gray-600">Method: {invoice.paymentMethod.toUpperCase()}</p>
          <p className="text-gray-600">Status: {invoice.paymentStatus}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Terms</h3>
          <p className="text-gray-600">{invoiceSettings.paymentTerms}</p>
        </div>
      </div>

      {/* Notes */}
      {invoiceSettings.notes && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
          <p className="text-gray-600">{invoiceSettings.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
        <p>Thank you for your business!</p>
        <p>Generated on {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-charcoal">Invoice Management</h1>
        <p className="text-gray-600 mt-2">Manage invoices, settings, and preview templates</p>
      </div>

      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoices">All Invoices</TabsTrigger>
          <TabsTrigger value="settings">Invoice Settings</TabsTrigger>
          <TabsTrigger value="preview">Preview Template</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by invoice number, customer name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoices List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Invoices ({filteredInvoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading invoices...</div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? "No invoices found matching your search." : "No invoices found."}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInvoices.map((invoice) => (
                    <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-gray-900">#{invoice.invoiceNumber}</h3>
                            <Badge className={getStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                            <Badge className={getPaymentStatusColor(invoice.paymentStatus)}>
                              {invoice.paymentStatus}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <p><strong>Customer:</strong> {invoice.customerName}</p>
                            <p><strong>Email:</strong> {invoice.customerEmail}</p>
                            <p><strong>Amount:</strong> ₹{Number(invoice.totalAmount).toFixed(2)}</p>
                            <p><strong>Date:</strong> {new Date(invoice.issueDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedInvoice(invoice)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Invoice #{invoice.invoiceNumber}</DialogTitle>
                              </DialogHeader>
                              {selectedInvoice && renderInvoicePreview(selectedInvoice)}
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(invoice.id, invoice.status === 'pending' ? 'paid' : 'pending')}
                            disabled={updateStatusMutation.isPending}
                          >
                            {invoice.status === 'pending' ? 'Mark Paid' : 'Mark Pending'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Invoice Settings
              </CardTitle>
              <CardDescription>
                Configure your invoice template and company information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={invoiceSettings.companyName}
                      onChange={(e) => setInvoiceSettings(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyEmail">Company Email</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={invoiceSettings.companyEmail}
                      onChange={(e) => setInvoiceSettings(prev => ({ ...prev, companyEmail: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyPhone">Company Phone</Label>
                    <Input
                      id="companyPhone"
                      value={invoiceSettings.companyPhone}
                      onChange={(e) => setInvoiceSettings(prev => ({ ...prev, companyPhone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyAddress">Company Address</Label>
                    <Textarea
                      id="companyAddress"
                      value={invoiceSettings.companyAddress}
                      onChange={(e) => setInvoiceSettings(prev => ({ ...prev, companyAddress: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={invoiceSettings.taxRate}
                      onChange={(e) => setInvoiceSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Input
                    id="paymentTerms"
                    value={invoiceSettings.paymentTerms}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Default Notes</Label>
                  <Textarea
                    id="notes"
                    value={invoiceSettings.notes}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="bg-caramel-600 hover:bg-caramel-700"
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Invoice Template Preview
              </CardTitle>
              <CardDescription>
                Preview how your invoices will look with current settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Sample Invoice for Preview */}
              {renderInvoicePreview({
                id: 1,
                invoiceNumber: "INV-SAMPLE-001",
                orderId: 1,
                userId: 1,
                customerName: "John Doe",
                customerEmail: "john@example.com",
                customerPhone: "+91 98765 43210",
                billingAddress: "123 Main Street, Sector 15, Gurgaon, Haryana 122001",
                items: [
                  {
                    name: "Chocolate Truffle Cake",
                    quantity: 1,
                    price: 1299,
                    description: "1kg, Dark Chocolate flavor"
                  },
                  {
                    name: "Birthday Candles",
                    quantity: 1,
                    price: 99,
                    description: "Set of 10 candles"
                  }
                ],
                subtotal: 1398,
                taxAmount: 251.64,
                discountAmount: 0,
                totalAmount: 1649.64,
                paymentMethod: "cod",
                paymentStatus: "pending",
                status: "pending",
                issueDate: new Date().toISOString(),
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                notes: "Sample invoice for preview",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}