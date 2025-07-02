import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Heart, Star, Truck, Clock, Shield, Plus, Minus, 
  MapPin, Calendar, MessageCircle, Camera, ArrowLeft, X 
} from 'lucide-react';
import { Cake, Addon, Review } from '@shared/schema';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/components/cart-context';
import { useToast } from '@/hooks/use-toast';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedWeight, setSelectedWeight] = useState<string>('');
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Record<number, number>>({});
  const [isLiked, setIsLiked] = useState(false);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState<any>(null);
  const { dispatch } = useCart();
  const { toast } = useToast();

  const { data: cake, isLoading: cakeLoading } = useQuery<Cake>({
    queryKey: ['/api/cakes', slug],
    queryFn: async () => {
      const response = await fetch(`/api/cakes/${slug}`);
      if (!response.ok) throw new Error('Cake not found');
      return response.json();
    },
    enabled: !!slug,
  });

  const { data: addons = [] } = useQuery<Addon[]>({
    queryKey: ['/api/addons'],
  });

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['/api/cakes', cake?.id, 'reviews'],
    queryFn: async () => {
      const response = await fetch(`/api/cakes/${cake!.id}/reviews`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
    enabled: !!cake?.id,
  });

  if (cakeLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="bg-gray-200 rounded-2xl h-96"></div>
              <div className="space-y-4">
                <div className="bg-gray-200 rounded h-8 w-3/4"></div>
                <div className="bg-gray-200 rounded h-4 w-full"></div>
                <div className="bg-gray-200 rounded h-4 w-2/3"></div>
                <div className="bg-gray-200 rounded h-12 w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cake) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-charcoal mb-4">Cake Not Found</h1>
          <p className="text-charcoal opacity-70 mb-6">The requested cake could not be found.</p>
          <Link href="/category/all">
            <Button className="bg-caramel hover:bg-brown">Browse All Cakes</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const selectedWeightData = cake.weights.find(w => w.weight === selectedWeight);
  const basePrice = selectedWeightData?.price || cake.weights[0]?.price || 0;
  const addonsTotal = Object.entries(selectedAddons).reduce((total, [addonId, qty]) => {
    const addon = addons.find(a => a.id === parseInt(addonId));
    return total + (addon ? parseFloat(addon.price) * qty : 0);
  }, 0);
  const totalPrice = (basePrice + addonsTotal) * quantity;

  const handleAddToCart = () => {
    const weight = selectedWeight || cake.weights?.[0]?.weight || '';
    const flavor = selectedFlavor || cake.flavors?.[0] || '';
    const price = selectedWeightData?.price || cake.weights?.[0]?.price || 0;

    const cartItem = {
      id: Date.now(),
      cake,
      quantity,
      weight,
      flavor,
      customMessage: customMessage.trim() || undefined,
      price,
      addons: Object.entries(selectedAddons)
        .filter(([_, qty]) => qty > 0)
        .map(([addonId, qty]) => ({
          addon: addons.find(a => a.id === parseInt(addonId))!,
          quantity: qty
        }))
    };

    // Store the cart item and show addon modal
    setPendingCartItem(cartItem);
    setShowAddonModal(true);
  };

  const handleConfirmAddToCart = () => {
    if (pendingCartItem) {
      // Update cart item with selected addons
      const updatedCartItem = {
        ...pendingCartItem,
        addons: Object.entries(selectedAddons)
          .filter(([_, qty]) => qty > 0)
          .map(([addonId, qty]) => ({
            addon: addons.find(a => a.id === parseInt(addonId))!,
            quantity: qty
          }))
      };

      dispatch({ type: 'ADD_ITEM', payload: updatedCartItem });
      toast({
        title: "Added to cart!",
        description: `${cake.name} has been added to your cart.`,
      });
      
      setShowAddonModal(false);
      setPendingCartItem(null);
    }
  };

  const handleSkipAddons = () => {
    if (pendingCartItem) {
      dispatch({ type: 'ADD_ITEM', payload: pendingCartItem });
      toast({
        title: "Added to cart!",
        description: `${cake.name} has been added to your cart.`,
      });
      
      setShowAddonModal(false);
      setPendingCartItem(null);
    }
  };

  const handleAddonChange = (addonId: number, quantity: number) => {
    setSelectedAddons(prev => ({
      ...prev,
      [addonId]: Math.max(0, quantity)
    }));
  };

  const getRatingStars = (rating: string) => {
    const ratingNum = parseFloat(rating);
    const fullStars = Math.floor(ratingNum);
    const hasHalfStar = ratingNum % 1 !== 0;
    
    return (
      <div className="flex text-yellow-400">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-current" />
        ))}
        {hasHalfStar && <Star className="h-4 w-4 fill-current opacity-50" />}
        {[...Array(5 - Math.ceil(ratingNum))].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4" />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-caramel hover:underline">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/category/all" className="text-caramel hover:underline">Cakes</Link>
            <span className="text-gray-400">/</span>
            <span className="text-charcoal">{cake.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={cake.images[0] || '/placeholder-cake.jpg'} 
                alt={cake.name}
                className="w-full rounded-2xl shadow-lg"
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {cake.deliveryOptions.sameDay && (
                  <Badge className="bg-mint text-white">
                    <Truck className="mr-1 h-3 w-3" />
                    Same Day
                  </Badge>
                )}
                {cake.isBestseller && (
                  <Badge className="bg-pink text-white">Bestseller</Badge>
                )}
                {cake.isEggless && (
                  <Badge className="bg-green-500 text-white">Eggless</Badge>
                )}
              </div>

              {/* Like Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLiked(!isLiked)}
                className={`absolute top-4 right-4 bg-white bg-opacity-90 ${
                  isLiked ? 'text-red-500' : 'text-caramel'
                }`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-charcoal mb-2">{cake.name}</h1>
              <p className="text-charcoal opacity-70 mb-4">{cake.description}</p>
              
              {/* Rating */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  {getRatingStars(cake.rating)}
                  <span className="font-medium text-charcoal">{cake.rating}</span>
                </div>
                <span className="text-sm text-charcoal opacity-60">
                  ({cake.reviewCount} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="text-3xl font-bold text-brown mb-6">
                {formatPrice(totalPrice)}
                {quantity > 1 && (
                  <span className="text-sm text-charcoal opacity-60 ml-2">
                    ({formatPrice(basePrice + addonsTotal)} each)
                  </span>
                )}
              </div>
            </div>

            {/* Customization Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customize Your Cake</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Weight Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Weight</Label>
                  <Select value={selectedWeight} onValueChange={setSelectedWeight}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select weight" />
                    </SelectTrigger>
                    <SelectContent>
                      {cake.weights.map((weight) => (
                        <SelectItem key={weight.weight} value={weight.weight}>
                          {weight.weight} - {formatPrice(weight.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Flavor Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Flavor</Label>
                  <Select value={selectedFlavor} onValueChange={setSelectedFlavor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select flavor" />
                    </SelectTrigger>
                    <SelectContent>
                      {cake.flavors.map((flavor) => (
                        <SelectItem key={flavor} value={flavor}>
                          {flavor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Message */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Custom Message (Optional)
                  </Label>
                  <Textarea
                    placeholder="Enter your custom message..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-charcoal opacity-60 mt-1">
                    {customMessage.length}/100 characters
                  </p>
                </div>

                {/* Quantity */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Quantity</Label>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-xl font-medium w-12 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add-ons */}
            {addons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add-ons</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {addons.map((addon) => (
                    <div key={addon.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={(selectedAddons[addon.id] || 0) > 0}
                          onCheckedChange={(checked) => 
                            handleAddonChange(addon.id, checked ? 1 : 0)
                          }
                        />
                        <div>
                          <p className="font-medium text-charcoal">{addon.name}</p>
                          <p className="text-sm text-charcoal opacity-60">{addon.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-brown">
                          {formatPrice(addon.price)}
                        </span>
                        {(selectedAddons[addon.id] || 0) > 0 && (
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleAddonChange(addon.id, selectedAddons[addon.id] - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">
                              {selectedAddons[addon.id]}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleAddonChange(addon.id, selectedAddons[addon.id] + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full bg-brown text-white hover:bg-opacity-90"
                onClick={handleAddToCart}
                disabled={!selectedWeight || !selectedFlavor}
              >
                Add to Cart - {formatPrice(totalPrice)}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full border-caramel text-caramel hover:bg-caramel hover:text-white"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact for Custom Design
              </Button>
            </div>

            {/* Delivery Info */}
            <Card className="bg-mint/10 border-mint/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-mint mb-2">
                  <Truck className="h-4 w-4" />
                  <span className="font-medium">Delivery Information</span>
                </div>
                <div className="text-sm text-charcoal space-y-1">
                  <p>✓ Same-day delivery available</p>
                  <p>✓ Midnight delivery for special occasions</p>
                  <p>✓ Free delivery on orders above ₹500</p>
                  <p>✓ All Gurgaon sectors covered</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
              <TabsTrigger value="delivery">Delivery & Care</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-charcoal mb-4">About This Cake</h3>
                  <p className="text-charcoal opacity-80 mb-6">{cake.description}</p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-charcoal mb-2">Available Flavors</h4>
                      <ul className="text-charcoal opacity-70 space-y-1">
                        {cake.flavors.map((flavor) => (
                          <li key={flavor}>• {flavor}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-charcoal mb-2">Available Sizes</h4>
                      <ul className="text-charcoal opacity-70 space-y-1">
                        {cake.weights.map((weight) => (
                          <li key={weight.weight}>• {weight.weight} - {formatPrice(weight.price)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {cake.tags && cake.tags.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-charcoal mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {cake.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-charcoal">Customer Reviews</h3>
                    <div className="flex items-center space-x-2">
                      {getRatingStars(cake.rating)}
                      <span className="text-lg font-medium text-charcoal">{cake.rating}</span>
                      <span className="text-charcoal opacity-60">({cake.reviewCount} reviews)</span>
                    </div>
                  </div>
                  
                  {reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-charcoal opacity-60">No reviews yet. Be the first to review!</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews.slice(0, 5).map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-center space-x-2 mb-2">
                            {getRatingStars(review.rating.toString())}
                            <span className="text-sm text-charcoal opacity-60">
                              {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className="text-charcoal">{review.comment}</p>
                          {review.isVerified && (
                            <Badge variant="secondary" className="mt-2">
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="delivery" className="mt-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-charcoal mb-6">Delivery & Care Instructions</h3>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold text-charcoal mb-3 flex items-center">
                        <Truck className="mr-2 h-4 w-4 text-caramel" />
                        Delivery Options
                      </h4>
                      <ul className="text-charcoal opacity-70 space-y-2">
                        <li>• Same-day delivery (order before 6 PM)</li>
                        <li>• Midnight delivery available</li>
                        <li>• Scheduled delivery up to 7 days</li>
                        <li>• Free delivery on orders above ₹500</li>
                        <li>• Temperature-controlled packaging</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-charcoal mb-3 flex items-center">
                        <Shield className="mr-2 h-4 w-4 text-caramel" />
                        Care Instructions
                      </h4>
                      <ul className="text-charcoal opacity-70 space-y-2">
                        <li>• Store in refrigerator immediately</li>
                        <li>• Consume within 2 days for best taste</li>
                        <li>• Remove from fridge 30 mins before serving</li>
                        <li>• Keep away from direct sunlight</li>
                        <li>• Do not freeze</li>
                      </ul>
                    </div>
                  </div>

                  <Separator className="my-6" />
                  
                  <div className="bg-cream rounded-lg p-4">
                    <h4 className="font-semibold text-charcoal mb-2">Need Help?</h4>
                    <p className="text-charcoal opacity-70 mb-3">
                      Contact our customer support for any special requirements or questions.
                    </p>
                    <Button variant="outline" className="border-caramel text-caramel">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Full-Screen Addon Selection Modal */}
      <Dialog open={showAddonModal} onOpenChange={setShowAddonModal}>
        <DialogContent className="max-w-none w-screen h-screen max-h-none p-0 m-0 rounded-none">
          <div className="h-full flex flex-col bg-cream">
            {/* Header */}
            <div className="bg-white border-b p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img 
                  src={cake.images?.[0] || '/placeholder-cake.jpg'} 
                  alt={cake.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <DialogTitle className="text-xl font-bold text-charcoal">
                    Add Extras to Your Order
                  </DialogTitle>
                  <p className="text-charcoal opacity-70">
                    {cake.name} • ₹{formatPrice(pendingCartItem?.price || 0)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddonModal(false)}
                className="text-charcoal"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold text-charcoal mb-6">Make it Extra Special</h3>
                
                {/* Addon Categories */}
                <div className="grid gap-8">
                  {/* Candles */}
                  <div>
                    <h4 className="text-lg font-semibold text-charcoal mb-4 flex items-center">
                      🕯️ Candles & Sparklers
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {addons.filter(addon => addon.category === 'candles').map((addon) => (
                        <Card key={addon.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h5 className="font-medium text-charcoal">{addon.name}</h5>
                                <p className="text-sm text-charcoal opacity-70">{addon.description}</p>
                              </div>
                              <span className="font-semibold text-caramel">₹{addon.price}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleAddonChange(addon.id, (selectedAddons[addon.id] || 0) - 1)}
                                  disabled={!selectedAddons[addon.id]}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-medium w-8 text-center">
                                  {selectedAddons[addon.id] || 0}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleAddonChange(addon.id, (selectedAddons[addon.id] || 0) + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Greeting Cards */}
                  <div>
                    <h4 className="text-lg font-semibold text-charcoal mb-4 flex items-center">
                      💌 Greeting Cards
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {addons.filter(addon => addon.category === 'cards').map((addon) => (
                        <Card key={addon.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h5 className="font-medium text-charcoal">{addon.name}</h5>
                                <p className="text-sm text-charcoal opacity-70">{addon.description}</p>
                              </div>
                              <span className="font-semibold text-caramel">₹{addon.price}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleAddonChange(addon.id, (selectedAddons[addon.id] || 0) - 1)}
                                  disabled={!selectedAddons[addon.id]}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-medium w-8 text-center">
                                  {selectedAddons[addon.id] || 0}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleAddonChange(addon.id, (selectedAddons[addon.id] || 0) + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Flowers */}
                  <div>
                    <h4 className="text-lg font-semibold text-charcoal mb-4 flex items-center">
                      🌸 Fresh Flowers
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {addons.filter(addon => addon.category === 'flowers').map((addon) => (
                        <Card key={addon.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h5 className="font-medium text-charcoal">{addon.name}</h5>
                                <p className="text-sm text-charcoal opacity-70">{addon.description}</p>
                              </div>
                              <span className="font-semibold text-caramel">₹{addon.price}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleAddonChange(addon.id, (selectedAddons[addon.id] || 0) - 1)}
                                  disabled={!selectedAddons[addon.id]}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-medium w-8 text-center">
                                  {selectedAddons[addon.id] || 0}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleAddonChange(addon.id, (selectedAddons[addon.id] || 0) + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t p-6">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div>
                  <p className="text-charcoal font-medium">
                    Total: ₹{formatPrice((pendingCartItem?.price || 0) + addonsTotal)}
                  </p>
                  <p className="text-sm text-charcoal opacity-70">
                    {Object.values(selectedAddons).reduce((sum, qty) => sum + qty, 0)} extras selected
                  </p>
                </div>
                
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={handleSkipAddons}
                    className="border-caramel text-caramel"
                  >
                    Skip Extras
                  </Button>
                  <Button
                    onClick={handleConfirmAddToCart}
                    className="bg-caramel hover:bg-brown text-white"
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
