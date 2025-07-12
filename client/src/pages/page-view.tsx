import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { type Page } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, FileText, Calendar, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PageView() {
  const { slug } = useParams<{ slug: string }>();

  // Skip this component if slug matches known routes
  const knownRoutes = [
    'search', 'cart', 'checkout', 'delivery', 'auth', 'otp-register', 
    'forgot-password', 'admin-login', 'occasions', 'occasion-reminder', 
    'profile', 'orders', 'invoices', 'loyalty', 'track-order', 
    'customized-cakes', 'admin', 'delivery'
  ];
  
  if (knownRoutes.includes(slug || '') || (slug || '').startsWith('admin/') || (slug || '').startsWith('delivery/')) {
    return null; // Let other routes handle this
  }

  const { data: page, isLoading, error } = useQuery<Page>({
    queryKey: ['/api/pages', slug],
    queryFn: async () => {
      const response = await apiRequest(`/api/pages/${slug}`);
      if (!response.ok) {
        throw new Error('Page not found');
      }
      return response.json();
    },
    retry: false, // Don't retry on 404s
  });

  // Update document head with meta information
  React.useEffect(() => {
    if (page) {
      // Update page title
      document.title = `${page.title} - CakesBuy`;
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', page.metaDescription || '');
      
      // Update meta keywords
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', page.metaKeywords || '');
    }
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'CakesBuy - 100% Eggless Cake Shop';
    };
  }, [page]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
            <p className="text-center mt-4 text-gray-600">Loading page...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Content Only - Clean Display */}
      <div 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}