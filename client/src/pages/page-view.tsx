import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { type Page } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, FileText, Calendar, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PageView() {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, error } = useQuery<Page>({
    queryKey: ['/api/pages', slug],
    queryFn: async () => {
      const response = await apiRequest(`/api/pages/${slug}`);
      if (!response.ok) {
        throw new Error('Page not found');
      }
      return response.json();
    },
  });

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-red-500" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={page.isPublished ? "default" : "secondary"}>
                      {page.isPublished ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Published
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Draft
                        </>
                      )}
                    </Badge>
                    {page.showInMenu && (
                      <Badge variant="outline">
                        In Menu (Order: {page.menuOrder})
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created: {new Date(page.createdAt!).toLocaleDateString()}
                </div>
                {page.updatedAt && page.updatedAt !== page.createdAt && (
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-4 w-4" />
                    Updated: {new Date(page.updatedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* SEO Information */}
            {(page.metaDescription || page.metaKeywords) && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">SEO Information</h3>
                {page.metaDescription && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Description:</span> {page.metaDescription}
                  </p>
                )}
                {page.metaKeywords && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Keywords:</span> {page.metaKeywords}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Page Content */}
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}