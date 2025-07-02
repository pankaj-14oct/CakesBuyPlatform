import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Crown, Gift, Star, Trophy, Coins, History, 
  Calendar, CheckCircle, Clock, Award 
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatPrice } from '@/lib/utils';

interface LoyaltyStats {
  points: number;
  tier: string;
  totalSpent: string;
  orderCount: number;
}

interface LoyaltyTransaction {
  id: number;
  type: string;
  points: number;
  description: string;
  createdAt: string;
}

interface LoyaltyReward {
  id: number;
  title: string;
  description: string;
  pointsCost: number;
  rewardType: string;
  rewardValue: number;
  validityDays: number;
  minTier: string;
}

interface UserReward {
  id: number;
  code: string;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
  rewardId: number;
}

const tierColors = {
  Bronze: 'bg-amber-100 text-amber-800',
  Silver: 'bg-gray-100 text-gray-800',
  Gold: 'bg-yellow-100 text-yellow-800',
  Platinum: 'bg-purple-100 text-purple-800'
};

const tierIcons = {
  Bronze: Trophy,
  Silver: Award,
  Gold: Crown,
  Platinum: Star
};

const tierRequirements = {
  Bronze: { min: 0, max: 4999 },
  Silver: { min: 5000, max: 19999 },
  Gold: { min: 20000, max: 49999 },
  Platinum: { min: 50000, max: Infinity }
};

