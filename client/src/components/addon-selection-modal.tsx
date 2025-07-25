import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { Addon } from '@shared/schema';

interface AddonSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (selectedAddons: { addon: Addon; quantity: number; customInput?: string }[]) => void;
}

export default function AddonSelectionModal({ isOpen, onClose, onContinue }: AddonSelectionModalProps) {
  const [selectedAddons, setSelectedAddons] = useState<{ addon: Addon; quantity: number; customInput?: string }[]>([]);
  const [activeCategory, setActiveCategory] = useState('popular');
  const [numberCandleInput, setNumberCandleInput] = useState<string>('');
  const [showNumberInput, setShowNumberInput] = useState<number | null>(null); // Track which addon should show input

  // Fetch addons
  const { data: addons } = useQuery({
    queryKey: ['/api/addons'],
    queryFn: async () => {
      const res = await apiRequest('/api/addons', 'GET');
      return res.json();
    }
  });

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedAddons([]);
      setActiveCategory('popular');
      setNumberCandleInput('');
      setShowNumberInput(null);
    }
  }, [isOpen]);

  // Group addons by category
  const groupedAddons = addons?.reduce((acc: Record<string, Addon[]>, addon: Addon) => {
    const category = addon.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(addon);
    return acc;
  }, {}) || {};

  // Get popular addons (first few from each category)
  const popularAddons = Object.values(groupedAddons).flat().slice(0, 8);

  const categories = [
    { id: 'popular', label: 'Popular', items: popularAddons },
    { id: 'candles', label: 'Candles', items: groupedAddons.candles || [] },
    { id: 'flowers', label: 'Flowers', items: groupedAddons.flowers || [] },
    { id: 'chocolates', label: 'Chocolates', items: groupedAddons.chocolates || [] },
    { id: 'cards', label: 'Cake Toppers', items: groupedAddons.cards || [] },
    { id: 'other', label: 'More Addons', items: groupedAddons.other || [] }
  ];

  const handleAddAddon = (addon: Addon) => {
    // Special handling for number candles
    if (addon.name === "Number Candles" && addon.category === "candles") {
      // If input is not shown, show it first
      if (showNumberInput !== addon.id) {
        setShowNumberInput(addon.id);
        return;
      }
      
      if (!numberCandleInput.trim()) {
        alert("Please enter the number for the candles first");
        return;
      }
      
      // Calculate quantity based on number of digits
      const digits = numberCandleInput.length;
      
      setSelectedAddons(prev => {
        const existing = prev.find(item => item.addon.id === addon.id);
        if (existing) {
          return prev.map(item =>
            item.addon.id === addon.id
              ? { ...item, quantity: digits, customInput: numberCandleInput }
              : item
          );
        } else {
          return [...prev, { addon, quantity: digits, customInput: numberCandleInput }];
        }
      });
      
      // Clear input after adding and hide input
      setNumberCandleInput('');
      setShowNumberInput(null);
      return;
    }
    
    // Regular addon handling
    setSelectedAddons(prev => {
      const existing = prev.find(item => item.addon.id === addon.id);
      if (existing) {
        return prev.map(item =>
          item.addon.id === addon.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { addon, quantity: 1 }];
      }
    });
  };

  const handleRemoveAddon = (addonId: number) => {
    setSelectedAddons(prev => {
      const existing = prev.find(item => item.addon.id === addonId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.addon.id === addonId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        // If removing the last item, also hide the input field for number candles
        if (showNumberInput === addonId) {
          setShowNumberInput(null);
          setNumberCandleInput('');
        }
        return prev.filter(item => item.addon.id !== addonId);
      }
    });
  };

  const getAddonQuantity = (addonId: number) => {
    return selectedAddons.find(item => item.addon.id === addonId)?.quantity || 0;
  };

  const handleContinue = () => {
    onContinue(selectedAddons);
    onClose();
  };

  const handleSkip = () => {
    onContinue([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] h-[80vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 pb-2">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-caramel">
            Add More Fun To Celebration
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0">
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col min-h-0">
            <div className="flex-shrink-0 overflow-x-auto hide-scrollbar px-4 sm:px-6">
              <TabsList className="flex w-max min-w-full justify-start">
                {categories.map(category => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="text-xs px-3 py-2 whitespace-nowrap flex-shrink-0"
                  >
                    {category.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 relative min-h-0">
              {categories.map(category => (
                <TabsContent
                  key={category.id}
                  value={category.id}
                  className="absolute inset-0 overflow-y-auto px-4 sm:px-6 pb-20 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 pt-2 sm:pt-4">
                  {category.items.map((addon: Addon) => {
                    const quantity = getAddonQuantity(addon.id);
                    return (
                      <div
                        key={addon.id}
                        className="bg-white rounded-lg border p-2 sm:p-3 text-center relative"
                      >
                        {quantity > 0 && (
                          <Badge className="absolute -top-2 -right-2 bg-caramel text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs">
                            {addon.name === "Number Candles" && addon.category === "candles" ? 
                              (selectedAddons.find(item => item.addon.id === addon.id)?.customInput || quantity) : 
                              quantity
                            }
                          </Badge>
                        )}
                        
                        <div className="mb-2 sm:mb-3">
                          <img
                            src={addon.image || "/api/placeholder/120/120"}
                            alt={addon.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-lg object-cover"
                          />
                        </div>
                        
                        <h4 className="font-medium text-charcoal text-xs sm:text-sm mb-1 h-8 sm:h-10 overflow-hidden leading-tight">
                          {addon.name}
                        </h4>
                        
                        <div className="text-caramel font-bold text-xs sm:text-sm mb-2 sm:mb-3">
                          {addon.name === "Number Candles" && addon.category === "candles" ? (
                            <span>
                              {formatPrice(parseFloat(addon.price))} Per Candle
                              {quantity > 0 && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {quantity} candles = {formatPrice(parseFloat(addon.price) * quantity)}
                                </div>
                              )}
                            </span>
                          ) : (
                            <>
                              {formatPrice(parseFloat(addon.price))} {addon.category === 'candles' && 'Per Candle'}
                            </>
                          )}
                        </div>

                        {addon.name === "Number Candles" && addon.category === "candles" ? (
                          <div className="space-y-2">
                            {showNumberInput === addon.id && (
                              <Input
                                type="text"
                                placeholder="Enter number (e.g., 25)"
                                value={numberCandleInput}
                                onChange={(e) => setNumberCandleInput(e.target.value.replace(/[^0-9]/g, ''))}
                                className="h-6 sm:h-8 text-xs"
                                maxLength={3}
                                autoFocus
                              />
                            )}
                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                              {quantity > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs"
                                  onClick={() => handleRemoveAddon(addon.id)}
                                >
                                  -
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                className="bg-white border border-caramel text-caramel hover:bg-caramel hover:text-white text-xs px-2 sm:px-3 h-6 sm:h-8"
                                onClick={() => handleAddAddon(addon)}
                              >
                                {showNumberInput === addon.id ? (quantity > 0 ? 'Update' : 'Add') : 'Add'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            {quantity > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs"
                                onClick={() => handleRemoveAddon(addon.id)}
                              >
                                -
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              className="bg-white border border-caramel text-caramel hover:bg-caramel hover:text-white text-xs px-2 sm:px-3 h-6 sm:h-8"
                              onClick={() => handleAddAddon(addon)}
                            >
                              {quantity > 0 ? '+' : 'Add'}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>

          {/* Bottom Actions - Sticky */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-t bg-white shadow-lg">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-charcoal hover:text-caramel text-sm sm:text-base"
            >
              Skip
            </Button>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {selectedAddons.length > 0 && (
                <div className="text-xs sm:text-sm text-charcoal">
                  {selectedAddons.reduce((sum, item) => sum + item.quantity, 0)} items selected
                </div>
              )}
              
              <Button
                onClick={handleContinue}
                className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-8 text-sm sm:text-base"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}