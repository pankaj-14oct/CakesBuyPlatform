import { Link } from 'wouter';
import { Category } from '@shared/schema';

interface CategoryCardProps {
  category: Category;
  cakeCount?: number;
}

export default function CategoryCard({ category, cakeCount = 0 }: CategoryCardProps) {
  const gradientClasses = {
    'birthday': 'from-pink to-caramel',
    'anniversary': 'from-brown to-caramel',
    'kids': 'from-pink to-purple-400',
    'eggless': 'from-mint to-green-400',
    'custom': 'from-caramel to-yellow-500',
    'wedding': 'from-purple-500 to-pink-500',
  };

  const gradient = gradientClasses[category.slug as keyof typeof gradientClasses] || 'from-caramel to-brown';

  return (
    <Link href={`/category/${category.slug}`}>
      <div className="text-center group cursor-pointer">
        <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 mb-4 group-hover:scale-105 transition-transform duration-300`}>
          <div className="text-3xl text-white">
            {category.icon?.includes('fa-') ? (
              <i className={category.icon}></i>
            ) : (
              // Default icons based on category
              category.slug === 'birthday' ? '🎂' :
              category.slug === 'anniversary' ? '💖' :
              category.slug === 'kids' ? '🧸' :
              category.slug === 'eggless' ? '🌱' :
              category.slug === 'custom' ? '🎨' :
              category.slug === 'wedding' ? '💍' : '🎂'
            )}
          </div>
        </div>
        <h3 className="font-semibold text-charcoal group-hover:text-caramel transition-colors">
          {category.name}
        </h3>
        <p className="text-sm text-charcoal opacity-60">
          {cakeCount > 0 ? `${cakeCount}+ varieties` : category.description}
        </p>
      </div>
    </Link>
  );
}
