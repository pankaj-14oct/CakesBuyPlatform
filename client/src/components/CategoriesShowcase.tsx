import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cake, Heart, Star, Gift } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  isActive: boolean;
}

const categoryGradients = [
  'from-pink-400 via-pink-500 to-pink-600',
  'from-yellow-400 via-yellow-500 to-orange-500',
  'from-purple-400 via-purple-500 to-purple-600',
  'from-blue-400 via-blue-500 to-blue-600',
  'from-green-400 via-green-500 to-green-600',
  'from-red-400 via-red-500 to-red-600',
  'from-indigo-400 via-indigo-500 to-indigo-600',
  'from-teal-400 via-teal-500 to-teal-600',
  'from-orange-400 via-orange-500 to-orange-600',
  'from-rose-400 via-rose-500 to-rose-600',
];

const categoryIcons = {
  'birthday': <Cake className="w-6 h-6" />,
  'anniversary': <Heart className="w-6 h-6" />,
  'wedding': <Gift className="w-6 h-6" />,
  'theme': <Star className="w-6 h-6" />,
  'default': <Cake className="w-6 h-6" />
};

const getIconForCategory = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('birthday')) return categoryIcons.birthday;
  if (lowerName.includes('anniversary')) return categoryIcons.anniversary;
  if (lowerName.includes('wedding')) return categoryIcons.wedding;
  if (lowerName.includes('theme')) return categoryIcons.theme;
  return categoryIcons.default;
};

export default function CategoriesShowcase() {
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const activeCategories = categories.filter(cat => cat.isActive);
  
  // Find the "Cakes" parent category
  const cakesParentCategory = activeCategories.find(cat => 
    cat.name.toLowerCase().includes('cakes') && !cat.parentId
  );
  
  // Get only child categories under "Cakes"
  const cakeChildCategories = activeCategories.filter(cat => 
    cat.parentId === cakesParentCategory?.id
  );

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-pink-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Browse Our Cake Categories</h2>
            <p className="text-xl text-gray-600">Loading delicious categories...</p>
          </div>
        </div>
      </section>
    );
  }

  // If no cake child categories found, show all active categories as fallback
  const categoriesToShow = cakeChildCategories.length > 0 ? cakeChildCategories : activeCategories.slice(0, 8);

  return (
    <section className="py-16 bg-gradient-to-br from-pink-50 to-orange-50">
      <div className="w-full">
        <div className="text-center mb-12 px-4">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Browse Our Cake Categories</h2>
          <p className="text-xl text-gray-600">From classic birthdays to custom creations, find the perfect cake for every occasion</p>
        </div>

        {/* Horizontal Scrollable Categories */}
        <div className="overflow-x-auto pb-6 hide-scrollbar">
          <div className="flex gap-4 px-4" style={{ width: 'max-content' }}>
            {categoriesToShow.map((category, index) => {
              const gradientClass = categoryGradients[index % categoryGradients.length];
              
              return (
                <Link key={category.id} href={`/cakes/${category.slug}`}>
                  <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer overflow-hidden w-52 flex-shrink-0 rounded-3xl">
                    <div className={`relative h-40 bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
                      {/* Decorative stars */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                        <div className="absolute top-8 right-6 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-100"></div>
                        <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-white/35 rounded-full animate-pulse delay-200"></div>
                        <div className="absolute bottom-4 right-4 w-1 h-1 bg-white/30 rounded-full animate-pulse delay-300"></div>
                      </div>

                      {/* Category image or icon */}
                      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
                        {category.image ? (
                          <img 
                            src={category.image} 
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <div className="text-white text-xl">
                              {getIconForCategory(category.name)}
                            </div>
                          </div>
                        )}
                        
                        {/* Sparkle effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full animate-ping"></div>
                          <div className="absolute bottom-2 left-2 w-1 h-1 bg-white rounded-full animate-ping delay-100"></div>
                          <div className="absolute top-4 left-6 w-1 h-1 bg-white rounded-full animate-ping delay-200"></div>
                          <div className="absolute bottom-6 right-8 w-1 h-1 bg-white rounded-full animate-ping delay-300"></div>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-4 text-center bg-white">
                      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider group-hover:text-caramel transition-colors">
                        {category.name}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="text-center text-gray-500 text-sm mb-8 px-4">
          <Link href="/search">
            <span className="inline-flex items-center gap-2 hover:text-caramel transition-colors cursor-pointer">
              <span>← Scroll to see more categories →</span>
            </span>
          </Link>
        </div>

        {/* View All Categories Button */}
        <div className="text-center px-4">
          <Link href="/search">
            <button className="bg-caramel hover:bg-brown text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              View All Cakes
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}