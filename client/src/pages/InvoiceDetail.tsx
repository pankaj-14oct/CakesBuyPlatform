import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { FileText, Download, ArrowLeft, Calendar, Phone, Mail, MapPin } from "lucide-react";
import { Link } from "wouter";

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

export default function InvoiceDetailPage() {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const { isAuthenticated } = useAuth();

  const { data: invoice, isLoading, error } = useQuery<InvoiceDisplayData>({
    queryKey: ['/api/invoices', invoiceNumber],
    enabled: !!invoiceNumber
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePrint = () => {
    window.print();
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Invoice Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">The requested invoice could not be found.</p>
            <Link href="/invoices">
              <Button variant="outline">
                Back to Invoices
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <Link href="/invoices">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Invoices
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Invoice Details</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Download className="h-4 w-4 mr-2" />
              Print/Save PDF
            </Button>
          </div>
        </div>

        {/* Invoice Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold text-red-800">
                  CakesBuy
                </CardTitle>
                <p className="text-red-600 mt-1">100% Eggless Cake Shop</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                <p className="text-gray-600">{invoice.invoiceNumber}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {/* Invoice Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Bill To:</h3>
                <div className="space-y-2 text-gray-700">
                  <p className="font-medium">{invoice.customerName}</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{invoice.customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{invoice.customerPhone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <p>{invoice.billingAddress.address}</p>
                      <p>{invoice.billingAddress.city}, {invoice.billingAddress.pincode}</p>
                      {invoice.billingAddress.landmark && (
                        <p className="text-sm text-gray-500">Near {invoice.billingAddress.landmark}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Invoice Details:</h3>
                <div className="space-y-2 text-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Issue Date: {invoice.invoiceDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Due Date: {invoice.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Status:</span>
                    <Badge className={getStatusColor(invoice.paymentStatus)}>
                      {invoice.paymentStatus.toUpperCase()}
                    </Badge>
                  </div>
                  {invoice.paymentMethod && (
                    <div className="flex items-center gap-2">
                      <span>Payment Method:</span>
                      <span className="font-medium">{invoice.paymentMethod.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Items:</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Item</th>
                      <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Qty</th>
                      <th className="border border-gray-200 px-4 py-3 text-right font-semibold">Unit Price</th>
                      <th className="border border-gray-200 px-4 py-3 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-gray-500">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">{item.quantity}</td>
                        <td className="border border-gray-200 px-4 py-3 text-right">₹{item.unitPrice}</td>
                        <td className="border border-gray-200 px-4 py-3 text-right font-medium">₹{item.totalPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-full max-w-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{invoice.subtotal}</span>
                  </div>
                  {parseFloat(invoice.discountAmount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-₹{invoice.discountAmount}</span>
                    </div>
                  )}
                  {parseFloat(invoice.deliveryFee) > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>₹{invoice.deliveryFee}</span>
                    </div>
                  )}
                  {parseFloat(invoice.taxAmount) > 0 && (
                    <div className="flex justify-between">
                      <span>Tax (18%):</span>
                      <span>₹{invoice.taxAmount}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>₹{invoice.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Notes:</h3>
                <p className="text-gray-700">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t pt-6 text-center text-gray-600">
              <p className="mb-2">Thank you for choosing CakesBuy!</p>
              <p className="text-sm">
                For any questions about this invoice, please contact us at{' '}
                <span className="font-medium">order.cakesbuy@gmail.com</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}