import { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Package, Star } from 'lucide-react';
import { Cake, Category } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  description: z.string().optional(),
  categoryId: z.number().min(1, 'Category is required'),
  basePrice: z.string().min(1, 'Base price is required'),
  images: z.array(z.string()).default([]),
  flavors: z.array(z.string()).default([]),
  weights: z.array(z.object({
    weight: z.string(),
    price: z.number()
  })).default([]),
  isEggless: z.boolean().default(false),
  isCustomizable: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  isBestseller: z.boolean().default(false),
  isPhotoCake: z.boolean().default(false),
  backgroundImage: z.string().optional(),
  tags: z.array(z.string()).default([]),
  rating: z.string().default("0"),
  reviewCount: z.number().default(0),
  deliveryOptions: z.object({
    sameDay: z.boolean().default(true),
    midnight: z.boolean().default(true),
    scheduled: z.boolean().default(true),
  }).default({})
});

type ProductForm = z.infer<typeof productSchema>;

export default function AdminProducts() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Cake | null>(null);
  const [weightInput, setWeightInput] = useState({ weight: '', price: '' });
  const [flavorInput, setFlavorInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery<Cake[]>({
    queryKey: ['/api/cakes'],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      categoryId: 0,
      basePrice: '',
      images: [],
      flavors: [],
      weights: [],
      isEggless: false,
      isCustomizable: true,
      isAvailable: true,
      isBestseller: false,
      isPhotoCake: false,
      backgroundImage: '',
      tags: [],
      rating: "0",
      reviewCount: 0,
      deliveryOptions: {
        sameDay: true,
        midnight: true,
        scheduled: true,
      }
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const response = await apiRequest('/api/admin/cakes', 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cakes'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({ title: "Product created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create product", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Cake> }) => {
      const response = await apiRequest(`/api/admin/cakes/${id}`, 'PUT', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cakes'] });
      setEditingProduct(null);
      toast({ title: "Product updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update product", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/cakes/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cakes'] });
      toast({ title: "Product deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete product", variant: "destructive" });
    }
  });

  const onSubmit = (data: ProductForm) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (product: Cake) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      categoryId: product.categoryId || 0,
      basePrice: product.basePrice,
      images: product.images || [],
      flavors: product.flavors || [],
      weights: product.weights || [],
      isEggless: product.isEggless || false,
      isCustomizable: product.isCustomizable || true,
      isAvailable: product.isAvailable || true,
      isBestseller: product.isBestseller || false,
      isPhotoCake: product.isPhotoCake || false,
      backgroundImage: product.backgroundImage || '',
      tags: product.tags || [],
      rating: product.rating || "0",
      reviewCount: product.reviewCount || 0,
      deliveryOptions: product.deliveryOptions || {
        sameDay: true,
        midnight: true,
        scheduled: true,
      }
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleAvailable = (product: Cake) => {
    updateMutation.mutate({
      id: product.id,
      data: { ...product, isAvailable: !product.isAvailable }
    });
  };

  const addWeight = () => {
    if (weightInput.weight && weightInput.price) {
      const currentWeights = form.getValues('weights');
      form.setValue('weights', [
        ...currentWeights,
        { weight: weightInput.weight, price: parseFloat(weightInput.price) }
      ]);
      setWeightInput({ weight: '', price: '' });
    }
  };

  const removeWeight = (index: number) => {
    const currentWeights = form.getValues('weights');
    form.setValue('weights', currentWeights.filter((_, i) => i !== index));
  };

  const addFlavor = () => {
    if (flavorInput.trim()) {
      const currentFlavors = form.getValues('flavors');
      form.setValue('flavors', [...currentFlavors, flavorInput.trim()]);
      setFlavorInput('');
    }
  };

  const removeFlavor = (index: number) => {
    const currentFlavors = form.getValues('flavors');
    form.setValue('flavors', currentFlavors.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues('tags');
      form.setValue('tags', [...currentTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter((_, i) => i !== index));
  };

  const addImage = () => {
    if (imageInput.trim()) {
      const currentImages = form.getValues('images');
      form.setValue('images', [...currentImages, imageInput.trim()]);
      setImageInput('');
    }
  };

  const removeImage = (index: number) => {
    const currentImages = form.getValues('images');
    form.setValue('images', currentImages.filter((_, i) => i !== index));
  };

  const handleBackgroundImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        form.setValue('backgroundImage', data.url);
        toast({ title: "Background image uploaded successfully!" });
      } else {
        toast({ title: "Failed to upload image", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to upload image", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Products</h1>
          <p className="text-charcoal opacity-70">Manage cake products</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-caramel hover:bg-brown">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="Chocolate Fantasy Cake"
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
                    placeholder="chocolate-fantasy-cake"
                  />
                  {form.formState.errors.slug && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.slug.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Rich chocolate cake with premium frosting..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoryId">Category</Label>
                  <Select onValueChange={(value) => form.setValue('categoryId', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="basePrice">Base Price (₹)</Label>
                  <Input
                    id="basePrice"
                    {...form.register('basePrice')}
                    placeholder="599.00"
                  />
                </div>
              </div>

              {/* Weights */}
              <div>
                <Label>Weight Options</Label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    placeholder="Weight (e.g., 1kg)"
                    value={weightInput.weight}
                    onChange={(e) => setWeightInput(prev => ({ ...prev, weight: e.target.value }))}
                  />
                  <Input
                    placeholder="Price"
                    type="number"
                    value={weightInput.price}
                    onChange={(e) => setWeightInput(prev => ({ ...prev, price: e.target.value }))}
                  />
                  <Button type="button" onClick={addWeight}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.watch('weights').map((weight, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => removeWeight(index)}>
                      {weight.weight} - ₹{weight.price} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Flavors */}
              <div>
                <Label>Flavors</Label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    placeholder="Flavor name"
                    value={flavorInput}
                    onChange={(e) => setFlavorInput(e.target.value)}
                  />
                  <Button type="button" onClick={addFlavor}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.watch('flavors').map((flavor, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => removeFlavor(index)}>
                      {flavor} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <Label>Images (URLs)</Label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    placeholder="Image URL"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                  />
                  <Button type="button" onClick={addImage}>Add</Button>
                </div>
                <div className="space-y-2">
                  {form.watch('images').map((image, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                      <img src={image} alt="" className="w-12 h-12 object-cover rounded" />
                      <span className="flex-1 text-sm truncate">{image}</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => removeImage(index)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    placeholder="Tag name"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                  />
                  <Button type="button" onClick={addTag}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.watch('tags').map((tag, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => removeTag(index)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Checkboxes */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isEggless"
                    checked={form.watch('isEggless')}
                    onCheckedChange={(checked) => form.setValue('isEggless', checked)}
                  />
                  <Label htmlFor="isEggless">Eggless</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isCustomizable"
                    checked={form.watch('isCustomizable')}
                    onCheckedChange={(checked) => form.setValue('isCustomizable', checked)}
                  />
                  <Label htmlFor="isCustomizable">Customizable</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isAvailable"
                    checked={form.watch('isAvailable')}
                    onCheckedChange={(checked) => form.setValue('isAvailable', checked)}
                  />
                  <Label htmlFor="isAvailable">Available</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isBestseller"
                    checked={form.watch('isBestseller')}
                    onCheckedChange={(checked) => form.setValue('isBestseller', checked)}
                  />
                  <Label htmlFor="isBestseller">Bestseller</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPhotoCake"
                    checked={form.watch('isPhotoCake')}
                    onCheckedChange={(checked) => form.setValue('isPhotoCake', checked)}
                  />
                  <Label htmlFor="isPhotoCake">Photo Cake</Label>
                </div>
              </div>

              {/* Background Image for Photo Cakes */}
              {form.watch('isPhotoCake') && (
                <div>
                  <Label htmlFor="backgroundImage">Background Image (for Photo Cakes)</Label>
                  <div className="space-y-2">
                    <Input
                      id="backgroundImage"
                      {...form.register('backgroundImage')}
                      placeholder="Background image URL"
                      readOnly
                    />
                    <div className="flex space-x-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundImageUpload}
                        className="hidden"
                        id="backgroundImageFile"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('backgroundImageFile')?.click()}
                      >
                        Upload Background Image
                      </Button>
                      {form.watch('backgroundImage') && (
                        <img 
                          src={form.watch('backgroundImage')} 
                          alt="Background preview" 
                          className="w-20 h-20 object-cover rounded border"
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This image will appear as the background, with user's uploaded photo as foreground
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-caramel hover:bg-brown"
                >
                  {editingProduct ? 'Update' : 'Create'} Product
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingProduct(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            All Products ({products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-charcoal opacity-60">No products found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const category = categories.find(c => c.id === product.categoryId);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img 
                            src={product.images?.[0] || '/placeholder-cake.jpg'} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <div className="flex space-x-1">
                              {product.isBestseller && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  Bestseller
                                </Badge>
                              )}
                              {product.isEggless && (
                                <Badge variant="outline" className="text-xs">Eggless</Badge>
                              )}
                              {product.isPhotoCake && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">📸 Photo</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{category?.name || 'Uncategorized'}</TableCell>
                      <TableCell>{formatPrice(product.basePrice)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{product.rating}</span>
                          <span className="text-sm text-gray-500">({product.reviewCount})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={product.isAvailable || false}
                            onCheckedChange={() => toggleAvailable(product)}
                            disabled={updateMutation.isPending}
                          />
                          <Badge variant={product.isAvailable ? "default" : "secondary"}>
                            {product.isAvailable ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
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