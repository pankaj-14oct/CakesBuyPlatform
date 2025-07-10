import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Package, Upload, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Category } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.number().optional(),
  isActive: z.boolean().default(true),
});

type CategoryForm = z.infer<typeof categorySchema>;

export default function AdminCategories() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image: '',
      parentId: undefined,
      isActive: true,
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: CategoryForm) => {
      const response = await apiRequest('/api/admin/categories', 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setEditingCategory(null);
      setUploadedImage(null);
      setIsCreateDialogOpen(false);
      form.reset();
      toast({ title: "Category created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create category", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Category> }) => {
      const response = await apiRequest(`/api/admin/categories/${id}`, 'PUT', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setEditingCategory(null);
      setUploadedImage(null);
      setIsCreateDialogOpen(false);
      form.reset();
      toast({ title: "Category updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update category", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/admin/categories/${id}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "Category deleted successfully!" });
    },
    onError: (error) => {
      console.error('Delete category error:', error);
      toast({ title: "Failed to delete category", variant: "destructive" });
    }
  });

  const onSubmit = (data: CategoryForm) => {
    const submitData = {
      ...data,
      image: uploadedImage || data.image
    };
    
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleImageUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      setUploadedImage(data.imageUrl);
      form.setValue('image', data.imageUrl);
      toast({ title: "Image uploaded successfully!" });
    } catch (error) {
      toast({ title: "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  }, [form, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageUpload(imageFile);
    }
  }, [handleImageUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    const categoryImage = (category as any).image || '';
    setUploadedImage(categoryImage);
    form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: categoryImage,
      parentId: (category as any).parentId || undefined,
      isActive: category.isActive || true,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleActive = (category: Category) => {
    updateMutation.mutate({
      id: category.id,
      data: { ...category, isActive: !category.isActive }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Categories</h1>
          <p className="text-charcoal opacity-70">Manage product categories</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-caramel hover:bg-brown">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto pr-2">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="category-form">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Category name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  {...form.register('slug')}
                  placeholder="category-slug"
                />
                {form.formState.errors.slug && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.slug.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Category description"
                />
              </div>

              <div>
                <Label>Category Image</Label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  {uploadedImage ? (
                    <div className="space-y-4">
                      <img 
                        src={uploadedImage} 
                        alt="Category preview" 
                        className="w-32 h-32 object-cover rounded-lg mx-auto"
                      />
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedImage(null);
                            form.setValue('image', '');
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('image-upload')?.click();
                          }}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Change
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isUploading ? (
                        <div className="text-gray-500">
                          <Upload className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                          Uploading image...
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto text-gray-400" />
                          <div>
                            <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
                            <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="parentId">Parent Category</Label>
                <Select
                  value={form.watch('parentId')?.toString() || 'none'}
                  onValueChange={(value) => {
                    form.setValue('parentId', value === 'none' ? undefined : parseInt(value));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="none">
                      <span className="font-medium">No Parent (Top Level)</span>
                    </SelectItem>
                    
                    {/* Parent Categories Section */}
                    {categories
                      .filter(cat => cat.id !== editingCategory?.id && !(cat as any).parentId)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          <div className="flex items-center space-x-2 font-medium">
                            <span>📁 {category.name}</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Parent
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    
                    {/* Child Categories Section (if any exist) */}
                    {categories.some(cat => (cat as any).parentId && cat.id !== editingCategory?.id) && (
                      <>
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                          Child Categories
                        </div>
                        {categories
                          .filter(cat => cat.id !== editingCategory?.id && (cat as any).parentId)
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              <div className="flex items-center space-x-1 pl-4">
                                <span className="text-gray-400">└─</span>
                                <span>{category.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={form.watch('isActive')}
                    onCheckedChange={(checked) => form.setValue('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </form>
            </div>
            
            {/* Sticky footer with buttons */}
            <div className="flex-shrink-0 border-t pt-4 mt-4 bg-white">
              <div className="flex space-x-2">
                <Button
                  type="submit"
                  form="category-form"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-caramel hover:bg-brown"
                >
                  {editingCategory ? 'Update' : 'Create'} Category
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingCategory(null);
                    setUploadedImage(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            All Categories ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-charcoal opacity-60">No categories found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Parent Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories
                  .sort((a, b) => {
                    // First sort by parent status (parents first)
                    const aIsParent = !(a as any).parentId;
                    const bIsParent = !(b as any).parentId;
                    
                    if (aIsParent && !bIsParent) return -1;
                    if (!aIsParent && bIsParent) return 1;
                    
                    // Then sort by name
                    return a.name.localeCompare(b.name);
                  })
                  .map((category) => {
                  const parentCategory = categories.find(c => c.id === (category as any).parentId);
                  const isChild = (category as any).parentId;
                  
                  return (
                    <TableRow key={category.id} className={isChild ? "bg-gray-50/50" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {isChild && (
                            <div className="flex items-center text-gray-400 mr-1">
                              <div className="w-3 h-3 border-l-2 border-b-2 border-gray-300 rounded-bl-sm"></div>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <span className={isChild ? "text-gray-700 ml-2" : "text-gray-900 font-semibold"}>
                              {category.name}
                            </span>
                            {!isChild && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                Parent
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{category.slug}</TableCell>
                      <TableCell>
                        {parentCategory ? (
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              {parentCategory.name}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm font-medium">Root Category</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {category.description || '-'}
                      </TableCell>
                      <TableCell>
                        {(category as any).image ? (
                          <img 
                            src={(category as any).image} 
                            alt={category.name}
                            className="w-12 h-12 object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                      </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={category.isActive || false}
                          onCheckedChange={() => toggleActive(category)}
                          disabled={updateMutation.isPending}
                        />
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}