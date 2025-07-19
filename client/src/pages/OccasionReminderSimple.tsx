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
import { Calendar, Plus, Trash2, Edit, CalendarIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

const reminderSchema = z.object({
  reminderTitle: z.string().min(1, "Reminder title is required"),
  alertDate: z.string().min(1, "Alert date is required"),
  eventType: z.enum(["birthday", "anniversary", "christmas", "newyear", "valentine", "womensday", "mothersday", "fathersday"]),
  relationshipType: z.string().min(1, "Please select who this reminder is for"),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface EventReminder {
  id: number;
  eventType: "birthday" | "anniversary" | "christmas" | "newyear" | "valentine" | "womensday" | "mothersday" | "fathersday";
  eventDate: string;
  relationshipType: string;
  title?: string;
  createdAt: string;
}

export default function OccasionReminderSimple() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<EventReminder | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      reminderTitle: "",
      alertDate: "",
      eventType: "birthday",
      relationshipType: "",
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
      const alertDate = new Date(data.alertDate);
      
      // Convert to MM-DD format
      const month = String(alertDate.getMonth() + 1).padStart(2, '0');
      const day = String(alertDate.getDate()).padStart(2, '0');
      const eventDateStr = `${month}-${day}`;
      
      // Calculate reminder date (7 days before the event)
      const reminderDate = new Date(alertDate);
      reminderDate.setDate(reminderDate.getDate() - 7);
      
      // If the reminder date has passed this year, set for next year
      if (reminderDate < new Date()) {
        alertDate.setFullYear(alertDate.getFullYear() + 1);
        reminderDate.setFullYear(reminderDate.getFullYear() + 1);
      }
      
      const requestData = {
        eventType: data.eventType,
        eventDate: eventDateStr,
        relationshipType: data.relationshipType,
        title: data.reminderTitle,
        reminderDate: reminderDate.toISOString(),
      };
      
      const res = await apiRequest("/api/reminders", "POST", requestData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reminder Added!",
        description: "Your occasion reminder has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      setIsDialogOpen(false);
      form.reset({
        reminderTitle: "",
        alertDate: "",
        eventType: "birthday",
        relationshipType: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update reminder mutation
  const updateReminderMutation = useMutation({
    mutationFn: async (data: ReminderFormData & { id: number }) => {
      const alertDate = new Date(data.alertDate);
      
      // Convert to MM-DD format
      const month = String(alertDate.getMonth() + 1).padStart(2, '0');
      const day = String(alertDate.getDate()).padStart(2, '0');
      const eventDateStr = `${month}-${day}`;
      
      // Calculate reminder date (7 days before the event)
      const reminderDate = new Date(alertDate);
      reminderDate.setDate(reminderDate.getDate() - 7);
      
      // If the reminder date has passed this year, set for next year
      if (reminderDate < new Date()) {
        alertDate.setFullYear(alertDate.getFullYear() + 1);
        reminderDate.setFullYear(reminderDate.getFullYear() + 1);
      }
      
      const requestData = {
        eventType: data.eventType,
        eventDate: eventDateStr,
        relationshipType: data.relationshipType,
        title: data.reminderTitle,
        reminderDate: reminderDate.toISOString(),
      };
      
      const res = await apiRequest(`/api/reminders/${data.id}`, "PUT", requestData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reminder Updated!",
        description: "Your occasion reminder has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      setIsDialogOpen(false);
      form.reset({
        reminderTitle: "",
        alertDate: "",
        eventType: "birthday",
        relationshipType: "",
      });
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
    if (editingReminder) {
      updateReminderMutation.mutate({ ...values, id: editingReminder.id });
    } else {
      createReminderMutation.mutate(values);
    }
  };

  const handleDeleteReminder = (id: number) => {
    deleteReminderMutation.mutate(id);
  };

  const handleEditReminder = (reminder: EventReminder) => {
    setEditingReminder(reminder);
    
    // Convert MM-DD to YYYY-MM-DD for date input
    let alertDateForInput = reminder.eventDate;
    const parts = reminder.eventDate.split('-');
    
    if (parts.length === 2) {
      // MM-DD format, convert to current year YYYY-MM-DD
      const currentYear = new Date().getFullYear();
      alertDateForInput = `${currentYear}-${parts[0]}-${parts[1]}`;
    }
    
    // Debug log to check reminder data
    console.log('Editing reminder:', reminder);
    
    form.reset({
      reminderTitle: reminder.title || `${reminder.relationshipType}'s ${reminder.eventType}`, // Better fallback format
      alertDate: alertDateForInput,
      eventType: reminder.eventType,
      relationshipType: reminder.relationshipType,
    });
    
    // Force form update
    setTimeout(() => {
      form.setValue('reminderTitle', reminder.title || `${reminder.relationshipType}'s ${reminder.eventType}`);
    }, 100);
    
    setIsDialogOpen(true);
  };

  const handleCloseDialog = (isOpen: boolean) => {
    setIsDialogOpen(isOpen);
    if (!isOpen) {
      setEditingReminder(null);
      form.reset({
        reminderTitle: "",
        alertDate: "",
        eventType: "birthday",
        relationshipType: "",
      });
    }
  };

  const handleAddNewReminder = () => {
    setEditingReminder(null);
    form.reset({
      reminderTitle: "",
      alertDate: "",
      eventType: "birthday",
      relationshipType: "",
    });
    setIsDialogOpen(true);
  };

  const formatDate = (dateStr: string) => {
    // Handle both YYYY-MM-DD and MM-DD formats
    const parts = dateStr.split('-');
    let month: number, day: number;
    
    if (parts.length === 3) {
      // YYYY-MM-DD format
      month = parseInt(parts[1]);
      day = parseInt(parts[2]);
    } else {
      // MM-DD format
      month = parseInt(parts[0]);
      day = parseInt(parts[1]);
    }
    
    const date = new Date(2024, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  // Sort reminders by nearest upcoming date
  const sortedReminders = [...reminders].sort((a, b) => {
    const getDateForSorting = (dateStr: string) => {
      const parts = dateStr.split('-');
      let month: number, day: number;
      
      if (parts.length === 3) {
        // YYYY-MM-DD format
        month = parseInt(parts[1]);
        day = parseInt(parts[2]);
      } else {
        // MM-DD format
        month = parseInt(parts[0]);
        day = parseInt(parts[1]);
      }
      
      const currentYear = new Date().getFullYear();
      const today = new Date();
      const eventDate = new Date(currentYear, month - 1, day);
      
      // If the date has passed this year, use next year
      if (eventDate < today) {
        eventDate.setFullYear(currentYear + 1);
      }
      
      return eventDate;
    };
    
    return getDateForSorting(a.eventDate).getTime() - getDateForSorting(b.eventDate).getTime();
  });

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
        {/* Current Reminders */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Occasion Reminders</CardTitle>
              <CardDescription>
                Manage your saved special dates and get notified with exclusive offers (sorted by nearest date)
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNewReminder} className="bg-red-600 hover:bg-red-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Reminder
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingReminder ? 'Edit Reminder' : 'Add Reminder'}</DialogTitle>
                  <DialogDescription>
                    {editingReminder ? 'Update your occasion reminder details' : 'Save 3 reminders for exclusive'} <span className="font-bold text-red-600">₹750</span> offer
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-4">
                    {/* Reminder Title */}
                    <FormField
                      control={form.control}
                      name="reminderTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-charcoal">
                            Reminder Title <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter reminder title (e.g., Mom's Birthday, daughter's bday)"
                              className="h-12 text-base"
                              disabled={createReminderMutation.isPending || updateReminderMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Alert Date */}
                    <FormField
                      control={form.control}
                      name="alertDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-charcoal">
                            Alert Date <span className="text-red-500">*</span>
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                className="h-12 text-base pl-12"
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </FormControl>
                            <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Select Your Special Day */}
                    <FormField
                      control={form.control}
                      name="eventType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-charcoal">Select Your Special Day</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 text-base border-2 border-blue-300 focus:border-blue-500">
                                <SelectValue placeholder="Select special day" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-60 overflow-y-auto">
                              <SelectItem value="birthday">Birthday</SelectItem>
                              <SelectItem value="anniversary" className="bg-blue-500 text-white">Anniversary</SelectItem>
                              <SelectItem value="valentine">Valentine's Day</SelectItem>
                              <SelectItem value="mothersday">Mother's Day</SelectItem>
                              <SelectItem value="fathersday">Father's Day</SelectItem>
                              <SelectItem value="christmas">Christmas</SelectItem>
                              <SelectItem value="newyear">New Year</SelectItem>
                              <SelectItem value="womensday">Women's Day</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Select For (Relation) */}
                    <FormField
                      control={form.control}
                      name="relationshipType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-charcoal">Select For</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 text-base">
                                <SelectValue placeholder="Select relation" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-60 overflow-y-auto">
                              <SelectItem value="son">Son</SelectItem>
                              <SelectItem value="daughter">Daughter</SelectItem>
                              <SelectItem value="father">Father</SelectItem>
                              <SelectItem value="mother">Mother</SelectItem>
                              <SelectItem value="sister">Sister</SelectItem>
                              <SelectItem value="brother">Brother</SelectItem>
                              <SelectItem value="husband">Husband</SelectItem>
                              <SelectItem value="wife">Wife</SelectItem>
                              <SelectItem value="boyfriend">Boyfriend</SelectItem>
                              <SelectItem value="girlfriend">Girlfriend</SelectItem>
                              <SelectItem value="friend">Friend</SelectItem>
                              <SelectItem value="myself">Myself</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="mt-8">
                      <Button 
                        type="submit" 
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-4 text-lg font-semibold rounded-lg"
                        disabled={createReminderMutation.isPending || updateReminderMutation.isPending}
                      >
                        {(createReminderMutation.isPending || updateReminderMutation.isPending) ? 
                          (editingReminder ? "Updating..." : "Saving...") : 
                          (editingReminder ? "Update Reminder" : "Save Reminder")
                        }
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
                {sortedReminders.map((reminder: EventReminder) => (
                  <Card key={reminder.id} className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-red-500" />
                            <span className="font-medium text-gray-900">
                              {reminder.title || `${reminder.relationshipType}'s ${reminder.eventType}`}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {formatDate(reminder.eventDate)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Created: {new Date(reminder.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditReminder(reminder)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteReminder(reminder.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
              onClick={handleAddNewReminder}
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