import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Gift, Heart, Plus, Trash2, Bell, Star, Clock, Tag, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const reminderSchema = z.object({
  eventType: z.enum(["birthday", "anniversary", "christmas", "newyear", "valentine", "womensday", "mothersday", "fathersday"]),
  relationshipType: z.string().min(1, "Please select who this reminder is for"),
  day: z.string().min(1, "Day is required"),
  month: z.string().min(1, "Month is required"),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface EventReminder {
  id: number;
  eventType: "birthday" | "anniversary" | "christmas" | "newyear" | "valentine" | "womensday" | "mothersday" | "fathersday";
  eventDate: string;
  relationshipType: string;
  createdAt: string;
}

export default function OccasionReminder() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      eventType: "birthday",
      relationshipType: "",
      day: "",
      month: "",
    },
  });

  // Fetch user's reminders
  const { data: reminders = [], isLoading } = useQuery<EventReminder[]>({
    queryKey: ["/api/reminders"],
    enabled: !!user,
  });

  // Create reminder mutation
  const createReminderMutation = useMutation({
    mutationFn: async (data: ReminderFormData) => {
      // Convert to the format expected by the API
      const eventDate = `${data.month.padStart(2, '0')}-${data.day.padStart(2, '0')}`;
      
      // Calculate reminder date (7 days before the event)
      const currentYear = new Date().getFullYear();
      const [month, day] = [data.month, data.day];
      const eventDateThisYear = new Date(currentYear, parseInt(month) - 1, parseInt(day));
      const reminderDate = new Date(eventDateThisYear);
      reminderDate.setDate(reminderDate.getDate() - 7);
      
      // If the reminder date has passed this year, set for next year
      if (reminderDate < new Date()) {
        eventDateThisYear.setFullYear(currentYear + 1);
        reminderDate.setFullYear(currentYear + 1);
      }
      
      const apiData = {
        eventType: data.eventType,
        eventDate: eventDate,
        reminderDate: reminderDate,
      };
      
      // Convert Date object to string before sending
      const requestData = {
        ...apiData,
        reminderDate: reminderDate.toISOString()
      };
      
      const res = await apiRequest("/api/reminders", "POST", requestData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reminder Added!",
        description: "We'll notify you with exclusive offers for this special occasion.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete reminder mutation
  const deleteReminderMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/reminders/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Reminder Deleted",
        description: "The occasion reminder has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ReminderFormData) => {
    createReminderMutation.mutate(values);
  };

  const handleDeleteReminder = (id: number) => {
    deleteReminderMutation.mutate(id);
  };

  const formatDate = (dateStr: string) => {
    const [month, day] = dateStr.split('-');
    const date = new Date(2024, parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-800">Login Required</CardTitle>
            <CardDescription>
              Please login to manage your occasion reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                Login / Register
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-center text-red-600 mb-2">
            Occasion Reminder
          </h1>
          <p className="text-center text-gray-600 text-lg">
            Save special days to unlock <span className="font-semibold underline">Exclusive Offers!</span>
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section with Calendar Illustration */}
        <div className="text-center mb-12">
          <div className="mb-8">
            <Calendar className="h-24 w-24 text-red-500 mx-auto mb-4" />
          </div>
        </div>

        {/* How It Works */}
        <Card className="mb-8 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              How It Works?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center flex-1">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Save 3 Occasions</h3>
                <p className="text-gray-600">Add birthdays, anniversaries & more</p>
              </div>
              
              <div className="hidden md:block">
                <div className="w-20 h-0.5 bg-green-500"></div>
              </div>
              
              <div className="text-center flex-1">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Get Offers</h3>
                <p className="text-gray-600">Worth <span className="font-bold text-red-600">₹750</span></p>
              </div>
              
              <div className="hidden md:block">
                <div className="w-20 h-0.5 bg-green-500"></div>
              </div>
              
              <div className="text-center flex-1">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Redeem for</h3>
                <p className="text-gray-600">Future Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Exclusive Offers */}
        <Card className="mb-8 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              Available Exclusive Offers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <Gift className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Birthday</h3>
                <p className="text-gray-600">Special birthday discounts & free delivery</p>
              </div>
              
              <div className="text-center p-6 bg-pink-50 rounded-lg">
                <Heart className="h-12 w-12 text-pink-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Anniversary</h3>
                <p className="text-gray-600">Romantic cake offers & couple deals</p>
              </div>
              
              <div className="text-center p-6 bg-yellow-50 rounded-lg">
                <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">& Many More</h3>
                <p className="text-gray-600">Seasonal offers & festival specials</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <Card className="mb-8 bg-gradient-to-r from-orange-100 to-red-100 border-none">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Hey! You can save...
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <Gift className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Birthday</h3>
              </div>
              
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <Heart className="h-12 w-12 text-pink-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Anniversary</h3>
              </div>
              
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <Calendar className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">& Many More</h3>
              </div>
            </div>
            
            <p className="text-center text-gray-700 text-lg mb-6">
              Discover ideal desserts & cakes, perfectly suited for your upcoming special occasion!
            </p>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <Bell className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-gray-700 font-medium">Never forget loved one's special days</p>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Discover ideal desserts & cakes, perfectly suited for your upcoming special occasion!
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-pink-100 rounded-lg">
                  <Heart className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Never forget loved one's special days
                  </h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Timely reminders before celebrations
                  </h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Bell className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Save as many reminders as you want
                  </h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Tag className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Use offers for future purchases anytime
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-sm border">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
              FAQ's about EgglessCakes App
            </h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What are EgglessCakes occasion reminders?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Occasion reminders are a feature that helps you save important dates like birthdays and anniversaries. We'll send you notifications before these special occasions with exclusive offers and discounts.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How do EgglessCakes occasion reminders work?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Simply save the special dates you want to remember. We'll send you email reminders one week before each occasion with exclusive discount codes and cake recommendations perfect for celebrating.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What types of occasions can I set reminders for?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  You can set reminders for birthdays, anniversaries, and other special celebrations. Each reminder can be customized with a personal title to help you remember whose special day it is.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How do I save occasion reminders?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Click the "Add New Reminder" button, enter a reminder title (like "Mom's Birthday"), select the event type, and choose the date and month. Your reminder will be saved and you'll receive notifications before the special day.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How many occasion reminders I can save?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  You can save as many reminders as you want! There's no limit on the number of special occasions you can track with our reminder system.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-6">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How many reminders do I need to save to claim an offer?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Save 3 reminders to unlock exclusive offers worth ₹750! Once you have 3 or more reminders saved, you'll be eligible for special discounts and promotional codes.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-7">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How can I redeem the offers?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  You'll receive discount codes via email when we send reminder notifications. Use these codes during checkout to get special pricing on your cake orders.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-8">
                <AccordionTrigger className="text-left text-lg font-medium">
                  Can I place orders directly from the saved occasion reminder feature?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  While you can't place orders directly from reminders, you'll receive email notifications with cake recommendations and links to easily browse and order perfect cakes for each occasion.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-9">
                <AccordionTrigger className="text-left text-lg font-medium">
                  Is there an expiration date on occasion reminder offers?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Yes, promotional codes typically have validity periods. Check the specific terms in your reminder emails for exact expiration dates and usage conditions.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Current Reminders */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Occasion Reminders</CardTitle>
              <CardDescription>
                Manage your saved special dates and get notified with exclusive offers
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Reminder
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Reminder</DialogTitle>
                  <DialogDescription>
                    Save 3 reminders for exclusive <span className="font-bold text-red-600">₹750</span> offer
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-4">
                    <FormField
                      control={form.control}
                      name="eventType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-charcoal">Select Your Special Day</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 text-base">
                                <SelectValue placeholder="Select occasion" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="birthday">Birthday</SelectItem>
                              <SelectItem value="anniversary">Anniversary</SelectItem>
                              <SelectItem value="christmas">Christmas</SelectItem>
                              <SelectItem value="newyear">New Year</SelectItem>
                              <SelectItem value="valentine">Valentine Day</SelectItem>
                              <SelectItem value="womensday">Women's Day</SelectItem>
                              <SelectItem value="mothersday">Mother's Day</SelectItem>
                              <SelectItem value="fathersday">Father's Day</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="relationshipType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-charcoal">Select For</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 text-base">
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="son">Son</SelectItem>
                              <SelectItem value="father">Father</SelectItem>
                              <SelectItem value="sister">Sister</SelectItem>
                              <SelectItem value="daughter">Daughter</SelectItem>
                              <SelectItem value="mother">Mother</SelectItem>
                              <SelectItem value="boyfriend">Boyfriend</SelectItem>
                              <SelectItem value="girlfriend">Girlfriend</SelectItem>
                              <SelectItem value="husband">Husband</SelectItem>
                              <SelectItem value="wife">Wife</SelectItem>
                              <SelectItem value="brother">Brother</SelectItem>
                              <SelectItem value="friend">Friend</SelectItem>
                              <SelectItem value="myself">Myself</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <FormLabel className="text-sm font-medium">Alert Date</FormLabel>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <FormField
                          control={form.control}
                          name="day"
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Date" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                    <SelectItem key={day} value={day.toString()}>
                                      {day}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="month"
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Month" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {[
                                    { value: "1", label: "January" },
                                    { value: "2", label: "February" },
                                    { value: "3", label: "March" },
                                    { value: "4", label: "April" },
                                    { value: "5", label: "May" },
                                    { value: "6", label: "June" },
                                    { value: "7", label: "July" },
                                    { value: "8", label: "August" },
                                    { value: "9", label: "September" },
                                    { value: "10", label: "October" },
                                    { value: "11", label: "November" },
                                    { value: "12", label: "December" },
                                  ].map((month) => (
                                    <SelectItem key={month.value} value={month.value}>
                                      {month.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <Button 
                        type="submit" 
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-4 text-lg font-semibold rounded-lg"
                        disabled={createReminderMutation.isPending}
                      >
                        {createReminderMutation.isPending ? "Saving..." : "Save Reminder"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-gray-500">Loading reminders...</p>
            ) : reminders.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No occasion reminders yet</p>
                <p className="text-sm text-gray-400">
                  Add your first reminder to start receiving exclusive offers!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reminders.map((reminder: EventReminder) => (
                  <Card key={reminder.id} className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {reminder.eventType === 'birthday' ? (
                              <Gift className="h-5 w-5 text-blue-500" />
                            ) : (
                              <Heart className="h-5 w-5 text-pink-500" />
                            )}
                            <span className="font-medium capitalize">{reminder.eventType}</span>
                          </div>
                          <h3 className="font-semibold text-lg capitalize">{reminder.relationshipType}'s {reminder.eventType}</h3>
                          <p className="text-gray-600">{formatDate(reminder.eventDate)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-lg text-gray-700 mb-4">
            Start saving <span className="font-bold text-red-600">OCCASIONS NOW!</span>
          </p>
          {reminders.length === 0 && (
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-3"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Reminder
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}