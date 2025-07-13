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
import PhotoCakeModal from '@/components/PhotoCakeModal';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedWeight, setSelectedWeight] = useState<string>('');
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [customText, setCustomText] = useState('');
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number }>({ x: 50, y: 40 });
  const [textPosition, setTextPosition] = useState<{ x: number; y: number }>({ x: 50, y: 70 });
  const [imageSize, setImageSize] = useState(32);
  const [occasionType, setOccasionType] = useState<'birthday' | 'anniversary' | 'wedding' | 'graduation' | 'congratulations' | 'valentine' | 'mothers-day' | 'fathers-day' | 'celebration'>('birthday');
  const [textColor, setTextColor] = useState('#DC2626');
  const [fontSize, setFontSize] = useState(100);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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
          <Link href="/search">
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
  const isPhotoCake = cake.isPhotoCake || false;

  const handlePhotoModalSave = (imageFile: File | null, text: string, imgPos?: { x: number; y: number }, txtPos?: { x: number; y: number }, imgSize?: number, occasion?: 'birthday' | 'anniversary' | 'wedding' | 'graduation' | 'congratulations' | 'valentine' | 'mothers-day' | 'fathers-day' | 'celebration', color?: string, fontScale?: number, font?: string) => {
    if (imageFile) {
      const imageUrl = URL.createObjectURL(imageFile);
      setUploadedImage(imageUrl);
      setUploadedImageFile(imageFile);
    }
    setCustomText(text);
    if (imgPos) setImagePosition(imgPos);
    if (txtPos) setTextPosition(txtPos);
    if (imgSize) setImageSize(imgSize);
    if (occasion) setOccasionType(occasion);
    if (color) setTextColor(color);
    if (fontScale) setFontSize(fontScale);
    if (font) setFontFamily(font);
    
    toast({
      title: "Photo customization saved!",
      description: "Your photo, text, colors, sizing, and font style have been saved."
    });
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
        title: "Please personalize your cake",
        description: "Click 'Personalise Your Cake' to upload a photo and add custom text.",
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
    const price = basePrice;

    const cartItem = {
      id: Date.now(),
      cake,
      quantity,
      weight,
      flavor,
      customMessage: customMessage.trim() || customText.trim() || undefined,
      customImage: uploadedImage || undefined,
      imagePosition: uploadedImage ? imagePosition : undefined,
      textPosition: customText.trim() ? textPosition : undefined,
      imageSize: uploadedImage ? imageSize : undefined,
      photoCustomization: (isPhotoCake && (uploadedImage || customText.trim())) ? {
        uploadedImage: uploadedImage || undefined,
        customText: customText.trim() || undefined,
        imagePosition: uploadedImage ? imagePosition : undefined,
        textPosition: customText.trim() ? textPosition : undefined,
        imageSize: uploadedImage ? imageSize : undefined
      } : undefined,
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
            <Link href="/search" className="text-caramel hover:underline">Cakes</Link>
            <span className="text-gray-400">/</span>
            <span className="text-charcoal">{cake.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="flex gap-4">
            {/* Thumbnail Images (Left Side) */}
            {cake.images && cake.images.length > 1 && (
              <div className="flex flex-col gap-3 w-24">
                {cake.images.map((image, index) => (
                  <div
                    key={index}
                    className={`relative cursor-pointer rounded-lg overflow-hidden ${
                      selectedImageIndex === index 
                        ? 'ring-2 ring-caramel ring-offset-2' 
                        : 'hover:opacity-80'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img 
                      src={image} 
                      alt={`${cake.name} view ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Main Image (Right Side) */}
            <div className="flex-1">
              <div className="relative">
                <img 
                  src={cake.images?.[selectedImageIndex] || cake.images?.[0] || '/placeholder-cake.jpg'} 
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
                <span className="text-sm text-charcoal opacity-60 ml-2">
                  (Inclusive of GST)
                </span>
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

            {/* Photo Cake Customization Button */}
            {isPhotoCake && (
              <Card className="border-2 border-red-200 bg-red-50/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-red-800 mb-2">
                        📸 Personalize Your Photo Cake
                      </h3>
                      <p className="text-sm text-red-600 mb-3">
                        {uploadedImage ? 
                          `✅ Photo uploaded • Custom text: "${customText || 'None'}"` : 
                          'Upload your photo and add custom text to make it special!'
                        }
                      </p>
                      {uploadedImage && (
                        <div className="flex items-center gap-3">
                          {/* Mini preview with positioning */}
                          <div className="relative w-16 h-16 bg-gray-100 rounded-lg border-2 border-red-200 overflow-hidden">
                            <img 
                              src={isPhotoCake ? 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgNDAwIj4KICA8IS0tIENha2UgQmFzZSAtLT4KICA8Y2lyY2xlIGN4PSIyMDAiIGN5PSIyMDAiIHI9IjE5MCIgZmlsbD0iI2Y0ZTRjMSIgc3Ryb2tlPSIjZDRjNGExIiBzdHJva2Utd2lkdGg9IjQiLz4KICA8IS0tIENha2UgTGF5ZXJzIC0tPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjIwMCIgcj0iMTgwIiBmaWxsPSIjZjhmMGQ4IiBzdHJva2U9IiNlOGQ4YzgiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjIwMCIgcj0iMTcwIiBmaWxsPSIjZmRmNmUzIiBzdHJva2U9IiNlZGUzZDMiIHN0cm9rZS13aWR0aD0iMSIvPgogIDwhLS0gRGVjb3JhdGl2ZSBCb3JkZXIgLS0+CiAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMjAwIiByPSIxNzUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Q0YjhhMSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtZGFzaGFycmF5PSI4LDQiLz4KICA8IS0tIFBob3RvIEFyZWEgUGxhY2Vob2xkZXIgLS0+CiAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTYwIiByPSI3MCIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSIjZTBlMGUwIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cmVjdCB4PSIxNjAiIHk9IjEyMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI2Y4ZjhmOCIgc3Ryb2tlPSIjZDBkMGQwIiBzdHJva2Utd2lkdGg9IjEiLz4KICA8IS0tIFBob3RvIHBsYWNlaG9sZGVyIGljb24gLS0+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjAwLDE2MCkiPgogICAgPGNpcmNsZSByPSIyMCIgZmlsbD0iI2U4ZThlOCIvPgogICAgPHBhdGggZD0iTSAtMTIsLTggTCAxMiwtOCBMIDgsLTQgTCAtOCwtNCBaIiBmaWxsPSIjYzBjMGMwIi8+CiAgICA8Y2lyY2xlIHI9IjYiIGZpbGw9IiNhMGEwYTAiLz4KICAgIDxjaXJjbGUgcj0iMyIgZmlsbD0iI2ZmZmZmZiIvPgogIDwvZz4KICA8IS0tIFRleHQgcGxhY2Vob2xkZXIgYXJlYSAtLT4KICA8cmVjdCB4PSIxNDAiIHk9IjI1MCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSIyNSIgcng9IjEyIiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiNlMGUwZTAiIHN0cm9rZS13aWR0aD0iMSIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjY3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiPllvdXIgTWVzc2FnZTwvdGV4dD4KICA8IS0tIERlY29yYXRpdmUgZWxlbWVudHMgLS0+CiAgPGcgc3Ryb2tlPSIjZDRiOGExIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiPgogICAgPCEtLSBUb3AgZGVjb3JhdGl2ZSBzd2lybHMgLS0+CiAgICA8cGF0aCBkPSJNIDgwLDEwMCBRIDkwLDkwIDEwMCwxMDAgUSAxMTAsMTEwIDEyMCwxMDAiLz4KICAgIDxwYXRoIGQ9Ik0gMjgwLDEwMCBRIDI5MCw5MCAzMDAsMTAwIFEgMzEwLDExMCAzMjAsMTAwIi8+CiAgICA8IS0tIEJvdHRvbSBkZWNvcmF0aXZlIHN3aXJscyAtLT4KICAgIDxwYXRoIGQ9Ik0gODAsMzAwIFEgOTAsMzEwIDEwMCwzMDAgUSAxMTAsMjkwIDEyMCwzMDAiLz4KICAgIDxwYXRoIGQ9Ik0gMjgwLDMwMCBRIDI5MCwzMTAgMzAwLDMwMCBRIDMxMCwyOTAgMzIwLDMwMCIvPgogIDwvZz4KICA8IS0tIFNtYWxsIGRlY29yYXRpdmUgZG90cyAtLT4KICA8Y2lyY2xlIGN4PSIxMjAiIGN5PSIxNDAiIHI9IjMiIGZpbGw9IiNkNGI4YTEiLz4KICA8Y2lyY2xlIGN4PSIyODAiIGN5PSIxNDAiIHI9IjMiIGZpbGw9IiNkNGI4YTEiLz4KICA8Y2lyY2xlIGN4PSIxMjAiIGN5PSIyNjAiIHI9IjMiIGZpbGw9IiNkNGI4YTEiLz4KICA8Y2lyY2xlIGN4PSIyODAiIGN5PSIyNjAiIHI9IjMiIGZpbGw9IiNkNGI4YTEiLz4KICA8IS0tIENyZWFtIGJvcmRlciBkZXRhaWwgLS0+CiAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMjAwIiByPSIxODUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2YwZThkOCIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==' : (cake.images?.[0] || '/api/placeholder/64/64')} 
                              alt="Cake base" 
                              className="w-full h-full object-cover"
                            />
                            <div 
                              className="absolute rounded overflow-hidden border border-white"
                              style={{
                                left: `${imagePosition.x}%`,
                                top: `${imagePosition.y}%`,
                                width: `${(imageSize / 100) * 24}px`, // Scale down from cake size
                                height: `${(imageSize / 100) * 24}px`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              <img 
                                src={uploadedImage} 
                                alt="Uploaded photo" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {customText && (
                              <div 
                                className="absolute bg-white bg-opacity-80 px-1 py-0.5 rounded text-xs"
                                style={{
                                  left: `${textPosition.x}%`,
                                  top: `${textPosition.y}%`,
                                  transform: 'translate(-50%, -50%)',
                                  fontSize: '6px'
                                }}
                              >
                                {customText}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-red-700">
                            <p className="font-medium">✅ Personalization Complete</p>
                            <p>Photo positioned & text: "{customText || 'None'}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => setShowPhotoModal(true)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                      size="lg"
                    >
                      {uploadedImage ? 'Edit Personalization' : 'Personalise Your Cake'}
                    </Button>
                  </div>
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

      {/* Photo Cake Modal */}
      <PhotoCakeModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onSave={handlePhotoModalSave}
        cakePreviewImage={cake.images?.[0] || '/api/placeholder/400/400'}
        backgroundImage={cake.backgroundImage || undefined}
        initialText={customText}
        photoPreviewShape={(cake.photoPreviewShape && ['circle', 'heart', 'square'].includes(cake.photoPreviewShape) ? cake.photoPreviewShape : 'circle') as 'circle' | 'heart' | 'square'}
      />
    </div>
  );
}