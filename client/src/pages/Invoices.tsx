import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { FileText, Download, Eye, Calendar, CreditCard, Package } from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface InvoiceDisplayData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress: {
    address: string;
    pincode: string;
    city: string;
    landmark?: string;
  };
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: string;
  discountAmount: string;
  deliveryFee: string;
  taxAmount: string;
  totalAmount: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  notes?: string;
  terms?: string;
  order?: any;
}

const InvoiceDetailsModal = ({ invoice }: { invoice: InvoiceDisplayData }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Invoice {invoice.invoiceNumber}
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Bill To:</h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{invoice.customerName}</p>
              {invoice.customerEmail !== 'N/A' && <p>{invoice.customerEmail}</p>}
              <p>{invoice.customerPhone}</p>
              <p>{invoice.billingAddress.address}</p>
              <p>{invoice.billingAddress.city}, {invoice.billingAddress.pincode}</p>
              {invoice.billingAddress.landmark && <p>{invoice.billingAddress.landmark}</p>}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-2">Invoice Details:</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Invoice Date:</span> {invoice.invoiceDate}</p>
              <p><span className="font-medium">Due Date:</span> {invoice.dueDate}</p>
              <p><span className="font-medium">Payment Status:</span> 
                <Badge className={`ml-2 ${getStatusColor(invoice.paymentStatus)}`}>
                  {invoice.paymentStatus.toUpperCase()}
                </Badge>
              </p>
              {invoice.paymentMethod && (
                <p><span className="font-medium">Payment Method:</span> {invoice.paymentMethod.toUpperCase()}</p>
              )}
              {invoice.order && (
                <p><span className="font-medium">Order Number:</span> {invoice.order.orderNumber}</p>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Items:</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Qty</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Unit Price</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right">₹{item.totalPrice.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{invoice.subtotal}</span>
            </div>
            {invoice.discountAmount !== '₹0' && (
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span className="text-green-600">-{invoice.discountAmount}</span>
              </div>
            )}
            {invoice.deliveryFee !== '₹0' && (
              <div className="flex justify-between text-sm">
                <span>Delivery Fee:</span>
                <span>{invoice.deliveryFee}</span>
              </div>
            )}
            {invoice.taxAmount !== '₹0' && (
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>{invoice.taxAmount}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total Amount:</span>
              <span>{invoice.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="space-y-4">
            {invoice.notes && (
              <div>
                <h4 className="font-medium mb-2">Notes:</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{invoice.notes}</p>
              </div>
            )}
            
            {invoice.terms && (
              <div>
                <h4 className="font-medium mb-2">Terms & Conditions:</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DialogContent>
  );
};

export default function Invoices() {
  const { user } = useAuth();

  const { data: invoices = [], isLoading } = useQuery<InvoiceDisplayData[]>({
    queryKey: ["/api/auth/invoices"],
    enabled: !!user,
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-800">Login Required</CardTitle>
            <CardDescription>
              Please login to view your invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                Login / Register
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Invoices</h1>
              <p className="text-gray-600 mt-1">View and download your order invoices</p>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Yet</h3>
              <p className="text-gray-600 mb-6">
                Your invoices will appear here once you place an order
              </p>
              <Link href="/cakes">
                <Button className="bg-red-600 hover:bg-red-700">
                  <Package className="h-4 w-4 mr-2" />
                  Browse Cakes
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invoices.map((invoice) => (
              <Card key={invoice.invoiceNumber} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{invoice.invoiceNumber}</span>
                    <Badge className={getStatusColor(invoice.paymentStatus)}>
                      {invoice.paymentStatus.toUpperCase()}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {invoice.invoiceDate}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Amount:</span>
                      <span className="font-semibold text-lg">{invoice.totalAmount}</span>
                    </div>
                    
                    {invoice.paymentMethod && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <CreditCard className="h-4 w-4" />
                        {invoice.paymentMethod.toUpperCase()}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <InvoiceDetailsModal invoice={invoice} />
                      </Dialog>
                      
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}