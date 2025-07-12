import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { Addon } from '@shared/schema';

interface AddonSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (selectedAddons: { addon: Addon; quantity: number }[]) => void;
}

export default function AddonSelectionModal({ isOpen, onClose, onContinue }: AddonSelectionModalProps) {
  const [selectedAddons, setSelectedAddons] = useState<{ addon: Addon; quantity: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState('popular');

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
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 pb-2">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-caramel">
            Add More Fun To Celebration
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 relative">
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col">
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

            {categories.map(category => (
              <TabsContent
                key={category.id}
                value={category.id}
                className="mt-2 sm:mt-4 flex-1 overflow-y-auto px-4 sm:px-6 pb-20"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                  {category.items.map((addon: Addon) => {
                    const quantity = getAddonQuantity(addon.id);
                    return (
                      <div
                        key={addon.id}
                        className="bg-white rounded-lg border p-2 sm:p-3 text-center relative"
                      >
                        {quantity > 0 && (
                          <Badge className="absolute -top-2 -right-2 bg-caramel text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs">
                            {quantity}
                          </Badge>
                        )}
                        
                        <div className="mb-2 sm:mb-3">
                          <img
                            src="/api/placeholder/120/120"
                            alt={addon.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-lg object-cover"
                          />
                        </div>
                        
                        <h4 className="font-medium text-charcoal text-xs sm:text-sm mb-1 h-8 sm:h-10 overflow-hidden leading-tight">
                          {addon.name}
                        </h4>
                        
                        <div className="text-caramel font-bold text-xs sm:text-sm mb-2 sm:mb-3">
                          {formatPrice(parseFloat(addon.price))} {addon.category === 'candles' && 'Per Candle'}
                        </div>

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
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Bottom Actions - Sticky */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 sm:p-6 border-t bg-white shadow-lg">
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