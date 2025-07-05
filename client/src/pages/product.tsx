import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Heart, Star, Truck, Plus, Minus, 
  MessageCircle
} from 'lucide-react';
import { Cake, Review, Addon } from '@shared/schema';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/components/cart-context';
import { useToast } from '@/hooks/use-toast';
import AddonSelectionModal from '@/components/addon-selection-modal';
import PhotoCakeCustomizer from '@/components/PhotoCakeCustomizer';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedWeight, setSelectedWeight] = useState<string>('');
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [customText, setCustomText] = useState('');
  const { dispatch } = useCart();
  const { toast } = useToast();

  const { data: cake, isLoading: cakeLoading, error } = useQuery<Cake>({
    queryKey: ['/api/cakes', slug],
    queryFn: async () => {
      const response = await fetch(`/api/cakes/${slug}`);
      if (!response.ok) throw new Error('Cake not found');
      return response.json();
    },
    enabled: !!slug,
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

  if (!cakeLoading && !cake) {
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

  if (!cake) {
    return null; // Still loading
  }

  const selectedWeightData = cake.weights?.find(w => w.weight === selectedWeight);
  const basePrice = selectedWeightData?.price || cake.weights?.[0]?.price || 0;
  const totalPrice = basePrice * quantity;

  // Check if this is a photo cake
  const isPhotoCake = cake.slug?.includes('photo') || cake.name?.toLowerCase().includes('photo');

  const handleImageUpload = (file: File) => {
    if (!file) {
      setUploadedImage('');
      return;
    }

    // Create a URL for the uploaded image
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);

    // In a real app, you would upload this to a server
    // For now, we'll just store the local URL
    toast({
      title: "Photo uploaded successfully!",
      description: "Your photo has been added to the cake customization."
    });
  };

  const handleCustomTextChange = (text: string) => {
    setCustomText(text);
  };

  const handleAddToCart = () => {
    // Validate required selections
    if (!selectedWeight && cake.weights && cake.weights.length > 1) {
      toast({
        title: "Please select a weight",
        description: "Choose your preferred cake weight before adding to cart.",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedFlavor && cake.flavors && cake.flavors.length > 1) {
      toast({
        title: "Please select a flavor",
        description: "Choose your preferred cake flavor before adding to cart.",
        variant: "destructive"
      });
      return;
    }

    // Validate photo cake requirements
    if (isPhotoCake && !uploadedImage) {
      toast({
        title: "Please upload a photo",
        description: "Photo cakes require an image to be uploaded for customization.",
        variant: "destructive"
      });
      return;
    }

    // Show addon selection modal
    setShowAddonModal(true);
  };

  const handleAddonSelection = (selectedAddons: { addon: Addon; quantity: number }[]) => {
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
      customImage: uploadedImage || undefined,
      customText: customText.trim() || undefined,
      price,
      addons: selectedAddons
    };

    dispatch({ type: 'ADD_ITEM', payload: cartItem });
    toast({
      title: "Added to cart!",
      description: `${cake.name} with ${selectedAddons.length} addons has been added to your cart.`,
    });
  };

  const getRatingStars = (rating: string | null) => {
    if (!rating) return null;
    
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
                src={cake.images?.[0] || '/placeholder-cake.jpg'} 
                alt={cake.name}
                className="w-full rounded-2xl shadow-lg"
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {cake.deliveryOptions?.sameDay && (
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
                    ({formatPrice(basePrice)} each)
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
                      {cake.weights?.map((weight) => (
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
                      {cake.flavors?.map((flavor) => (
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

            {/* Photo Cake Customizer */}
            <PhotoCakeCustomizer
              isPhotoCake={isPhotoCake}
              onImageUpload={handleImageUpload}
              onTextChange={handleCustomTextChange}
              uploadedImage={uploadedImage}
              customText={customText}
            />

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
                        {cake.flavors?.map((flavor) => (
                          <li key={flavor}>• {flavor}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-charcoal mb-2">Available Sizes</h4>
                      <ul className="text-charcoal opacity-70 space-y-1">
                        {cake.weights?.map((weight) => (
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
                  <h3 className="text-xl font-semibold text-charcoal mb-6">Customer Reviews</h3>
                  
                  {reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-charcoal opacity-60 mb-4">No reviews yet</div>
                      <p className="text-sm text-charcoal opacity-40">
                        Be the first to share your experience with this cake!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex text-yellow-400">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-current" />
                              ))}
                            </div>
                            <span className="font-medium text-charcoal">{review.rating}/5</span>
                          </div>
                          <p className="text-charcoal mb-2">{review.comment}</p>
                          <div className="text-sm text-charcoal opacity-60">
                            By Anonymous on {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Unknown date'}
                          </div>
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
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-charcoal mb-3">Delivery Options</h4>
                      <ul className="text-charcoal opacity-80 space-y-2">
                        <li>• Same-day delivery available (order before 2 PM)</li>
                        <li>• Midnight delivery for special occasions</li>
                        <li>• Standard delivery: Next day between 10 AM - 8 PM</li>
                        <li>• Free delivery on orders above ₹500</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-charcoal mb-3">Care Instructions</h4>
                      <ul className="text-charcoal opacity-80 space-y-2">
                        <li>• Store in refrigerator immediately upon delivery</li>
                        <li>• Consume within 24-48 hours for best taste</li>
                        <li>• Bring to room temperature 30 minutes before serving</li>
                        <li>• Keep away from direct sunlight and heat</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-charcoal mb-3">Service Areas</h4>
                      <p className="text-charcoal opacity-80">
                        We deliver to all sectors of Gurgaon including DLF, Golf Course Road, 
                        Sohna Road, and surrounding areas. Contact us for delivery outside 
                        standard areas.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Addon Selection Modal */}
      <AddonSelectionModal
        isOpen={showAddonModal}
        onClose={() => setShowAddonModal(false)}
        onContinue={handleAddonSelection}
      />
    </div>
  );
}