export default function LoyaltyPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [redeemCode, setRedeemCode] = useState('');

  // Fetch loyalty stats
  const { data: loyaltyStats, isLoading: statsLoading } = useQuery<LoyaltyStats>({
    queryKey: ['/api/loyalty/stats'],
    enabled: isAuthenticated,
  });

  // Fetch loyalty transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery<LoyaltyTransaction[]>({
    queryKey: ['/api/loyalty/transactions'],
    enabled: isAuthenticated,
  });

  // Fetch available rewards
  const { data: rewards, isLoading: rewardsLoading } = useQuery<LoyaltyReward[]>({
    queryKey: ['/api/loyalty/rewards'],
    enabled: isAuthenticated,
  });

  // Fetch user's redeemed rewards
  const { data: userRewards, isLoading: userRewardsLoading } = useQuery<UserReward[]>({
    queryKey: ['/api/loyalty/my-rewards'],
    enabled: isAuthenticated,
  });

  // Redeem reward mutation
  const redeemRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const response = await apiRequest('POST', '/api/loyalty/redeem', { rewardId });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reward redeemed successfully!",
        description: `Your reward code is: ${data.code}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/loyalty/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/loyalty/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/loyalty/my-rewards'] });
    },
    onError: (error: any) => {
      toast({
        title: "Redemption failed",
        description: error.message || "Failed to redeem reward",
        variant: "destructive"
      });
    }
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Crown className="h-16 w-16 text-caramel mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-charcoal mb-4">Join Our Loyalty Program</h1>
          <p className="text-charcoal opacity-70 mb-6">
            Sign in to earn points on every order and unlock exclusive rewards!
          </p>
          <Button className="bg-caramel hover:bg-brown">Sign In</Button>
        </Card>
      </div>
    );
  }

  if (statsLoading || transactionsLoading || rewardsLoading || userRewardsLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Coins className="h-12 w-12 text-caramel mx-auto mb-4 animate-spin" />
          <p className="text-charcoal opacity-70">Loading your loyalty dashboard...</p>
        </div>
      </div>
    );
  }

  if (!loyaltyStats) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Coins className="h-12 w-12 text-caramel mx-auto mb-4 animate-pulse" />
          <p className="text-charcoal opacity-70">Loading loyalty data...</p>
        </div>
      </div>
    );
  }

  const stats = loyaltyStats;
  const currentTier = (stats.tier || 'Bronze') as keyof typeof tierColors;
  const TierIcon = tierIcons[currentTier];
  const currentRequirement = tierRequirements[currentTier];
  const totalSpent = parseFloat(stats.totalSpent || "0");
  
  // Calculate progress to next tier
  let nextTier = null;
  let progressPercentage = 100;
  
  if (currentTier === 'Bronze') {
    nextTier = 'Silver';
    progressPercentage = (totalSpent / 5000) * 100;
  } else if (currentTier === 'Silver') {
    nextTier = 'Gold';
    progressPercentage = ((totalSpent - 5000) / 15000) * 100;
  } else if (currentTier === 'Gold') {
    nextTier = 'Platinum';
    progressPercentage = ((totalSpent - 20000) / 30000) * 100;
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <TierIcon className="h-8 w-8 text-caramel mr-3" />
            <h1 className="text-3xl font-bold text-charcoal">Loyalty Dashboard</h1>
          </div>
          <p className="text-charcoal opacity-70">
            Earn points on every order and unlock exclusive rewards
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Points Balance */}
          <Card>
            <CardContent className="p-6 text-center">
              <Coins className="h-8 w-8 text-caramel mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-charcoal">{stats.points}</h3>
              <p className="text-sm text-charcoal opacity-70">Available Points</p>
            </CardContent>
          </Card>

          {/* Current Tier */}
          <Card>
            <CardContent className="p-6 text-center">
              <TierIcon className="h-8 w-8 text-caramel mx-auto mb-2" />
              <Badge className={tierColors[currentTier]}>{currentTier} Member</Badge>
              <p className="text-sm text-charcoal opacity-70 mt-1">Current Tier</p>
            </CardContent>
          </Card>

          {/* Total Spent */}
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-caramel mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-charcoal">{formatPrice(totalSpent)}</h3>
              <p className="text-sm text-charcoal opacity-70">Total Spent</p>
            </CardContent>
          </Card>

          {/* Orders Count */}
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-caramel mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-charcoal">{stats.orderCount}</h3>
              <p className="text-sm text-charcoal opacity-70">Orders Placed</p>
            </CardContent>
          </Card>
        </div>

        {/* Tier Progress */}
        {nextTier && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-charcoal">Progress to {nextTier}</h3>
                <Badge variant="outline">{Math.min(progressPercentage, 100).toFixed(0)}%</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-caramel h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-charcoal opacity-70">
                {nextTier === 'Silver' && `Spend ${formatPrice(5000 - totalSpent)} more to reach Silver tier`}
                {nextTier === 'Gold' && `Spend ${formatPrice(20000 - totalSpent)} more to reach Gold tier`}
                {nextTier === 'Platinum' && `Spend ${formatPrice(50000 - totalSpent)} more to reach Platinum tier`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rewards">Available Rewards</TabsTrigger>
            <TabsTrigger value="my-rewards">My Rewards</TabsTrigger>
            <TabsTrigger value="history">Points History</TabsTrigger>
          </TabsList>

          {/* Available Rewards */}
          <TabsContent value="rewards">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards?.map((reward) => (
                <Card key={reward.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{reward.title}</CardTitle>
                      <Badge className="bg-caramel text-white">
                        {reward.pointsCost} pts
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-charcoal opacity-70 mb-4">{reward.description}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Value:</span>
                        <span className="font-medium">
                          {reward.rewardType === 'discount_percent' && `${reward.rewardValue}% off`}
                          {reward.rewardType === 'discount_amount' && formatPrice(reward.rewardValue)}
                          {reward.rewardType === 'free_delivery' && 'Free Delivery'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Valid for:</span>
                        <span className="font-medium">{reward.validityDays} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Min tier:</span>
                        <Badge variant="outline" className={tierColors[reward.minTier as keyof typeof tierColors]}>
                          {reward.minTier}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-caramel hover:bg-brown"
                      disabled={stats.points < reward.pointsCost || redeemRewardMutation.isPending}
                      onClick={() => redeemRewardMutation.mutate(reward.id)}
                    >
                      {redeemRewardMutation.isPending ? 'Redeeming...' : 'Redeem'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* My Rewards */}
          <TabsContent value="my-rewards">
            <div className="space-y-4">
              {userRewards?.length === 0 ? (
                <Card className="p-8 text-center">
                  <Gift className="h-12 w-12 text-caramel mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-charcoal mb-2">No rewards yet</h3>
                  <p className="text-charcoal opacity-70">Redeem your first reward to see it here!</p>
                </Card>
              ) : (
                userRewards?.map((userReward) => (
                  <Card key={userReward.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-charcoal">Reward Code: {userReward.code}</h3>
                            <Badge variant={userReward.isUsed ? "secondary" : "default"}>
                              {userReward.isUsed ? "Used" : "Available"}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-charcoal opacity-70">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Expires: {new Date(userReward.expiresAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>Redeemed: {new Date(userReward.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Points History */}
          <TabsContent value="history">
            <div className="space-y-4">
              {transactions?.length === 0 ? (
                <Card className="p-8 text-center">
                  <History className="h-12 w-12 text-caramel mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-charcoal mb-2">No transactions yet</h3>
                  <p className="text-charcoal opacity-70">Place your first order to start earning points!</p>
                </Card>
              ) : (
                transactions?.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-charcoal mb-1">{transaction.description}</h3>
                          <p className="text-sm text-charcoal opacity-70">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge 
                          variant={transaction.type === 'earned' ? "default" : "secondary"}
                          className={transaction.type === 'earned' ? "bg-mint text-white" : ""}
                        >
                          {transaction.type === 'earned' ? '+' : ''}{transaction.points} pts
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}