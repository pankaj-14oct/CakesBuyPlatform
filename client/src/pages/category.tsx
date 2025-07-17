import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { Category, Cake } from '@shared/schema';
import CakeCard from '@/components/cake-card';
import Pagination from '@/components/pagination';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [sortBy, setSortBy] = useState('popular');
  const [filterEggless, setFilterEggless] = useState<boolean | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: ['/api/categories', slug],
    queryFn: async () => {
      const response = await fetch(`/api/categories/${slug}`);
      if (!response.ok) throw new Error('Category not found');
      return response.json();
    },
    enabled: !!slug,
  });

  const { data: cakeData, isLoading: cakesLoading } = useQuery<{
    cakes: Cake[];
    total: number;
    pages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>({
    queryKey: ['/api/cakes', { categoryId: category?.id, isEggless: filterEggless, page: currentPage, limit: pageSize }],
    queryFn: async () => {
      let url = '/api/cakes';
      const params = new URLSearchParams();
      
      if (category?.id) params.append('categoryId', category.id.toString());
      if (filterEggless !== undefined) params.append('isEggless', filterEggless.toString());
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch cakes');
      return response.json();
    },
    enabled: !!category,
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterEggless]);

  const cakes = cakeData?.cakes || [];
  const sortedCakes = [...cakes].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return parseFloat(a.basePrice) - parseFloat(b.basePrice);
      case 'price-high':
        return parseFloat(b.basePrice) - parseFloat(a.basePrice);
      case 'rating':
        return parseFloat(b.rating) - parseFloat(a.rating);
      case 'popular':
      default:
        return b.reviewCount - a.reviewCount;
    }
  });

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-gray-200 rounded h-8 w-64 mb-4"></div>
            <div className="bg-gray-200 rounded h-4 w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <div className="bg-gray-200 h-48"></div>
                  <CardContent className="p-6">
                    <div className="bg-gray-200 rounded h-4 mb-2"></div>
                    <div className="bg-gray-200 rounded h-3 mb-4"></div>
                    <div className="bg-gray-200 rounded h-8"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-charcoal mb-4">Category Not Found</h1>
          <p className="text-charcoal opacity-70">The requested category could not be found.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Category Header */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="text-4xl mb-4">
              {category.slug === 'birthday' ? '🎂' :
               category.slug === 'anniversary' ? '💖' :
               category.slug === 'kids' ? '🧸' :
               category.slug === 'eggless' ? '🌱' :
               category.slug === 'custom' ? '🎨' :
               category.slug === 'wedding' ? '💍' : '🎂'}
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-charcoal mb-4">
              {category.name}
            </h1>
            <p className="text-lg text-charcoal opacity-70 max-w-2xl mx-auto">
              {category.description}
            </p>
          </div>
        </div>
      </section>

      {/* Filters and Controls */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              {showFilters && (
                <div className="flex items-center space-x-4">
                  <Select value={filterEggless?.toString() || 'all'} onValueChange={(value) => 
                    setFilterEggless(value === 'all' ? undefined : value === 'true')
                  }>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="true">Eggless</SelectItem>
                      <SelectItem value="false">With Eggs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-charcoal opacity-70">
                {cakeData?.total || 0} cakes found
              </span>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Cakes Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {cakesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48"></div>
                  <CardContent className="p-6">
                    <div className="bg-gray-200 rounded h-4 mb-2"></div>
                    <div className="bg-gray-200 rounded h-3 mb-4"></div>
                    <div className="bg-gray-200 rounded h-8"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedCakes.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">🎂</div>
              <h3 className="text-xl font-semibold text-charcoal mb-2">No cakes found</h3>
              <p className="text-charcoal opacity-70">
                Try adjusting your filters or check back later for new arrivals.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {sortedCakes.map((cake) => (
                <CakeCard key={cake.id} cake={cake} />
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {cakeData && cakeData.pages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={cakeData.currentPage}
                totalPages={cakeData.pages}
                onPageChange={setCurrentPage}
                showingFrom={(cakeData.currentPage - 1) * pageSize + 1}
                showingTo={Math.min(cakeData.currentPage * pageSize, cakeData.total)}
                totalItems={cakeData.total}
              />
            </div>
          )}
        </div>
      </section>

      {/* Category Features */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-mint text-white p-4 rounded-2xl inline-block mb-4">
                🚚
              </div>
              <h3 className="font-semibold text-charcoal mb-2">Same Day Delivery</h3>
              <p className="text-charcoal opacity-70">Order before 6 PM for same-day delivery</p>
            </div>
            
            <div className="text-center">
              <div className="bg-caramel text-white p-4 rounded-2xl inline-block mb-4">
                🎨
              </div>
              <h3 className="font-semibold text-charcoal mb-2">Customization Available</h3>
              <p className="text-charcoal opacity-70">Personalize your cake with custom messages and designs</p>
            </div>
            
            <div className="text-center">
              <div className="bg-pink text-white p-4 rounded-2xl inline-block mb-4">
                ✨
              </div>
              <h3 className="font-semibold text-charcoal mb-2">Fresh & Premium</h3>
              <p className="text-charcoal opacity-70">Made with finest ingredients daily</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
