import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Mail, Calendar, Users, Send, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface EventReminder {
  id: number;
  userId: number;
  eventType: 'birthday' | 'anniversary';
  eventDate: string;
  reminderDate: string;
  isProcessed: boolean;
  notificationSent: boolean;
  createdAt: string;
}

interface User {
  id: number;
  email: string;
  phone: string;
  birthday?: string;
  anniversary?: string;
}

export default function AdminReminders() {
  const [selectedReminders, setSelectedReminders] = useState<number[]>([]);
  const [discountCode, setDiscountCode] = useState("SPECIAL15");
  const [discountPercentage, setDiscountPercentage] = useState(15);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending reminders
  const { data: pendingReminders = [], isLoading: loadingReminders } = useQuery({
    queryKey: ['/api/admin/reminders/pending'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch users with upcoming events
  const { data: usersWithEvents = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/admin/users/upcoming-events']
  });

  // Send reminder emails mutation
  const sendRemindersMutation = useMutation({
    mutationFn: async (data: { reminderIds: number[], discountCode: string, discountPercentage: number }) => {
      const response = await fetch('/api/admin/reminders/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to send reminders');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reminder Emails Sent",
        description: `Successfully sent ${data.totalSent} emails, ${data.totalFailed} failed.`
      });
      setSelectedReminders([]);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reminders/pending'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send reminder emails",
        variant: "destructive"
      });
    }
  });

  // Create bulk reminders mutation
  const createBulkRemindersMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/reminders/create-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to create bulk reminders');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk Reminders Created",
        description: `Created ${data.created} new reminders.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reminders/pending'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create bulk reminders",
        variant: "destructive"
      });
    }
  });

  const handleReminderSelect = (reminderId: number) => {
    setSelectedReminders(prev => 
      prev.includes(reminderId) 
        ? prev.filter(id => id !== reminderId)
        : [...prev, reminderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReminders.length === pendingReminders.length) {
      setSelectedReminders([]);
    } else {
      setSelectedReminders(pendingReminders.map((r: EventReminder) => r.id));
    }
  };

  const handleSendReminders = () => {
    if (selectedReminders.length === 0) {
      toast({
        title: "No Reminders Selected",
        description: "Please select at least one reminder to send.",
        variant: "destructive"
      });
      return;
    }

    sendRemindersMutation.mutate({
      reminderIds: selectedReminders,
      discountCode,
      discountPercentage
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Email Reminders</h1>
          <p className="text-muted-foreground">
            Manage customer birthday and anniversary reminder emails
          </p>
        </div>
        <Button 
          onClick={() => createBulkRemindersMutation.mutate()}
          disabled={createBulkRemindersMutation.isPending}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Create Bulk Reminders
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reminders</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReminders.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready to send
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users with Events</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersWithEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Have birthday/anniversary data
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedReminders.length}</div>
            <p className="text-xs text-muted-foreground">
              Reminders selected
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Email Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
            <CardDescription>
              Set up discount codes and email content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discountCode">Discount Code</Label>
              <Input
                id="discountCode"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="e.g., SPECIAL15"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discountPercentage">Discount Percentage</Label>
              <Input
                id="discountPercentage"
                type="number"
                min="1"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
              />
            </div>

            <div className="pt-4 space-y-2">
              <Button 
                onClick={handleSendReminders}
                disabled={selectedReminders.length === 0 || sendRemindersMutation.isPending}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                Send {selectedReminders.length} Reminder{selectedReminders.length !== 1 ? 's' : ''}
              </Button>
              
              {pendingReminders.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={handleSelectAll}
                  className="w-full"
                >
                  {selectedReminders.length === pendingReminders.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Reminders List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pending Reminders</CardTitle>
            <CardDescription>
              Select reminders to send email notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingReminders ? (
              <div className="text-center py-8">Loading reminders...</div>
            ) : pendingReminders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="mx-auto h-12 w-12 opacity-50 mb-4" />
                <p>No pending reminders found</p>
                <p className="text-sm">Create bulk reminders to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReminders.map((reminder: EventReminder) => (
                  <div 
                    key={reminder.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedReminders.includes(reminder.id)}
                      onCheckedChange={() => handleReminderSelect(reminder.id)}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant={reminder.eventType === 'birthday' ? 'default' : 'secondary'}>
                          {reminder.eventType === 'birthday' ? '🎂' : '💕'} {reminder.eventType}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          User ID: {reminder.userId}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1 text-sm">
                        <span>Event: {reminder.eventDate}</span>
                        <span>Reminder: {format(new Date(reminder.reminderDate), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}