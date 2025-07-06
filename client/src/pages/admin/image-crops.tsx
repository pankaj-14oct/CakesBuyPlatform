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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Circle, Square, Heart, RectangleHorizontal, CornerDownLeft, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageCropConfig } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

const cropConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  shape: z.enum(['circle', 'square', 'heart', 'rectangle', 'rounded-square']),
  aspectRatio: z.string().default('1:1'),
  customWidth: z.number().optional(),
  customHeight: z.number().optional(),
  borderRadius: z.number().default(0),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().default(0),
  allowedFor: z.array(z.string()).default(['products', 'cakes', 'photos']),
  svgPath: z.string().optional(),
});

type CropConfigForm = z.infer<typeof cropConfigSchema>;

const shapeIcons = {
  circle: Circle,
  square: Square,
  heart: Heart,
  rectangle: RectangleHorizontal,
  'rounded-square': CornerDownLeft,
};

const aspectRatios = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '16:9', label: 'Wide (16:9)' },
  { value: '4:3', label: 'Standard (4:3)' },
  { value: '3:2', label: 'Photo (3:2)' },
  { value: '3:4', label: 'Portrait (3:4)' },
  { value: 'custom', label: 'Custom Size' },
];

export default function AdminImageCrops() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ImageCropConfig | null>(null);
  const [previewShape, setPreviewShape] = useState<string>('circle');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: configs = [], isLoading } = useQuery<ImageCropConfig[]>({
    queryKey: ['/api/admin/image-crops'],
  });

  const form = useForm<CropConfigForm>({
    resolver: zodResolver(cropConfigSchema),
    defaultValues: {
      name: '',
      description: '',
      shape: 'circle',
      aspectRatio: '1:1',
      borderRadius: 0,
      isActive: true,
      isDefault: false,
      sortOrder: 0,
      allowedFor: ['products', 'cakes', 'photos'],
      svgPath: '',
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: CropConfigForm) => 
      fetch('/api/admin/image-crops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/image-crops'] });
      toast({ title: "Crop configuration created successfully!" });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create crop configuration", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CropConfigForm }) => 
      fetch(`/api/admin/image-crops/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/image-crops'] });
      toast({ title: "Crop configuration updated successfully!" });
      setIsCreateDialogOpen(false);
      setEditingConfig(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update crop configuration", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      fetch(`/api/admin/image-crops/${id}`, {
        method: 'DELETE',
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/image-crops'] });
      toast({ title: "Crop configuration deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete crop configuration", variant: "destructive" });
    }
  });

  const onSubmit = (data: CropConfigForm) => {
    if (editingConfig) {
      updateMutation.mutate({ id: editingConfig.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (config: ImageCropConfig) => {
    setEditingConfig(config);
    form.reset({
      name: config.name,
      description: config.description || '',
      shape: config.shape as any,
      aspectRatio: config.aspectRatio || '1:1',
      customWidth: config.customWidth || undefined,
      customHeight: config.customHeight || undefined,
      borderRadius: config.borderRadius || 0,
      isActive: config.isActive || true,
      isDefault: config.isDefault || false,
      sortOrder: config.sortOrder || 0,
      allowedFor: config.allowedFor || ['products', 'cakes', 'photos'],
      svgPath: config.svgPath || '',
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this crop configuration?')) {
      deleteMutation.mutate(id);
    }
  };

  const ShapePreview = ({ shape, className = "w-16 h-16" }: { shape: string; className?: string }) => {
    if (shape === 'heart' && form.watch('svgPath')) {
      return (
        <svg viewBox="0 0 24 24" className={`${className} fill-current text-pink-500`}>
          <path d={form.watch('svgPath')} />
        </svg>
      );
    }

    const baseStyle = `${className} border-2 border-caramel bg-caramel/20`;
    
    switch (shape) {
      case 'circle':
        return <div className={`${baseStyle} rounded-full`} />;
      case 'square':
        return <div className={baseStyle} />;
      case 'heart':
        return <Heart className={`${className} text-pink-500 fill-current`} />;
      case 'rectangle':
        return <div className={`${baseStyle} aspect-video`} />;
      case 'rounded-square':
        return <div className={`${baseStyle} rounded-lg`} />;
      default:
        return <div className={baseStyle} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Image Crop Configurations</h1>
          <p className="text-charcoal opacity-70">Manage image cropping shapes and settings</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-caramel hover:bg-brown">
              <Plus className="mr-2 h-4 w-4" />
              Add Crop Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Edit Crop Configuration' : 'Create New Crop Configuration'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Configuration Name</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="Circle Crop"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="shape">Shape Type</Label>
                  <Select value={form.watch('shape')} onValueChange={(value) => {
                    form.setValue('shape', value as any);
                    setPreviewShape(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shape" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circle">Circle</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="heart">Heart</SelectItem>
                      <SelectItem value="rectangle">Rectangle</SelectItem>
                      <SelectItem value="rounded-square">Rounded Square</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Description of when to use this crop configuration"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                  <Select value={form.watch('aspectRatio')} onValueChange={(value) => form.setValue('aspectRatio', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select aspect ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      {aspectRatios.map(ratio => (
                        <SelectItem key={ratio.value} value={ratio.value}>
                          {ratio.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="borderRadius">Border Radius</Label>
                  <Input
                    id="borderRadius"
                    type="number"
                    {...form.register('borderRadius', { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
              </div>

              {form.watch('aspectRatio') === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customWidth">Custom Width (px)</Label>
                    <Input
                      id="customWidth"
                      type="number"
                      {...form.register('customWidth', { valueAsNumber: true })}
                      placeholder="400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customHeight">Custom Height (px)</Label>
                    <Input
                      id="customHeight"
                      type="number"
                      {...form.register('customHeight', { valueAsNumber: true })}
                      placeholder="300"
                    />
                  </div>
                </div>
              )}

              {form.watch('shape') === 'heart' && (
                <div>
                  <Label htmlFor="svgPath">SVG Path (for custom shapes)</Label>
                  <Textarea
                    id="svgPath"
                    {...form.register('svgPath')}
                    placeholder="M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5..."
                    rows={3}
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={form.watch('isActive')}
                    onCheckedChange={(checked) => form.setValue('isActive', checked)}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={form.watch('isDefault')}
                    onCheckedChange={(checked) => form.setValue('isDefault', checked)}
                  />
                  <Label>Default</Label>
                </div>
                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    {...form.register('sortOrder', { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label>Shape Preview</Label>
                <div className="flex items-center justify-center p-4 border rounded-lg bg-gray-50">
                  <ShapePreview shape={form.watch('shape')} />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingConfig ? 'Update Configuration' : 'Create Configuration'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingConfig(null);
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
          <CardTitle>Crop Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading configurations...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Shape</TableHead>
                  <TableHead>Aspect Ratio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Allowed For</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => {
                  const IconComponent = shapeIcons[config.shape as keyof typeof shapeIcons];
                  return (
                    <TableRow key={config.id}>
                      <TableCell>
                        <ShapePreview shape={config.shape} className="w-8 h-8" />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{config.name}</p>
                          {config.description && (
                            <p className="text-sm text-gray-500">{config.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-4 w-4" />
                          <span className="capitalize">{config.shape.replace('-', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>{config.aspectRatio}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Badge variant={config.isActive ? "default" : "secondary"}>
                            {config.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {config.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {config.allowedFor?.map((item) => (
                            <Badge key={item} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(config)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(config.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {configs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      No crop configurations found. Create your first one!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}