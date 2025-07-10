import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderRatingSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, ThumbsUp, ThumbsDown, Package, Truck, Award, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

type RatingFormData = z.infer<typeof orderRatingSchema>;

const StarRating = ({ value, onChange, label, disabled = false }: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
}) => {
  const [hoveredStar, setHoveredStar] = useState(0);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            className={cn(
              "w-8 h-8 transition-colors",
              disabled && "cursor-not-allowed"
            )}
            onMouseEnter={() => !disabled && setHoveredStar(star)}
            onMouseLeave={() => !disabled && setHoveredStar(0)}
            onClick={() => !disabled && onChange(star)}
          >
            <Star 
              className={cn(
                "w-6 h-6",
                (hoveredStar >= star || value >= star) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {value > 0 ? `${value}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  );
};

export default function RateOrder() {
  const { orderId } = useParams();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: orderData, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['order-rating', orderId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/rating`);
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      return response.json();
    },
    enabled: !!orderId
  });

  const form = useForm<RatingFormData>({
    resolver: zodResolver(orderRatingSchema),
    defaultValues: {
      orderId: parseInt(orderId || '0'),
      overallRating: 0,
      tasteRating: 0,
      qualityRating: 0,
      deliveryRating: 0,
      packagingRating: 0,
      comment: '',
      improvements: '',
      wouldRecommend: true,
      deliveryBoyRating: 0,
      deliveryBoyComment: ''
    }
  });

  // Update form when order data is loaded
  useEffect(() => {
    if (orderData?.rating) {
      const rating = orderData.rating;
      form.reset({
        orderId: parseInt(orderId || '0'),
        overallRating: rating.overallRating || 0,
        tasteRating: rating.tasteRating || 0,
        qualityRating: rating.qualityRating || 0,
        deliveryRating: rating.deliveryRating || 0,
        packagingRating: rating.packagingRating || 0,
        comment: rating.comment || '',
        improvements: rating.improvements || '',
        wouldRecommend: rating.wouldRecommend ?? true,
        deliveryBoyRating: rating.deliveryBoyRating || 0,
        deliveryBoyComment: rating.deliveryBoyComment || ''
      });
      
      if (rating.overallRating > 0) {
        setIsSubmitted(true);
      }
    }
  }, [orderData, form, orderId]);

  const submitRating = useMutation({
    mutationFn: async (data: RatingFormData) => {
      const response = await fetch(`/api/orders/${orderId}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Thank you for your feedback!",
        description: "Your rating has been submitted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RatingFormData) => {
    if (data.overallRating === 0) {
      toast({
        title: "Overall rating required",
        description: "Please provide an overall rating to submit your feedback.",
        variant: "destructive",
      });
      return;
    }
    
    submitRating.mutate(data);
  };

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-caramel mx-auto"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Order Not Found</CardTitle>
            <CardDescription>
              The order you're looking for doesn't exist or cannot be rated.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { order } = orderData;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rate Your Experience</h1>
          <p className="text-gray-600">Help us improve by sharing your feedback</p>
        </div>

        {/* Order Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-semibold">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-semibold">₹{Number(order.total).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Delivery Date</p>
                <p className="font-semibold">
                  {new Date(order.deliveryDate).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {order.status}
                </Badge>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Items Ordered</p>
              <div className="space-y-2">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{item.name} ({item.weight})</span>
                    <span className="text-sm font-semibold">₹{Number(item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        {isSubmitted && (
          <Card className="mb-8 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-green-700">
                <ThumbsUp className="w-5 h-5" />
                <div>
                  <h3 className="font-semibold">Thank you for your feedback!</h3>
                  <p className="text-sm">Your rating has been submitted successfully. You can update it anytime.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rating Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Rate Your Experience
            </CardTitle>
            <CardDescription>
              Your feedback helps us improve our service and helps other customers make informed decisions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Overall Rating */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Overall Experience</h3>
                  <FormField
                    control={form.control}
                    name="overallRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <StarRating
                            value={field.value}
                            onChange={field.onChange}
                            label="Overall Rating *"
                            disabled={submitRating.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Detailed Ratings */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Detailed Ratings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="tasteRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <StarRating
                              value={field.value || 0}
                              onChange={field.onChange}
                              label="Taste & Flavor"
                              disabled={submitRating.isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="qualityRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <StarRating
                              value={field.value || 0}
                              onChange={field.onChange}
                              label="Quality & Freshness"
                              disabled={submitRating.isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="deliveryRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <StarRating
                              value={field.value || 0}
                              onChange={field.onChange}
                              label="Delivery Experience"
                              disabled={submitRating.isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="packagingRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <StarRating
                              value={field.value || 0}
                              onChange={field.onChange}
                              label="Packaging"
                              disabled={submitRating.isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Comments */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Feedback</h3>
                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tell us about your experience</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What did you love about your order? How was the taste, quality, and overall experience?"
                            className="min-h-24"
                            disabled={submitRating.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Share your thoughts to help other customers and help us improve.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="improvements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How can we improve?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any suggestions for improvement? What could we do better next time?"
                            className="min-h-20"
                            disabled={submitRating.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Your suggestions help us serve you better.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Delivery Boy Rating */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Delivery Experience
                  </h3>
                  <FormField
                    control={form.control}
                    name="deliveryBoyRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <StarRating
                            value={field.value || 0}
                            onChange={field.onChange}
                            label="Delivery Partner Rating"
                            disabled={submitRating.isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="deliveryBoyComment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery feedback</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="How was your delivery experience? Was the delivery partner professional and courteous?"
                            className="min-h-20"
                            disabled={submitRating.isPending}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Recommendation */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Would you recommend us?</h3>
                  <FormField
                    control={form.control}
                    name="wouldRecommend"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-4">
                            <Button
                              type="button"
                              variant={field.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => field.onChange(true)}
                              disabled={submitRating.isPending}
                              className="flex items-center gap-2"
                            >
                              <ThumbsUp className="w-4 h-4" />
                              Yes, I'd recommend
                            </Button>
                            <Button
                              type="button"
                              variant={!field.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => field.onChange(false)}
                              disabled={submitRating.isPending}
                              className="flex items-center gap-2"
                            >
                              <ThumbsDown className="w-4 h-4" />
                              No, I wouldn't
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-6">
                  <Button
                    type="submit"
                    disabled={submitRating.isPending}
                    className="w-full max-w-md"
                    size="lg"
                  >
                    {submitRating.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        {isSubmitted ? 'Update Rating' : 'Submit Rating'}
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}