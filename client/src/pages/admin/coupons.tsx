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
import { Plus, Edit, Trash2, Percent, Calendar, Target } from 'lucide-react';
import { PromoCode } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';

const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.string().min(1, 'Discount value is required'),
  minOrderValue: z.string().default('0'),
  maxDiscount: z.string().optional(),
  usageLimit: z.number().optional(),
  isActive: z.boolean().default(true),
  validFrom: z.date().default(() => new Date()),
  validUntil: z.date().optional(),
});

type CouponForm = z.infer<typeof couponSchema>;

export default function AdminCoupons() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<PromoCode | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: coupons = [], isLoading } = useQuery<PromoCode[]>({
    queryKey: ['/api/admin/promo-codes'],
  });

  const form = useForm<CouponForm>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderValue: '0',
      maxDiscount: '',
      usageLimit: undefined,
      isActive: true,
      validFrom: new Date(),
      validUntil: undefined,
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: CouponForm) => {
      const formattedData = {
        ...data,
        validFrom: data.validFrom.toISOString(),
        validUntil: data.validUntil?.toISOString(),
      };
      const response = await apiRequest('POST', '/api/admin/promo-codes', formattedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promo-codes'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({ title: "Coupon created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create coupon", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PromoCode> }) => {
      const response = await apiRequest('PUT', `/api/admin/promo-codes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promo-codes'] });
      setEditingCoupon(null);
      toast({ title: "Coupon updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update coupon", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/promo-codes/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promo-codes'] });
      toast({ title: "Coupon deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete coupon", variant: "destructive" });
    }
  });

  const onSubmit = (data: CouponForm) => {
    if (editingCoupon) {
      updateMutation.mutate({ 
        id: editingCoupon.id, 
        data: {
          ...data,
          validFrom: data.validFrom.toISOString(),
          validUntil: data.validUntil?.toISOString(),
        }
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (coupon: PromoCode) => {
    setEditingCoupon(coupon);
    form.reset({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType as 'percentage' | 'fixed',
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue || '0',
      maxDiscount: coupon.maxDiscount || '',
      usageLimit: coupon.usageLimit || undefined,
      isActive: coupon.isActive || true,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom) : new Date(),
      validUntil: coupon.validUntil ? new Date(coupon.validUntil) : undefined,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleActive = (coupon: PromoCode) => {
    updateMutation.mutate({
      id: coupon.id,
      data: { ...coupon, isActive: !coupon.isActive }
    });
  };

  const activeCoupons = coupons.filter(c => c.isActive).length;
  const expiredCoupons = coupons.filter(c => 
    c.validUntil && new Date(c.validUntil) < new Date()
  ).length;
  const totalUsage = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Coupons & Promo Codes</h1>
          <p className="text-charcoal opacity-70">Manage discount codes and promotions</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-caramel hover:bg-brown">
              <Plus className="mr-2 h-4 w-4" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Coupon Code</Label>
                  <Input
                    id="code"
                    {...form.register('code')}
                    placeholder="SAVE20"
                    className="uppercase"
                  />
                  {form.formState.errors.code && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.code.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select onValueChange={(value) => form.setValue('discountType', value as 'percentage' | 'fixed')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="20% off on all cakes"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discountValue">
                    Discount Value {form.watch('discountType') === 'percentage' ? '(%)' : '(₹)'}
                  </Label>
                  <Input
                    id="discountValue"
                    {...form.register('discountValue')}
                    placeholder={form.watch('discountType') === 'percentage' ? '20' : '100'}
                    type="number"
                  />
                </div>

                <div>
                  <Label htmlFor="minOrderValue">Minimum Order Value (₹)</Label>
                  <Input
                    id="minOrderValue"
                    {...form.register('minOrderValue')}
                    placeholder="500"
                    type="number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxDiscount">Maximum Discount (₹)</Label>
                  <Input
                    id="maxDiscount"
                    {...form.register('maxDiscount')}
                    placeholder="200"
                    type="number"
                  />
                </div>

                <div>
                  <Label htmlFor="usageLimit">Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    {...form.register('usageLimit', { valueAsNumber: true })}
                    placeholder="100"
                    type="number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validFrom">Valid From</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    {...form.register('validFrom', { valueAsDate: true })}
                  />
                </div>

                <div>
                  <Label htmlFor="validUntil">Valid Until (Optional)</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    {...form.register('validUntil', { valueAsDate: true })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={form.watch('isActive')}
                  onCheckedChange={(checked) => form.setValue('isActive', checked)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-caramel hover:bg-brown"
                >
                  {editingCoupon ? 'Update' : 'Create'} Coupon
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingCoupon(null);
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
            <Percent className="h-4 w-4 text-caramel" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">{coupons.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCoupons}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Coupons</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredCoupons}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Target className="h-4 w-4 text-mint" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-mint">{totalUsage}</div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Percent className="mr-2 h-5 w-5" />
            All Coupons ({coupons.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading coupons...</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-charcoal opacity-60">No coupons found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => {
                  const isExpired = coupon.validUntil && new Date(coupon.validUntil) < new Date();
                  const usagePercent = coupon.usageLimit 
                    ? ((coupon.usedCount || 0) / coupon.usageLimit) * 100 
                    : 0;
                  
                  return (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div className="font-mono font-bold text-caramel">{coupon.code}</div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">{coupon.description || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">
                            {coupon.discountType === 'percentage' 
                              ? `${coupon.discountValue}%` 
                              : formatPrice(coupon.discountValue)
                            }
                          </span>
                          {coupon.minOrderValue && parseFloat(coupon.minOrderValue) > 0 && (
                            <div className="text-xs text-charcoal opacity-60">
                              Min: {formatPrice(coupon.minOrderValue)}
                            </div>
                          )}
                          {coupon.maxDiscount && (
                            <div className="text-xs text-charcoal opacity-60">
                              Max: {formatPrice(coupon.maxDiscount)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{coupon.usedCount || 0}</span>
                          {coupon.usageLimit && (
                            <>
                              <span className="text-charcoal opacity-60"> / {coupon.usageLimit}</span>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div 
                                  className="bg-caramel h-1.5 rounded-full" 
                                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                ></div>
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>From: {new Date(coupon.validFrom || '').toLocaleDateString()}</div>
                          {coupon.validUntil && (
                            <div className={isExpired ? 'text-red-500' : ''}>
                              Until: {new Date(coupon.validUntil).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={coupon.isActive && !isExpired || false}
                            onCheckedChange={() => toggleActive(coupon)}
                            disabled={updateMutation.isPending || isExpired}
                          />
                          <Badge 
                            variant={coupon.isActive && !isExpired ? "default" : "secondary"}
                            className={isExpired ? 'bg-red-100 text-red-800' : ''}
                          >
                            {isExpired ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(coupon)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(coupon.id)}
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