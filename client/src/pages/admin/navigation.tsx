import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Menu, ArrowUp, ArrowDown, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface NavigationItem {
  id: number;
  name: string;
  slug: string;
  url: string;
  position: number;
  isActive: boolean;
  isNew: boolean;
  categoryId?: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function AdminNavigation() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    url: '',
    isActive: true,
    isNew: false,
    categoryId: undefined as number | undefined
  });
  const [reorderMode, setReorderMode] = useState(false);
  const [tempOrder, setTempOrder] = useState<NavigationItem[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch navigation items
  const { data: navigationItems = [], isLoading } = useQuery<NavigationItem[]>({
    queryKey: ['/api/admin/navigation-items'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/navigation-items');
      return Array.isArray(response) ? response : [];
    }
  });

  // Fetch categories for dropdown
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await apiRequest('/api/categories');
      console.log('Categories API Response:', response);
      return Array.isArray(response) ? response : [];
    }
  });

  // Debug categories
  console.log('Categories data:', categories, 'Length:', categories.length);

  // Create navigation item mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/navigation-items', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/navigation-items'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: 'Success', description: 'Navigation item created successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create navigation item', variant: 'destructive' });
    }
  });

  // Update navigation item mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/admin/navigation-items/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/navigation-items'] });
      setEditingItem(null);
      resetForm();
      toast({ title: 'Success', description: 'Navigation item updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update navigation item', variant: 'destructive' });
    }
  });

  // Delete navigation item mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/navigation-items/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/navigation-items'] });
      toast({ title: 'Success', description: 'Navigation item deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete navigation item', variant: 'destructive' });
    }
  });

  // Reorder navigation items mutation
  const reorderMutation = useMutation({
    mutationFn: (itemIds: number[]) => 
      apiRequest('/api/admin/navigation-items/reorder', 'POST', { itemIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/navigation-items'] });
      setReorderMode(false);
      toast({ title: 'Success', description: 'Navigation items reordered successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to reorder navigation items', variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      url: '',
      isActive: true,
      isNew: false,
      categoryId: undefined
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item: NavigationItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      slug: item.slug,
      url: item.url,
      isActive: item.isActive,
      isNew: item.isNew,
      categoryId: item.categoryId
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({ 
      ...prev, 
      name,
      slug: generateSlug(name)
    }));
  };

  const startReorder = () => {
    setReorderMode(true);
    setTempOrder([...navigationItems]);
  };

  const cancelReorder = () => {
    setReorderMode(false);
    setTempOrder([]);
  };

  const saveReorder = () => {
    const itemIds = tempOrder.map(item => item.id);
    reorderMutation.mutate(itemIds);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...tempOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      setTempOrder(newOrder);
    }
  };

  const displayItems = reorderMode ? (Array.isArray(tempOrder) ? tempOrder : []) : (Array.isArray(navigationItems) ? navigationItems : []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">Loading navigation items...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Navigation Management</h1>
          <p className="text-gray-600">Manage header navigation items and their order</p>
        </div>
        <div className="flex gap-2">
          {!reorderMode ? (
            <>
              <Button
                variant="outline"
                onClick={startReorder}
                disabled={navigationItems.length === 0}
              >
                <Menu className="h-4 w-4 mr-2" />
                Reorder Items
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Navigation Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Navigation Item</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        value={formData.url}
                        onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="/category/example"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Linked Category (Optional)</Label>
                      <Select 
                        value={formData.categoryId?.toString() || "none"} 
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          categoryId: value && value !== "none" ? parseInt(value) : undefined 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No category</SelectItem>
                          {categories.length > 0 ? (
                            categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isNew"
                        checked={formData.isNew}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isNew: checked }))}
                      />
                      <Label htmlFor="isNew">Show "New" Badge</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createMutation.isPending}>
                        {createMutation.isPending ? 'Creating...' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={cancelReorder}
                disabled={reorderMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={saveReorder}
                disabled={reorderMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {reorderMutation.isPending ? 'Saving...' : 'Save Order'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Navigation Items</CardTitle>
        </CardHeader>
        <CardContent>
          {displayItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No navigation items found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {reorderMode ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">{index + 1}</span>
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveItem(index, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveItem(index, 'down')}
                              disabled={index === displayItems.length - 1}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm font-mono">{item.position + 1}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {item.isNew && <Badge variant="secondary">New</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {item.url}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'secondary'}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!reorderMode && (
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Navigation Item</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-name">Name</Label>
                                  <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-slug">Slug</Label>
                                  <Input
                                    id="edit-slug"
                                    value={formData.slug}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-url">URL</Label>
                                  <Input
                                    id="edit-url"
                                    value={formData.url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-category">Linked Category (Optional)</Label>
                                  <Select 
                                    value={formData.categoryId?.toString() || "none"} 
                                    onValueChange={(value) => setFormData(prev => ({ 
                                      ...prev, 
                                      categoryId: value && value !== "none" ? parseInt(value) : undefined 
                                    }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No category</SelectItem>
                                      {categories.length > 0 ? (
                                        categories.map((category) => (
                                          <SelectItem key={category.id} value={category.id.toString()}>
                                            {category.name}
                                          </SelectItem>
                                        ))
                                      ) : (
                                        <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="edit-isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                                  />
                                  <Label htmlFor="edit-isActive">Active</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="edit-isNew"
                                    checked={formData.isNew}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isNew: checked }))}
                                  />
                                  <Label htmlFor="edit-isNew">Show "New" Badge</Label>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? 'Updating...' : 'Update'}
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Navigation Item</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(item.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}