import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Settings, Star } from 'lucide-react';
import { Cake } from '@shared/schema';
import { formatPrice } from '@/lib/utils';

interface CakeCardProps {
  cake: Cake;
}

export default function CakeCard({ cake }: CakeCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const getRatingStars = (rating: string | null) => {
    if (!rating) return null;
    const ratingNum = parseFloat(rating);
    const fullStars = Math.floor(ratingNum);
    const hasHalfStar = ratingNum % 1 !== 0;
    
    return (
      <div className="flex text-yellow-400 text-sm">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="h-3 w-3 fill-current" />
        ))}
        {hasHalfStar && <Star className="h-3 w-3 fill-current opacity-50" />}
        {[...Array(5 - Math.ceil(ratingNum))].map((_, i) => (
          <Star key={`empty-${i}`} className="h-3 w-3" />
        ))}
      </div>
    );
  };

  // Calculate prices - prioritize weights array, fallback to basePrice
  const weightPrice = cake.weights && cake.weights.length > 0 ? cake.weights[0].price : null;
  const basePrice = cake.basePrice ? parseFloat(cake.basePrice.toString()) : 0;
  
  // Use weight price if available, otherwise use base price
  const price = weightPrice || basePrice || 0;

  return (
    <Link href={`/product/${cake.slug}`}>
      <Card className="bg-white rounded-2xl shadow-lg overflow-hidden cake-card group hover:shadow-xl transition-all duration-300">
        <div className="relative">
          <img 
            src={cake.images?.[0] || '/placeholder-cake.jpg'} 
            alt={cake.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {cake.deliveryOptions?.sameDay && (
              <Badge className="bg-mint text-white text-xs font-semibold">
                Same Day
              </Badge>
            )}
            {cake.isBestseller && (
              <Badge className="bg-pink text-white text-xs font-semibold">
                Bestseller
              </Badge>
            )}
            {cake.isEggless && (
              <Badge className="bg-green-500 text-white text-xs font-semibold">
                Eggless
              </Badge>
            )}
            {cake.isPhotoCake && (
              <Badge className="bg-blue-500 text-white text-xs font-semibold">
                📸 Photo
              </Badge>
            )}
          </div>
          
          {/* Like Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            className={`absolute bottom-3 right-3 bg-white bg-opacity-90 opacity-0 group-hover:opacity-100 transition-opacity ${
              isLiked ? 'text-red-500' : 'text-caramel'
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
        </div>
        
        <CardContent className="p-6">
          <h3 className="font-semibold text-charcoal mb-2 group-hover:text-caramel transition-colors">
            {cake.name}
          </h3>
          <p className="text-sm text-charcoal opacity-70 mb-3 line-clamp-2">
            {cake.description}
          </p>
          
          {/* Rating */}
          <div className="flex items-center mb-3">
            {getRatingStars(cake.rating)}
            <span className="text-sm text-charcoal opacity-60 ml-2">
              ({cake.reviewCount} reviews)
            </span>
          </div>
          
          {/* Price */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xl font-bold text-brown">
                {formatPrice(price)}
              </span>
            </div>
            <div className="text-sm text-charcoal opacity-70">
              {cake.weights?.[0]?.weight}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              className="flex-1 bg-caramel text-white hover:bg-brown transition-colors"
            >
              View Details
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-caramel text-caramel hover:bg-caramel hover:text-white transition-colors"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
