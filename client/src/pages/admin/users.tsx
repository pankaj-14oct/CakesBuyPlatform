import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Eye, Search, Calendar, Mail, Phone, 
  MapPin, Star, CreditCard, Gift, Crown
} from 'lucide-react';
import { User } from '@shared/schema';
import { formatPrice } from '@/lib/utils';

interface SafeUser extends Omit<User, 'password'> {
  password?: never;
}

export default function AdminUsers() {
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users = [], isLoading } = useQuery<SafeUser[]>({
    queryKey: ['/api/admin/users'],
  });

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm) ||
    (user.id.toString().includes(searchTerm))
  );

  // Calculate user stats
  const totalUsers = users.length;
  const loyaltyUsers = users.filter(user => (user.loyaltyPoints || 0) > 0).length;
  const goldUsers = users.filter(user => user.loyaltyTier === 'Gold').length;
  const platinumUsers = users.filter(user => user.loyaltyTier === 'Platinum').length;

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Bronze': return '🥉';
      case 'Silver': return '🥈';
      case 'Gold': return '🥇';
      case 'Platinum': return '💎';
      default: return '👤';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Bronze': return 'bg-amber-100 text-amber-800';
      case 'Silver': return 'bg-gray-100 text-gray-800';
      case 'Gold': return 'bg-yellow-100 text-yellow-800';
      case 'Platinum': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-charcoal mb-2">Users Management</h1>
          <p className="text-charcoal opacity-70">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-charcoal mb-2">Users Management</h1>
        <p className="text-charcoal opacity-70">Manage registered users and their information</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-mint" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brown">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loyalty Members</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brown">{loyaltyUsers}</div>
            <p className="text-xs text-muted-foreground">
              With loyalty points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gold Members</CardTitle>
            <Gift className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brown">{goldUsers}</div>
            <p className="text-xs text-muted-foreground">
              Gold tier users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platinum Members</CardTitle>
            <Crown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brown">{platinumUsers}</div>
            <p className="text-xs text-muted-foreground">
              Platinum tier users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users List</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, phone, or ID..."
                  className="pl-8 w-80"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Loyalty Tier</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">#{user.id}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      <Badge className={getTierColor(user.loyaltyTier || 'Bronze')}>
                        {getTierIcon(user.loyaltyTier || 'Bronze')} {user.loyaltyTier || 'Bronze'}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.loyaltyPoints || 0}</TableCell>
                    <TableCell>{formatPrice(user.totalSpent || 0)}</TableCell>
                    <TableCell>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>User Details - #{user.id}</DialogTitle>
                          </DialogHeader>
                          {selectedUser && (
                            <div className="space-y-6">
                              {/* Basic Info */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Email</label>
                                  <div className="flex items-center mt-1">
                                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                    <span>{selectedUser.email}</span>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Phone</label>
                                  <div className="flex items-center mt-1">
                                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                    <span>{selectedUser.phone}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Loyalty Info */}
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Loyalty Tier</label>
                                  <div className="mt-1">
                                    <Badge className={getTierColor(selectedUser.loyaltyTier || 'Bronze')}>
                                      {getTierIcon(selectedUser.loyaltyTier || 'Bronze')} {selectedUser.loyaltyTier || 'Bronze'}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Loyalty Points</label>
                                  <div className="flex items-center mt-1">
                                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                                    <span>{selectedUser.loyaltyPoints || 0}</span>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Total Spent</label>
                                  <div className="flex items-center mt-1">
                                    <CreditCard className="h-4 w-4 text-green-500 mr-2" />
                                    <span>{formatPrice(selectedUser.totalSpent || 0)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Special Dates */}
                              {(selectedUser.birthday || selectedUser.anniversary) && (
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Special Dates</label>
                                  <div className="grid grid-cols-2 gap-4 mt-2">
                                    {selectedUser.birthday && (
                                      <div className="flex items-center">
                                        <Calendar className="h-4 w-4 text-pink-500 mr-2" />
                                        <span>Birthday: {selectedUser.birthday}</span>
                                      </div>
                                    )}
                                    {selectedUser.anniversary && (
                                      <div className="flex items-center">
                                        <Calendar className="h-4 w-4 text-red-500 mr-2" />
                                        <span>Anniversary: {selectedUser.anniversary}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Addresses */}
                              {selectedUser.addresses && selectedUser.addresses.length > 0 && (
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Saved Addresses</label>
                                  <div className="space-y-2 mt-2">
                                    {selectedUser.addresses.map((address, index) => (
                                      <div key={index} className="p-3 border rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center">
                                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="font-medium">{address.name}</span>
                                          </div>
                                          <Badge variant="outline">{address.type}</Badge>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          <div>{address.address}</div>
                                          <div>{address.city} - {address.pincode}</div>
                                          {address.landmark && <div>Landmark: {address.landmark}</div>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Account Info */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Account Created</label>
                                  <div className="mt-1">
                                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('en-IN') : 'N/A'}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                                  <div className="mt-1">
                                    {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleString('en-IN') : 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'No users have registered yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}