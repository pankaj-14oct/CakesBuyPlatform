import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, Minus, Trash2, ShoppingBag, ArrowLeft, 
  Truck, Tag, Gift, Heart, Star, Wallet, UserPlus
} from 'lucide-react';
import { useCart } from '@/components/cart-context';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';


export default function CartPage() {
  const { state: cartState, dispatch } = useCart();
  const { isAuthenticated } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [numberCandleInput, setNumberCandleInput] = useState<string>('');
  const [showNumberInput, setShowNumberInput] = useState<number | null>(null);
  const { toast } = useToast();



  // Fetch addons for recommendations
  const { data: addons, isLoading: addonsLoading, error: addonsError } = useQuery({
    queryKey: ['/api/addons'],
    queryFn: async () => {
      const res = await apiRequest('/api/addons', 'GET');
      return res.json();
    }
  });

  const subtotal = cartState.total;
  const deliveryFee = subtotal >= 500 ? 0 : 50;
  const discount = promoDiscount;
  const total = subtotal + deliveryFee - discount;

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: itemId });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity: newQuantity } });
    }
  };

  const handleRemoveItem = (itemId: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
    toast({
      title: "Item removed",
      description: "Item has been removed from your cart.",
    });
  };

  const handleAddonQuantityChange = (itemId: number, addonIndex: number, newQuantity: number) => {
    dispatch({ 
      type: 'UPDATE_ADDON_QUANTITY', 
      payload: { itemId, addonIndex, quantity: newQuantity } 
    });
  };

  const handleAddAddon = (addon: any) => {
    // Special handling for number candles
    if (addon.name === "Number Candles" && addon.category === "candles") {
      // If input is not shown, show it first
      if (showNumberInput !== addon.id) {
        setShowNumberInput(addon.id);
        return;
      }
      
      if (!numberCandleInput.trim()) {
        toast({
          title: "Enter number first",
          description: "Please enter the number for the candles first",
          variant: "destructive"
        });
        return;
      }
      
      // Find the first cake item in the cart to add the addon to
      const firstCakeItem = cartState.items[0];
      if (firstCakeItem) {
        // Calculate quantity based on number of digits
        const digits = numberCandleInput.length;
        
        dispatch({ 
          type: 'ADD_ADDON', 
          payload: { 
            itemId: firstCakeItem.id, 
            addon: addon,
            quantity: digits,
            customInput: numberCandleInput
          } 
        });
        
        toast({
          title: "Number candles added!",
          description: `${digits} number candles (${numberCandleInput}) added to your cart.`,
        });
        
        // Clear input after adding and hide input
        setNumberCandleInput('');
        setShowNumberInput(null);
      } else {
        toast({
          title: "Add a cake first",
          description: "Please add a cake to your cart before adding addons.",
          variant: "destructive"
        });
      }
      return;
    }
    
    // Regular addon handling
    const firstCakeItem = cartState.items[0];
    if (firstCakeItem) {
      dispatch({ 
        type: 'ADD_ADDON', 
        payload: { 
          itemId: firstCakeItem.id, 
          addon: addon,
          quantity: 1
        } 
      });
      toast({
        title: "Addon added!",
        description: `${addon.name} has been added to your cart.`,
      });
    } else {
      toast({
        title: "Add a cake first",
        description: "Please add a cake to your cart before adding addons.",
        variant: "destructive"
      });
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    setIsApplyingPromo(true);
    
    try {
      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, orderValue: subtotal })
      });
      
      const result = await response.json();
      
      if (result.valid) {
        setPromoDiscount(result.discount || 0);
        toast({
          title: "Promo code applied!",
          description: result.message,
        });
      } else {
        toast({
          title: "Invalid promo code",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply promo code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsApplyingPromo(false);
    }
  };

  if (cartState.items.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center p-8">
            <div className="text-6xl mb-6">🛒</div>
            <h1 className="text-2xl font-bold text-charcoal mb-4">Your Cart is Empty</h1>
            <p className="text-charcoal opacity-70 mb-8">
              Looks like you haven't added any cakes to your cart yet.
            </p>
            <Link href="/category/all">
              <Button size="lg" className="bg-caramel text-white hover:bg-brown">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Start Shopping
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link href="/category/all">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-charcoal">Shopping Cart</h1>
            <Badge variant="secondary" className="bg-caramel text-white">
              {cartState.itemCount} {cartState.itemCount === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartState.items.map((item) => (
              <div key={item.id} className="space-y-2">
                {/* Main Cake Item */}
                <Card>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {item.customImage ? (
                        // Photo cake with customization preview
                        <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border-2 border-red-200">
                          <img 
                            src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgNDAwIj4KICA8IS0tIENha2UgQmFzZSAtLT4KICA8Y2lyY2xlIGN4PSIyMDAiIGN5PSIyMDAiIHI9IjE5MCIgZmlsbD0iI2Y0ZTRjMSIgc3Ryb2tlPSIjZDRjNGExIiBzdHJva2Utd2lkdGg9IjQiLz4KICA8IS0tIENha2UgTGF5ZXJzIC0tPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjIwMCIgcj0iMTgwIiBmaWxsPSIjZjhmMGQ4IiBzdHJva2U9IiNlOGQ4YzgiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjIwMCIgcj0iMTcwIiBmaWxsPSIjZmRmNmUzIiBzdHJva2U9IiNlZGUzZDMiIHN0cm9rZS13aWR0aD0iMSIvPgogIDwhLS0gRGVjb3JhdGl2ZSBCb3JkZXIgLS0+CiAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMjAwIiByPSIxNzUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Q0YjhhMSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtZGFzaGFycmF5PSI4LDQiLz4KICA8IS0tIFBob3RvIEFyZWEgUGxhY2Vob2xkZXIgLS0+CiAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTYwIiByPSI3MCIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSIjZTBlMGUwIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cmVjdCB4PSIxNjAiIHk9IjEyMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI2Y4ZjhmOCIgc3Ryb2tlPSIjZDBkMGQwIiBzdHJva2Utd2lkdGg9IjEiLz4KICA8IS0tIFBob3RvIHBsYWNlaG9sZGVyIGljb24gLS0+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjAwLDE2MCkiPgogICAgPGNpcmNsZSByPSIyMCIgZmlsbD0iI2U4ZThlOCIvPgogICAgPHBhdGggZD0iTSAtMTIsLTggTCAxMiwtOCBMIDgsLTQgTCAtOCwtNCBaIiBmaWxsPSIjYzBjMGMwIi8+CiAgICA8Y2lyY2xlIHI9IjYiIGZpbGw9IiNhMGEwYTAiLz4KICAgIDxjaXJjbGUgcj0iMyIgZmlsbD0iI2ZmZmZmZiIvPgogIDwvZz4KICA8IS0tIFRleHQgcGxhY2Vob2xkZXIgYXJlYSAtLT4KICA8cmVjdCB4PSIxNDAiIHk9IjI1MCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSIyNSIgcng9IjEyIiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiNlMGUwZTAiIHN0cm9rZS13aWR0aD0iMSIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjY3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiPllvdXIgTWVzc2FnZTwvdGV4dD4KICA8IS0tIERlY29yYXRpdmUgZWxlbWVudHMgLS0+CiAgPGcgc3Ryb2tlPSIjZDRiOGExIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiPgogICAgPCEtLSBUb3AgZGVjb3JhdGl2ZSBzd2lybHMgLS0+CiAgICA8cGF0aCBkPSJNIDgwLDEwMCBRIDkwLDkwIDEwMCwxMDAgUSAxMTAsMTEwIDEyMCwxMDAiLz4KICAgIDxwYXRoIGQ9Ik0gMjgwLDEwMCBRIDI5MCw5MCAzMDAsMTAwIFEgMzEwLDExMCAzMjAsMTAwIi8+CiAgICA8IS0tIEJvdHRvbSBkZWNvcmF0aXZlIHN3aXJscyAtLT4KICAgIDxwYXRoIGQ9Ik0gODAsMzAwIFEgOTAsMzEwIDEwMCwzMDAgUSAxMTAsMjkwIDEyMCwzMDAiLz4KICAgIDxwYXRoIGQ9Ik0gMjgwLDMwMCBRIDI5MCwzMTAgMzAwLDMwMCBRIDMxMCwyOTAgMzIwLDMwMCIvPgogIDwvZz4KICA8IS0tIFNtYWxsIGRlY29yYXRpdmUgZG90cyAtLT4KICA8Y2lyY2xlIGN4PSIxMjAiIGN5PSIxNDAiIHI9IjMiIGZpbGw9IiNkNGI4YTEiLz4KICA8Y2lyY2xlIGN4PSIyODAiIGN5PSIxNDAiIHI9IjMiIGZpbGc9IiNkNGI4YTEiLz4KICA8Y2lyY2xlIGN4PSIxMjAiIGN5PSIyNjAiIHI9IjMiIGZpbGw9IiNkNGI4YTEiLz4KICA8Y2lyY2xlIGN4PSIyODAiIGN5PSIyNjAiIHI9IjMiIGZpbGc9IiNkNGI4YTEiLz4KICA8IS0tIENyZWFtIGJvcmRlciBkZXRhaWwgLS0+CiAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMjAwIiByPSIxODUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2YwZThkOCIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==' 
                            alt={item.cake.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Positioned custom image */}
                          <div 
                            className="absolute rounded overflow-hidden border border-white"
                            style={{
                              left: `${item.imagePosition?.x || 50}%`,
                              top: `${item.imagePosition?.y || 40}%`,
                              width: `${((item.imageSize || 32) / 100) * 24}px`,
                              height: `${((item.imageSize || 32) / 100) * 24}px`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <img 
                              src={item.customImage} 
                              alt="Custom photo" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* Custom text overlay */}
                          {item.customMessage && (
                            <div 
                              className="absolute bg-white bg-opacity-90 px-1 py-0.5 rounded text-xs"
                              style={{
                                left: `${item.textPosition?.x || 50}%`,
                                top: `${item.textPosition?.y || 70}%`,
                                transform: 'translate(-50%, -50%)',
                                fontSize: '8px'
                              }}
                            >
                              {item.customMessage}
                            </div>
                          )}
                          {/* Personalized indicator */}
                          <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                            📸
                          </div>
                        </div>
                      ) : (
                        // Regular cake image
                        <img 
                          src={(item.cake.images && item.cake.images[0]) || '/api/placeholder/200/200'} 
                          alt={item.cake.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-charcoal mb-1">
                            <Link href={`/product/${item.cake.slug}`} className="hover:text-caramel">
                              {item.cake.name}
                            </Link>
                          </h3>
                          <div className="text-sm text-charcoal opacity-70 space-y-1">
                            <p>Weight: {item.weight}</p>
                            <p>Flavor: {item.flavor}</p>
                            {item.customMessage && (
                              <p>Message: "{item.customMessage}"</p>
                            )}
                          </div>
                          
                          {/* Photo Cake Personalization Details */}
                          {item.customImage && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-red-700">📸 Personalization Applied</span>
                              </div>
                              <div className="text-xs text-red-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span>✅ Custom photo uploaded</span>
                                </div>
                                {item.customMessage && (
                                  <div className="flex items-center gap-2">
                                    <span>✅ Custom text: "{item.customMessage}"</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <span>✅ Positioned & sized perfectly</span>
                                </div>
                                <div className="text-xs text-red-500 mt-2 italic">
                                  Your cake will be printed exactly as positioned in the preview
                                </div>
                              </div>
                            </div>
                          )}
                          

                        </div>

                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Quantity and Price */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-brown">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-sm text-charcoal opacity-60">
                              {formatPrice(item.price)} each
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Separate Addon Items */}
              {item.addons.map((addon, addonIndex) => (
                <Card key={`${item.id}-addon-${addonIndex}`} className="ml-4 border-l-4 border-caramel">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Addon Image */}
                      <div className="flex-shrink-0">
                        <img 
                          src={addon.addon.image || "/api/placeholder/100/100"}
                          alt={addon.addon.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      </div>

                      {/* Addon Details */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-charcoal mb-1">
                              {addon.addon.name}
                              {addon.customInput && (
                                <span className="text-sm text-gray-600 ml-2">({addon.customInput})</span>
                              )}
                            </h4>
                            <p className="text-sm text-charcoal opacity-70">{addon.addon.description}</p>
                          </div>
                        </div>

                        {/* Addon Quantity and Price */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleAddonQuantityChange(item.id, addonIndex, addon.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-medium w-6 text-center text-sm">{addon.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleAddonQuantityChange(item.id, addonIndex, addon.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <div className="font-bold text-brown">
                              {formatPrice(parseFloat(addon.addon.price) * addon.quantity)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            ))}

            {/* Addons Section with Horizontal Scroll */}
            {addons && addons.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg text-charcoal">
                    Treat Yourself <span className="text-caramel">More</span> With
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="overflow-x-auto hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
                      {addons.map((addon: any) => (
                        <div key={addon.id} className="flex-shrink-0 w-40">
                          <div className="bg-white rounded-lg border p-3 text-center h-full flex flex-col shadow-sm">
                            <div className="mb-3">
                              <img 
                                src={addon.image || '/api/placeholder/100/100'} 
                                alt={addon.name}
                                className="w-16 h-16 mx-auto rounded-lg object-cover"
                              />
                            </div>
                            <h4 className="font-medium text-charcoal text-sm mb-1 line-clamp-2">{addon.name}</h4>
                            <div className="text-caramel font-bold text-sm mb-2">
                              {addon.name === "Number Candles" && addon.category === "candles" ? (
                                <span>{formatPrice(parseFloat(addon.price))} Per Candle</span>
                              ) : (
                                formatPrice(parseFloat(addon.price))
                              )}
                            </div>
                            <div className="flex items-center justify-center mb-2">
                              <div className="flex items-center text-yellow-500 text-xs">
                                <Star className="h-3 w-3 fill-current" />
                                <span className="ml-1">4.5</span>
                                <span className="text-gray-500 ml-1">(120)</span>
                              </div>
                            </div>
                            
                            {/* Number Candles Input Field */}
                            {addon.name === "Number Candles" && addon.category === "candles" && showNumberInput === addon.id && (
                              <div className="mb-2">
                                <Input
                                  type="text"
                                  placeholder="Enter number (e.g., 25)"
                                  value={numberCandleInput}
                                  onChange={(e) => setNumberCandleInput(e.target.value.replace(/[^0-9]/g, ''))}
                                  className="h-8 text-xs"
                                  maxLength={3}
                                  autoFocus
                                />
                              </div>
                            )}
                            
                            <Button 
                              size="sm" 
                              className="w-full bg-white border border-caramel text-caramel hover:bg-caramel hover:text-white text-xs py-2 mt-auto"
                              onClick={() => handleAddAddon(addon)}
                            >
                              {addon.name === "Number Candles" && addon.category === "candles" && showNumberInput === addon.id 
                                ? "Add to Cart" 
                                : "Add to Cart"
                              }
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            <Card className="bg-gradient-to-r from-pink/10 to-caramel/10 border-pink/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Gift className="h-5 w-5 text-caramel" />
                  <h3 className="font-semibold text-charcoal">Add More & Save!</h3>
                </div>
                <p className="text-charcoal opacity-70 mb-4">
                  {deliveryFee > 0 
                    ? `Add ₹${500 - subtotal} more to get FREE delivery!`
                    : "You're eligible for FREE delivery! 🎉"
                  }
                </p>
                <Link href="/category/all">
                  <Button variant="outline" className="border-caramel text-caramel hover:bg-caramel hover:text-white">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Promo Code */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Tag className="mr-2 h-5 w-5 text-caramel" />
                  Promo Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleApplyPromo}
                    disabled={isApplyingPromo || !promoCode.trim()}
                    className="bg-caramel hover:bg-brown"
                  >
                    {isApplyingPromo ? 'Applying...' : 'Apply'}
                  </Button>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex items-center justify-between text-sm p-2 bg-mint/10 rounded">
                    <span className="text-mint font-medium">Promo applied!</span>
                    <span className="text-mint">-{formatPrice(promoDiscount)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-charcoal">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-charcoal flex items-center">
                    <Truck className="mr-1 h-4 w-4" />
                    Delivery Fee
                    {deliveryFee === 0 && <Badge className="ml-2 bg-mint text-white text-xs">FREE</Badge>}
                  </span>
                  <span className="font-medium">
                    {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-mint">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}

                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-charcoal">Total</span>
                  <span className="text-brown">{formatPrice(total)}</span>
                </div>

                <div className="text-xs text-charcoal opacity-60 text-center">
                  Inclusive of all taxes
                </div>
              </CardContent>
            </Card>

            {/* Signup Incentive for non-authenticated users */}
            {!isAuthenticated && (
              <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <Gift className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-bold text-orange-800">Save More with Account!</span>
                  </div>
                  <div className="text-center mb-3">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Wallet className="h-6 w-6 text-orange-600" />
                      <span className="text-xl font-bold text-orange-800">₹50</span>
                      <span className="text-sm text-orange-700">instant credit</span>
                    </div>
                    <p className="text-xs text-orange-600 mb-3">
                      Create an account during checkout and get ₹50 wallet credit instantly!
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-xs text-orange-600">
                      <div className="flex items-center space-x-1">
                        <span>✓</span>
                        <span>Track orders</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>✓</span>
                        <span>Loyalty rewards</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>✓</span>
                        <span>Faster checkout</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Checkout Button */}
            <Link href="/checkout">
              <Button size="lg" className="w-full bg-brown text-white hover:bg-opacity-90">
                Proceed to Checkout
              </Button>
            </Link>

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
                  <p>✓ Temperature-controlled packaging</p>
                  <p>✓ 100% fresh guarantee</p>
                </div>
              </CardContent>
            </Card>

            {/* Security Badge */}
            <div className="flex items-center justify-center space-x-4 text-sm text-charcoal opacity-70">
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4 text-caramel" />
                <span>Secure Checkout</span>
              </div>
              <div className="flex items-center space-x-1">
                <Truck className="h-4 w-4 text-caramel" />
                <span>Safe Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
