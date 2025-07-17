import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Search, Filter, SortAsc } from 'lucide-react';
import { Link } from 'wouter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Pagination from '@/components/pagination';
// Define the Cake type locally
interface Cake {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  basePrice: number;
  originalPrice?: number;
  isEggless: boolean;
  categoryId: number;
  isBestseller: boolean;
  isCustomizable: boolean;
  customizationOptions?: any;
  weightOptions?: any;
  flavorOptions?: any;
}

// Define the paginated response type
interface PaginatedResponse {
  cakes: Cake[];
  total: number;
  pages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function SearchPage() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [filterCategory, setFilterCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  
  // Get search query from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [location]);

  // Fetch cakes based on search query
  const { data: cakeData, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['/api/cakes', searchQuery, sortBy, filterCategory, priceRange, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy !== 'relevance') params.append('sort', sortBy);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (priceRange !== 'all') params.append('price', priceRange);
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      
      const response = await fetch(`/api/cakes?${params}`);
      if (!response.ok) throw new Error('Failed to fetch cakes');
      return response.json();
    },
    enabled: !!searchQuery
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, filterCategory, priceRange]);

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Search for cakes, flavors, occasions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <Button type="submit" className="bg-red-500 hover:bg-red-600 h-12 px-6">
              Search
            </Button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search Results Header */}
        {searchQuery && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Search Results for "{searchQuery}"
            </h1>
            <p className="text-gray-600">
              {cakeData ? `${cakeData.total} cakes found` : 'Searching...'}
            </p>
          </div>
        )}

        {/* Filters and Sorting */}
        <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((category: any) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="0-500">Under ₹500</SelectItem>
              <SelectItem value="500-1000">₹500 - ₹1000</SelectItem>
              <SelectItem value="1000-2000">₹1000 - ₹2000</SelectItem>
              <SelectItem value="2000+">Above ₹2000</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 ml-auto">
            <SortAsc className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Customer Rating</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : cakeData && cakeData.cakes && cakeData.cakes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cakeData.cakes.map((cake) => (
              <Card key={cake.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={cake.imageUrl || `/api/placeholder/400/300`}
                    alt={cake.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-2">{cake.name}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{cake.description}</p>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium ml-1">4.5</span>
                    </div>
                    <span className="text-gray-400 text-sm">•</span>
                    <span className="text-gray-600 text-sm">250+ reviews</span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(cake.basePrice)}
                      </span>
                      {cake.originalPrice && cake.originalPrice > cake.basePrice && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(cake.originalPrice)}
                        </span>
                      )}
                    </div>
                    {cake.isEggless && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        Eggless
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/cake/${cake.slug}`} className="flex-1">
                      <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
            
            {/* Pagination */}
            {cakeData.pages > 1 && (
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
          </>
        ) : searchQuery ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No cakes found
            </h2>
            <p className="text-gray-600 mb-4">
              We couldn't find any cakes matching "{searchQuery}". Try different keywords or browse our categories.
            </p>
            <Link href="/">
              <Button className="bg-red-500 hover:bg-red-600 text-white">
                Browse All Cakes
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Start your search
            </h2>
            <p className="text-gray-600">
              Enter a search term above to find your perfect cake
            </p>
          </div>
        )}

        {/* Popular Searches */}
        {!searchQuery && (
          <div className="mt-12 bg-white rounded-lg p-6 border">
            <h3 className="text-lg font-semibold mb-4">Popular Searches</h3>
            <div className="flex flex-wrap gap-2">
              {[
                'Chocolate Cake',
                'Birthday Cake',
                'Vanilla Cake',
                'Red Velvet',
                'Anniversary Cake',
                'Photo Cake',
                'Fruit Cake',
                'Black Forest',
                'Butterscotch',
                'Strawberry Cake'
              ].map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery(term);
                    setLocation(`/search?q=${encodeURIComponent(term)}`);
                  }}
                  className="text-sm"
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}