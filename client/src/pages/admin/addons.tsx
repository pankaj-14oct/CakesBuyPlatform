import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Package, Image, Check } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

const addonFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  price: z.string().min(1, "Price is required"),
  image: z.string().optional(),
});

type AddonForm = z.infer<typeof addonFormSchema>;

interface Addon {
  id: number;
  name: string;
  description: string | null;
  price: string;
  category: string | null;
  image: string | null;
  isAvailable: boolean | null;
}

export default function AdminAddons() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [isEditMediaDialogOpen, setIsEditMediaDialogOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const { toast } = useToast();

  const { data: addons = [], isLoading } = useQuery<Addon[]>({
    queryKey: ["/api/addons"],
  });

  const { data: mediaFiles = [] } = useQuery<MediaFile[]>({
    queryKey: ["/api/admin/media"],
  });

  const createAddonMutation = useMutation({
    mutationFn: async (data: AddonForm) => {
      const addonData = {
        ...data,
        price: parseFloat(data.price),
      };
      return apiRequest('/api/admin/addons', 'POST', addonData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addons"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Addon created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create addon",
        variant: "destructive",
      });
    },
  });

  const updateAddonMutation = useMutation({
    mutationFn: async (data: AddonForm & { id: number }) => {
      const addonData = {
        name: data.name,
        description: data.description,
        category: data.category,
        price: parseFloat(data.price),
      };
      return apiRequest(`/api/admin/addons/${data.id}`, 'PUT', addonData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addons"] });
      setEditingAddon(null);
      toast({
        title: "Success",
        description: "Addon updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update addon",
        variant: "destructive",
      });
    },
  });

  const deleteAddonMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/addons/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addons"] });
      toast({
        title: "Success",
        description: "Addon deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete addon",
        variant: "destructive",
      });
    },
  });

  const form = useForm<AddonForm>({
    resolver: zodResolver(addonFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      price: "",
      image: "",
    },
  });

  const editForm = useForm<AddonForm>({
    resolver: zodResolver(addonFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      price: "",
      image: "",
    },
  });

  const onCreateSubmit = (data: AddonForm) => {
    createAddonMutation.mutate(data);
  };

  const onEditSubmit = (data: AddonForm) => {
    if (editingAddon) {
      updateAddonMutation.mutate({ ...data, id: editingAddon.id });
    }
  };

  const handleEdit = (addon: Addon) => {
    setEditingAddon(addon);
    editForm.reset({
      name: addon.name,
      description: addon.description || "",
      category: addon.category || "",
      price: addon.price.toString(),
      image: addon.image || "",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this addon?")) {
      deleteAddonMutation.mutate(id);
    }
  };

  const handleImageSelect = (url: string, isEdit = false) => {
    if (isEdit) {
      editForm.setValue('image', url);
      setIsEditMediaDialogOpen(false);
    } else {
      form.setValue('image', url);
      setIsMediaDialogOpen(false);
    }
    setSelectedImageUrl(url);
  };

  const MediaPickerDialog = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    currentValue 
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSelect: (url: string) => void;
    currentValue?: string;
  }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Image</DialogTitle>
          <DialogDescription>
            Choose an image from your media library or upload a new one.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-4 gap-4">
          {mediaFiles.map((file) => (
            <div 
              key={file.id} 
              className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden ${
                currentValue === file.url ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelect(file.url)}
            >
              <div className="aspect-square">
                <img
                  src={file.url}
                  alt={file.originalName}
                  className="w-full h-full object-cover"
                />
              </div>
              {currentValue === file.url && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                  <Check className="h-6 w-6 text-blue-600" />
                </div>
              )}
              <div className="p-2">
                <p className="text-xs truncate" title={file.originalName}>
                  {file.originalName}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {mediaFiles.length === 0 && (
          <div className="text-center py-8">
            <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No media files found. Upload some images first.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  const resetCreateForm = () => {
    form.reset({
      name: "",
      description: "",
      category: "",
      price: "",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Addons Management</h1>
        </div>
        <div className="text-center py-8">Loading addons...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Addons Management</h1>
          <p className="text-gray-600">Manage cake addons and extras</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetCreateForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Addon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Addon</DialogTitle>
              <DialogDescription>
                Add a new addon that customers can purchase with their cakes.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Birthday Candles" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Pack of 10 colorful birthday candles"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="candles">Candles</SelectItem>
                          <SelectItem value="cards">Cards</SelectItem>
                          <SelectItem value="flowers">Flowers</SelectItem>
                          <SelectItem value="chocolates">Chocolates</SelectItem>
                          <SelectItem value="decorations">Decorations</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="50.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image</FormLabel>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <FormControl>
                            <Input 
                              type="url" 
                              placeholder="Enter image URL or select from media..." 
                              {...field} 
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsMediaDialogOpen(true)}
                          >
                            <Image className="h-4 w-4 mr-2" />
                            Browse Media
                          </Button>
                        </div>
                        {field.value && (
                          <div className="w-20 h-20 border rounded overflow-hidden">
                            <img 
                              src={field.value} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createAddonMutation.isPending}
                  >
                    {createAddonMutation.isPending ? "Creating..." : "Create Addon"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Addons</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{addons.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {addons.filter(addon => addon.category === 'candles').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cards</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {addons.filter(addon => addon.category === 'cards').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flowers</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {addons.filter(addon => addon.category === 'flowers').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Addons Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Addons</CardTitle>
          <CardDescription>
            Manage your addon inventory and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {addons.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No addons found</h3>
              <p className="text-gray-500 mb-4">Create your first addon to get started.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Addon
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addons.map((addon) => (
                  <TableRow key={addon.id}>
                    <TableCell className="font-medium">{addon.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {addon.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {addon.description || "No description"}
                    </TableCell>
                    <TableCell>{formatPrice(addon.price)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(addon)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(addon.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingAddon} onOpenChange={() => setEditingAddon(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Addon</DialogTitle>
            <DialogDescription>
              Update addon information and pricing.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Birthday Candles" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Pack of 10 colorful birthday candles"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="candles">Candles</SelectItem>
                        <SelectItem value="cards">Cards</SelectItem>
                        <SelectItem value="flowers">Flowers</SelectItem>
                        <SelectItem value="chocolates">Chocolates</SelectItem>
                        <SelectItem value="decorations">Decorations</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="50.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder="Enter image URL or select from media..." 
                            {...field} 
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditMediaDialogOpen(true)}
                        >
                          <Image className="h-4 w-4 mr-2" />
                          Browse Media
                        </Button>
                      </div>
                      {field.value && (
                        <div className="w-20 h-20 border rounded overflow-hidden">
                          <img 
                            src={field.value} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingAddon(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateAddonMutation.isPending}
                >
                  {updateAddonMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Media Picker Dialogs */}
      <MediaPickerDialog
        isOpen={isMediaDialogOpen}
        onClose={() => setIsMediaDialogOpen(false)}
        onSelect={(url) => handleImageSelect(url, false)}
        currentValue={form.watch('image')}
      />
      
      <MediaPickerDialog
        isOpen={isEditMediaDialogOpen}
        onClose={() => setIsEditMediaDialogOpen(false)}
        onSelect={(url) => handleImageSelect(url, true)}
        currentValue={editForm.watch('image')}
      />
    </div>
  );
}