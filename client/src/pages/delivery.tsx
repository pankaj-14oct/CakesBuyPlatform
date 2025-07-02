import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Truck, Phone, CheckCircle, XCircle } from 'lucide-react';

export default function DeliveryPage() {
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');

  const checkDelivery = async () => {
    if (!pincode) {
      setError('Please enter a pincode');
      return;
    }
    
    setIsChecking(true);
    setError('');
    setDeliveryInfo(null);
    
    try {
      const response = await fetch(`/api/delivery-areas/check/${pincode}`);
      const data = await response.json();
      setDeliveryInfo(data);
    } catch (error) {
      console.error('Error checking delivery:', error);
      setError('Error checking delivery area. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const availablePincodes = [
    '122001', '122002', '122003', '122004', '122005', '122006', 
    '122007', '122009', '122011', '122012', '122015', '122016', 
    '122017', '122018', '122051', '122052'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-4">
            Online Delivery - Gurgaon
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We deliver fresh, 100% eggless cakes across Gurgaon with same-day delivery options. 
            Check if we deliver to your area below.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Pincode Checker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-caramel" />
                Check Delivery Availability
              </CardTitle>
              <CardDescription>
                Enter your pincode to check if we deliver to your area
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <div className="flex gap-2">
                  <Input
                    id="pincode"
                    type="text"
                    placeholder="Enter 6-digit pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    maxLength={6}
                  />
                  <Button 
                    onClick={checkDelivery}
                    disabled={isChecking}
                    className="bg-caramel hover:bg-brown"
                  >
                    {isChecking ? 'Checking...' : 'Check'}
                  </Button>
                </div>
                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}
              </div>

              {/* Delivery Result */}
              {deliveryInfo && (
                <div className={`p-4 rounded-lg border-2 ${
                  deliveryInfo.available 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {deliveryInfo.available ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          {deliveryInfo.message}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-red-800">
                          {deliveryInfo.message}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {deliveryInfo.available && deliveryInfo.area && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Delivery Fee:</span>
                        <span className="font-medium">₹{deliveryInfo.area.deliveryFee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Free delivery above:</span>
                        <span className="font-medium">₹{deliveryInfo.area.freeDeliveryThreshold}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {deliveryInfo.area.sameDayAvailable && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Same-day delivery
                          </Badge>
                        )}
                        {deliveryInfo.area.midnightAvailable && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Midnight delivery
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-caramel" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-caramel mt-0.5" />
                  <div>
                    <h4 className="font-medium">Same-Day Delivery</h4>
                    <p className="text-sm text-gray-600">
                      Order before 6 PM for same-day delivery (selected areas)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-caramel mt-0.5" />
                  <div>
                    <h4 className="font-medium">Delivery Areas</h4>
                    <p className="text-sm text-gray-600">
                      We deliver across Gurgaon including Cyber City, Golf Course Road, MG Road, and more
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-caramel mt-0.5" />
                  <div>
                    <h4 className="font-medium">Contact Support</h4>
                    <p className="text-sm text-gray-600">
                      Call +91-9876543210 for delivery queries and tracking
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Pincodes */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Delivery Areas</CardTitle>
            <CardDescription>
              We currently deliver to the following pincodes in Gurgaon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {availablePincodes.map((code) => (
                <Badge 
                  key={code} 
                  variant="outline" 
                  className="justify-center py-2 cursor-pointer hover:bg-caramel hover:text-white transition-colors"
                  onClick={() => setPincode(code)}
                >
                  {code}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Promise */}
        <Card className="mt-8 bg-gradient-to-r from-caramel to-brown text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Our Delivery Promise</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold mb-2">100%</div>
                <div className="text-sm opacity-90">Fresh & Eggless</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">₹0</div>
                <div className="text-sm opacity-90">Delivery on orders ₹500+</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">2-4 hrs</div>
                <div className="text-sm opacity-90">Same-day delivery*</div>
              </div>
            </div>
            <p className="text-sm opacity-80 mt-4">
              *Same-day delivery available for select areas on orders placed before 6 PM
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}