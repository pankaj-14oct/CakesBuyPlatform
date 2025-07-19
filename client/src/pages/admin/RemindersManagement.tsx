import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { Bell, Calendar, Mail, Users, Gift, Heart, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

interface EventReminder {
  id: number;
  user_id: number;
  event_type: string;
  event_date: string;
  relationship_type?: string;
  title?: string;
  reminder_date: string;
  is_processed: boolean;
  notification_sent: boolean;
  created_at: string;
  email: string;
  name?: string;
}

export default function RemindersManagement() {
  const [selectedReminders, setSelectedReminders] = useState<number[]>([]);
  const [discountCode, setDiscountCode] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending reminders
  const { data: pendingReminders = [], isLoading } = useQuery<EventReminder[]>({
    queryKey: ["/api/admin/reminders/pending"],
  });

  // Fetch users with upcoming events
  const { data: upcomingEvents = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users/upcoming-events"],
  });

  // Send reminder emails mutation
  const sendRemindersMutation = useMutation({
    mutationFn: async () => {
      if (selectedReminders.length === 0) {
        throw new Error("Please select at least one reminder to send");
      }

      const response = await apiRequest("/api/admin/reminders/send", "POST", {
        reminderIds: selectedReminders,
        discountCode: discountCode || undefined,
        discountPercentage: discountPercentage || undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send reminder emails");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reminders Sent!",
        description: `Successfully sent ${data.totalSent} reminder emails. ${data.totalFailed} failed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reminders/pending"] });
      setSelectedReminders([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = () => {
    if (selectedReminders.length === pendingReminders.length) {
      setSelectedReminders([]);
    } else {
      setSelectedReminders(pendingReminders.map(r => r.id));
    }
  };

  const handleSelectReminder = (reminderId: number) => {
    setSelectedReminders(prev => 
      prev.includes(reminderId) 
        ? prev.filter(id => id !== reminderId)
        : [...prev, reminderId]
    );
  };

  const formatEventDate = (dateStr: string | null | undefined) => {
    if (!dateStr) {
      return "No date";
    }
    
    try {
      // Handle MM-DD format (e.g., "08-25")
      if (dateStr.match(/^\d{2}-\d{2}$/)) {
        const [month, day] = dateStr.split('-');
        const currentYear = new Date().getFullYear();
        const date = new Date(currentYear, parseInt(month) - 1, parseInt(day));
        return format(date, "MMMM dd");
      }
      // Handle full date (e.g., "2001-07-19")
      if (dateStr.includes('-') && dateStr.length > 5) {
        return format(parseISO(dateStr), "MMMM dd, yyyy");
      }
      // Fallback for other formats
      return format(new Date(dateStr), "MMMM dd, yyyy");
    } catch {
      return dateStr;
    }
  };

  const getEventIcon = (eventType: string | null | undefined) => {
    if (!eventType) return <Calendar className="h-4 w-4" />;
    
    switch (eventType.toLowerCase()) {
      case 'birthday':
        return <Gift className="h-4 w-4" />;
      case 'anniversary':
        return <Heart className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventColor = (eventType: string | null | undefined) => {
    if (!eventType) return 'bg-gray-100 text-gray-800';
    
    switch (eventType.toLowerCase()) {
      case 'birthday':
        return 'bg-blue-100 text-blue-800';
      case 'anniversary':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Sort reminders by upcoming date
  const sortedReminders = [...pendingReminders].sort((a, b) => {
    const getDateForSorting = (dateStr: string | null | undefined) => {
      if (!dateStr) {
        return new Date(); // Default to current date if no date provided
      }
      
      // Handle MM-DD format (e.g., "08-25")
      if (dateStr.match(/^\d{2}-\d{2}$/)) {
        const [month, day] = dateStr.split('-');
        const currentYear = new Date().getFullYear();
        const date = new Date(currentYear, parseInt(month) - 1, parseInt(day));
        // If the date has passed this year, consider it next year
        if (date < new Date()) {
          date.setFullYear(currentYear + 1);
        }
        return date;
      }
      return new Date(dateStr);
    };
    
    return getDateForSorting(a.event_date).getTime() - getDateForSorting(b.event_date).getTime();
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reminder Management</h1>
          <p className="text-gray-600 mt-2">Send personalized reminder emails to customers</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="text-sm">
            <Bell className="h-4 w-4 mr-1" />
            {pendingReminders.length} Pending
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Users className="h-4 w-4 mr-1" />
            {upcomingEvents.length} Upcoming Events
          </Badge>
        </div>
      </div>

      {/* Email Campaign Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Email Campaign Settings</span>
          </CardTitle>
          <CardDescription>
            Configure discount offers for reminder emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discountCode">Discount Code (Optional)</Label>
              <Input
                id="discountCode"
                placeholder="e.g., BIRTHDAY20"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountPercentage">Discount Percentage</Label>
              <Input
                id="discountPercentage"
                type="number"
                min="0"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Reminders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Upcoming Reminders</span>
              </CardTitle>
              <CardDescription>
                Sorted by upcoming event date - click to select reminders to send
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedReminders.length === pendingReminders.length ? "Deselect All" : "Select All"}
              </Button>
              <Button 
                onClick={() => sendRemindersMutation.mutate()}
                disabled={selectedReminders.length === 0 || sendRemindersMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {sendRemindersMutation.isPending ? "Sending..." : `Send ${selectedReminders.length} Reminders`}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading reminders...</div>
          ) : sortedReminders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No pending reminders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedReminders.map((reminder) => (
                <div 
                  key={reminder.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedReminders.includes(reminder.id)
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectReminder(reminder.id)}
                >
                  <div className="flex items-center space-x-4">
                    <Checkbox 
                      checked={selectedReminders.includes(reminder.id)}
                      onChange={() => handleSelectReminder(reminder.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Badge className={`${getEventColor(reminder.event_type)} flex items-center space-x-1`}>
                          {getEventIcon(reminder.event_type)}
                          <span className="capitalize">{reminder.event_type}</span>
                        </Badge>
                        <span className="font-medium text-gray-900">
                          {reminder.email}
                        </span>
                        {reminder.name && (
                          <span className="text-gray-600">({reminder.name})</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Event: {formatEventDate(reminder.event_date)}</span>
                        </span>
                        {reminder.relationship_type && (
                          <span>Relationship: {reminder.relationship_type}</span>
                        )}
                        {reminder.title && (
                          <span>Title: {reminder.title}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}