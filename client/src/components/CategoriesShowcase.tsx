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
  const mainCategories = activeCategories.filter(cat => !cat.parentId);

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

  return (
    <section className="py-16 bg-gradient-to-br from-pink-50 to-orange-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Browse Our Cake Categories</h2>
          <p className="text-xl text-gray-600">From classic birthdays to custom creations, find the perfect cake for every occasion</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mainCategories.map((category, index) => {
            const gradientClass = categoryGradients[index % categoryGradients.length];
            const childCategories = activeCategories.filter(cat => cat.parentId === category.id);
            
            return (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer overflow-hidden">
                  <div className={`relative h-48 bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
                    {/* Decorative stars */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                      <div className="absolute top-8 right-6 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-100"></div>
                      <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-white/35 rounded-full animate-pulse delay-200"></div>
                      <div className="absolute bottom-4 right-4 w-1 h-1 bg-white/30 rounded-full animate-pulse delay-300"></div>
                    </div>

                    {/* Category image or icon */}
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      {category.image ? (
                        <img 
                          src={category.image} 
                          alt={category.name}
                          className="w-20 h-20 object-cover rounded-full border-4 border-white/30 shadow-lg group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <div className="text-white">
                            {getIconForCategory(category.name)}
                          </div>
                        </div>
                      )}
                      
                      {/* Sparkle effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full animate-ping"></div>
                        <div className="absolute bottom-2 left-2 w-1 h-1 bg-white rounded-full animate-ping delay-100"></div>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6 text-center bg-white">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-caramel transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {category.description || `Delicious ${category.name.toLowerCase()} for every occasion`}
                    </p>
                    
                    {childCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {childCategories.slice(0, 3).map(child => (
                          <Badge key={child.id} variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-caramel hover:text-white transition-colors">
                            {child.name}
                          </Badge>
                        ))}
                        {childCategories.length > 3 && (
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                            +{childCategories.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* View All Categories Button */}
        <div className="text-center mt-12">
          <Link href="/categories">
            <button className="bg-caramel hover:bg-brown text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              View All Categories
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}