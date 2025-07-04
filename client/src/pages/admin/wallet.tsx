import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Wallet, Plus, Minus, Settings, Users, History, 
  CreditCard, DollarSign, TrendingUp, TrendingDown,
  Clock, Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatPrice } from '@/lib/utils';

interface User {
  id: number;
  name?: string;
  email: string;
  phone: string;
  walletBalance?: string;
  loyaltyTier?: string;
}

interface WalletTransaction {
  id: number;
  userId: number;
  type: string;
  amount: string;
  description: string;
  balanceAfter: string;
  createdAt: string;
  adminId?: number;
  orderId?: number;
}

interface AdminConfig {
  id: number;
  key: string;
  value: string;
  type: string;
  description?: string;
  category: string;
  updatedAt: string;
}

export default function AdminWalletPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [debitAmount, setDebitAmount] = useState('');
  const [description, setDescription] = useState('');
  const [configKey, setConfigKey] = useState('');
  const [configValue, setConfigValue] = useState('');
  const [configType, setConfigType] = useState('string');
  const [configDescription, setConfigDescription] = useState('');
  const [configCategory, setConfigCategory] = useState('wallet');

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  // Fetch wallet transactions for selected user
  const { data: transactions, isLoading: transactionsLoading } = useQuery<WalletTransaction[]>({
    queryKey: ['/api/admin/wallet/transactions', selectedUserId],
    enabled: !!selectedUserId,
  });

  // Fetch admin configurations
  const { data: configs, isLoading: configsLoading } = useQuery<AdminConfig[]>({
    queryKey: ['/api/admin/config'],
  });

  // Credit wallet mutation
  const creditMutation = useMutation({
    mutationFn: async (data: { userId: number; amount: string; description: string }) => {
      return apiRequest(`/api/admin/wallet/credit`, 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Wallet credited successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/wallet/transactions', selectedUserId] });
      setCreditAmount('');
      setDescription('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to credit wallet",
        variant: "destructive",
      });
    },
  });

  // Debit wallet mutation
  const debitMutation = useMutation({
    mutationFn: async (data: { userId: number; amount: string; description: string }) => {
      return apiRequest(`/api/admin/wallet/debit`, 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Wallet debited successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/wallet/transactions', selectedUserId] });
      setDebitAmount('');
      setDescription('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to debit wallet",
        variant: "destructive",
      });
    },
  });

  // Set config mutation
  const setConfigMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; type: string; description?: string; category: string }) => {
      return apiRequest(`/api/admin/config`, 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Configuration saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/config'] });
      setConfigKey('');
      setConfigValue('');
      setConfigDescription('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
    },
  });

  const handleCreditWallet = () => {
    if (!selectedUserId || !creditAmount || parseFloat(creditAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please select a user and enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    creditMutation.mutate({
      userId: selectedUserId,
      amount: creditAmount,
      description: description || 'Admin wallet credit'
    });
  };

  const handleDebitWallet = () => {
    if (!selectedUserId || !debitAmount || parseFloat(debitAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please select a user and enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    debitMutation.mutate({
      userId: selectedUserId,
      amount: debitAmount,
      description: description || 'Admin wallet debit'
    });
  };

  const handleSaveConfig = () => {
    if (!configKey || !configValue) {
      toast({
        title: "Error",
        description: "Please enter key and value",
        variant: "destructive",
      });
      return;
    }

    setConfigMutation.mutate({
      key: configKey,
      value: configValue,
      type: configType,
      description: configDescription,
      category: configCategory
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
      case 'admin_credit':
      case 'refund':
      case 'cashback':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'debit':
      case 'admin_debit':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
      case 'admin_credit':
      case 'refund':
      case 'cashback':
        return 'bg-green-100 text-green-800';
      case 'debit':
      case 'admin_debit':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (usersLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Wallet className="h-12 w-12 text-caramel mx-auto mb-4 animate-spin" />
          <p className="text-charcoal opacity-70">Loading wallet management...</p>
        </div>
      </div>
    );
  }

  const selectedUser = users?.find(user => user.id === selectedUserId);

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Wallet className="h-8 w-8 text-caramel" />
          <h1 className="text-3xl font-bold text-charcoal">Wallet Management</h1>
        </div>

        <Tabs defaultValue="wallet" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet Operations
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Select User
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedUserId?.toString() || ""} onValueChange={(value) => setSelectedUserId(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name || 'No Name'}</span>
                            <span className="text-sm text-gray-500">{user.phone} - {user.email}</span>
                            <span className="text-sm text-green-600">Balance: {formatPrice(parseFloat(user.walletBalance || "0"))}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedUser && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-charcoal mb-2">Selected User</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Name:</span> {selectedUser.name || 'No Name'}</p>
                        <p><span className="font-medium">Phone:</span> {selectedUser.phone}</p>
                        <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                        <p><span className="font-medium">Balance:</span> {formatPrice(parseFloat(selectedUser.walletBalance || "0"))}</p>
                        <p><span className="font-medium">Tier:</span> {selectedUser.loyaltyTier || 'Bronze'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Wallet Operations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Wallet Operations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter transaction description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <Separator />

                  {/* Credit Wallet */}
                  <div className="space-y-3">
                    <Label htmlFor="credit-amount" className="flex items-center gap-2 text-green-600">
                      <Plus className="h-4 w-4" />
                      Credit Amount
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="credit-amount"
                        type="number"
                        placeholder="0.00"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                      <Button 
                        onClick={handleCreditWallet}
                        disabled={!selectedUserId || creditMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Credit
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Debit Wallet */}
                  <div className="space-y-3">
                    <Label htmlFor="debit-amount" className="flex items-center gap-2 text-red-600">
                      <Minus className="h-4 w-4" />
                      Debit Amount
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="debit-amount"
                        type="number"
                        placeholder="0.00"
                        value={debitAmount}
                        onChange={(e) => setDebitAmount(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                      <Button 
                        onClick={handleDebitWallet}
                        disabled={!selectedUserId || debitMutation.isPending}
                        variant="destructive"
                      >
                        <Minus className="h-4 w-4 mr-2" />
                        Debit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Transaction History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedUserId ? (
                    <p className="text-gray-500 text-center py-4">Select a user to view transactions</p>
                  ) : transactionsLoading ? (
                    <p className="text-gray-500 text-center py-4">Loading transactions...</p>
                  ) : transactions && transactions.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getTransactionIcon(transaction.type)}
                            <div>
                              <p className="font-medium text-sm">{transaction.description}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getTransactionColor(transaction.type)}>
                              {transaction.type.includes('credit') || transaction.type === 'refund' || transaction.type === 'cashback' ? '+' : '-'}
                              {formatPrice(parseFloat(transaction.amount))}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              Balance: {formatPrice(parseFloat(transaction.balanceAfter))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No transactions found</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="config-key">Key</Label>
                    <Input
                      id="config-key"
                      placeholder="config.key.name"
                      value={configKey}
                      onChange={(e) => setConfigKey(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="config-value">Value</Label>
                    <Input
                      id="config-value"
                      placeholder="Configuration value"
                      value={configValue}
                      onChange={(e) => setConfigValue(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="config-type">Type</Label>
                    <Select value={configType} onValueChange={setConfigType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="config-category">Category</Label>
                    <Select value={configCategory} onValueChange={setConfigCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="wallet">Wallet</SelectItem>
                        <SelectItem value="loyalty">Loyalty</SelectItem>
                        <SelectItem value="orders">Orders</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="config-description">Description</Label>
                    <Textarea
                      id="config-description"
                      placeholder="Configuration description"
                      value={configDescription}
                      onChange={(e) => setConfigDescription(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={handleSaveConfig}
                    disabled={setConfigMutation.isPending}
                    className="w-full"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                </CardContent>
              </Card>

              {/* Current Configurations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Current Configurations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {configsLoading ? (
                    <p className="text-gray-500 text-center py-4">Loading configurations...</p>
                  ) : configs && configs.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {configs.map((config) => (
                        <div key={config.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">{config.key}</h4>
                            <Badge variant="outline">{config.category}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Value:</span> {config.value}
                          </p>
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Type:</span> {config.type}
                          </p>
                          {config.description && (
                            <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            Updated: {new Date(config.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No configurations found</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}