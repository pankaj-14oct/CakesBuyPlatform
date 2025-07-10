import {
  users, categories, cakes, addons, orders, deliveryAreas, promoCodes, reviews, eventReminders, otpVerifications,
  loyaltyTransactions, loyaltyRewards, userRewards, invoices, walletTransactions, adminConfigs, deliveryBoys,
  orderRatings,
  type User, type InsertUser, type Category, type InsertCategory,
  type Cake, type InsertCake, type Addon, type InsertAddon,
  type Order, type InsertOrder, type DeliveryArea, type InsertDeliveryArea,
  type PromoCode, type InsertPromoCode, type Review, type InsertReview,
  type EventReminder, type InsertEventReminder, type OtpVerification, type InsertOtpVerification,
  type LoyaltyTransaction, type InsertLoyaltyTransaction, type LoyaltyReward, type InsertLoyaltyReward,
  type UserReward, type InsertUserReward, type Invoice, type InsertInvoice,
  type WalletTransaction, type InsertWalletTransaction, type AdminConfig, type InsertAdminConfig,
  type DeliveryBoy, type InsertDeliveryBoy, type OrderRating, type InsertOrderRating
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, desc, isNotNull, or, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  updateUserAddresses(id: number, addresses: any[]): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;

  // Cakes
  getCakes(filters?: { categoryId?: number; isEggless?: boolean; isBestseller?: boolean }): Promise<Cake[]>;
  getCake(id: number): Promise<Cake | undefined>;
  getCakeBySlug(slug: string): Promise<Cake | undefined>;
  searchCakes(query: string, options?: { sort?: string; category?: string; priceRange?: string }): Promise<Cake[]>;

  // Addons
  getAddons(): Promise<Addon[]>;
  getAddonsByCategory(category: string): Promise<Addon[]>;

  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  updateOrder(id: number, updates: Partial<Order>): Promise<void>;
  updateOrderStatus(id: number, status: string): Promise<void>;

  // Delivery Areas
  getDeliveryAreas(): Promise<DeliveryArea[]>;
  checkDeliveryArea(pincode: string): Promise<DeliveryArea | undefined>;

  // Promo Codes
  getPromoCode(code: string): Promise<PromoCode | undefined>;
  validatePromoCode(code: string, orderValue: number): Promise<{ valid: boolean; discount?: number; message?: string }>;

  // Reviews
  getCakeReviews(cakeId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Order Ratings
  createOrderRating(rating: InsertOrderRating): Promise<OrderRating>;
  getOrderRating(orderId: number): Promise<OrderRating | undefined>;
  getOrderRatingById(id: number): Promise<OrderRating | undefined>;
  updateOrderRating(id: number, updates: Partial<OrderRating>): Promise<void>;
  getDeliveredOrdersWithoutRating(): Promise<Order[]>;
  updateOrderRatingEmailStatus(orderId: number, sent: boolean): Promise<void>;

  // Admin methods
  // Categories management
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: Partial<Category>): Promise<void>;
  deleteCategory(id: number): Promise<void>;

  // Cakes management
  createCake(cake: InsertCake): Promise<Cake>;
  updateCake(id: number, updates: Partial<Cake>): Promise<void>;
  deleteCake(id: number): Promise<void>;

  // Orders management
  getAllOrders(): Promise<Order[]>;
  getOrdersByStatus(status: string): Promise<Order[]>;

  // Promo codes management
  createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode>;
  updatePromoCode(id: number, updates: Partial<PromoCode>): Promise<void>;
  deletePromoCode(id: number): Promise<void>;
  getAllPromoCodes(): Promise<PromoCode[]>;

  // Add-ons management
  createAddon(addon: InsertAddon): Promise<Addon>;
  updateAddon(id: number, updates: Partial<Addon>): Promise<void>;
  deleteAddon(id: number): Promise<void>;

  // Event reminders management
  createEventReminder(reminder: InsertEventReminder): Promise<EventReminder>;
  getEventReminder(id: number): Promise<EventReminder | undefined>;
  getUserEventReminders(userId: number): Promise<EventReminder[]>;
  getPendingReminders(): Promise<EventReminder[]>;
  updateEventReminder(id: number, updates: Partial<EventReminder>): Promise<void>;
  deleteEventReminder(id: number): Promise<void>;
  getUsersWithUpcomingEvents(): Promise<User[]>;
  getUsersWithEventDates(): Promise<User[]>;

  // OTP verification management
  createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification>;
  verifyOtp(phone: string, otp: string): Promise<OtpVerification | null>;
  cleanupExpiredOtp(): Promise<void>;

  // Loyalty Program management
  // User loyalty operations
  updateUserLoyalty(userId: number, pointsToAdd: number, orderAmount: number): Promise<void>;
  getUserLoyaltyStats(userId: number): Promise<User | undefined>;
  
  // Loyalty transactions
  createLoyaltyTransaction(transaction: InsertLoyaltyTransaction): Promise<LoyaltyTransaction>;
  getUserLoyaltyTransactions(userId: number, limit?: number): Promise<LoyaltyTransaction[]>;
  
  // Loyalty rewards
  getLoyaltyRewards(userTier?: string): Promise<LoyaltyReward[]>;
  getLoyaltyReward(id: number): Promise<LoyaltyReward | undefined>;
  createLoyaltyReward(reward: InsertLoyaltyReward): Promise<LoyaltyReward>;
  updateLoyaltyReward(id: number, updates: Partial<LoyaltyReward>): Promise<void>;
  deleteLoyaltyReward(id: number): Promise<void>;
  
  // User rewards (redeemed rewards)
  redeemReward(userId: number, rewardId: number): Promise<UserReward>;
  getUserRewards(userId: number): Promise<UserReward[]>;
  getUserReward(code: string): Promise<UserReward | undefined>;
  useUserReward(code: string): Promise<void>;

  // Wallet management
  getUserWalletBalance(userId: number): Promise<string>;
  addWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction>;
  getUserWalletTransactions(userId: number, limit?: number): Promise<WalletTransaction[]>;
  updateUserWalletBalance(userId: number, amount: number, type: string, description: string, adminId?: number, orderId?: number): Promise<WalletTransaction>;
  
  // Admin Configuration management
  getAdminConfig(key: string): Promise<AdminConfig | undefined>;
  setAdminConfig(config: InsertAdminConfig): Promise<AdminConfig>;
  getAllAdminConfigs(): Promise<AdminConfig[]>;
  updateAdminConfig(key: string, value: string, updatedBy?: number): Promise<void>;
  deleteAdminConfig(key: string): Promise<void>;

  // Delivery Boys management
  createDeliveryBoy(deliveryBoy: InsertDeliveryBoy): Promise<DeliveryBoy>;
  getDeliveryBoy(id: number): Promise<DeliveryBoy | undefined>;
  getDeliveryBoyByPhone(phone: string): Promise<DeliveryBoy | undefined>;
  getAllDeliveryBoys(): Promise<DeliveryBoy[]>;
  getActiveDeliveryBoys(): Promise<DeliveryBoy[]>;
  updateDeliveryBoy(id: number, updates: Partial<DeliveryBoy>): Promise<void>;
  deleteDeliveryBoy(id: number): Promise<void>;
  
  // Order assignment to delivery boys
  assignOrderToDeliveryBoy(orderId: number, deliveryBoyId: number): Promise<void>;
  getDeliveryBoyOrders(deliveryBoyId: number, status?: string): Promise<Order[]>;
  updateOrderAssignment(orderId: number, status: string, deliveryBoyId?: number): Promise<void>;

}

// DatabaseStorage implementation
export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Username field has been removed - this method is deprecated
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userData = {
      ...insertUser,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserAddresses(id: number, addresses: any[]): Promise<void> {
    await db.update(users)
      .set({ addresses, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category || undefined;
  }

  // Cakes
  async getCakes(filters?: { categoryId?: number; isEggless?: boolean; isBestseller?: boolean }): Promise<Cake[]> {
    let query = db.select().from(cakes);
    
    if (filters) {
      const conditions = [];
      if (filters.categoryId) {
        conditions.push(eq(cakes.categoryId, filters.categoryId));
      }
      if (filters.isEggless !== undefined) {
        conditions.push(eq(cakes.isEggless, filters.isEggless));
      }
      if (filters.isBestseller !== undefined) {
        conditions.push(eq(cakes.isBestseller, filters.isBestseller));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(cakes.name);
  }

  async getCake(id: number): Promise<Cake | undefined> {
    const [cake] = await db.select().from(cakes).where(eq(cakes.id, id));
    return cake || undefined;
  }

  async getCakeBySlug(slug: string): Promise<Cake | undefined> {
    const [cake] = await db.select().from(cakes).where(eq(cakes.slug, slug));
    return cake || undefined;
  }

  async searchCakes(query: string, options?: { sort?: string; category?: string; priceRange?: string }): Promise<Cake[]> {
    // Start with basic search
    let results = await db.select().from(cakes)
      .where(or(
        like(cakes.name, `%${query}%`),
        like(cakes.description, `%${query}%`)
      ));
    
    // Apply category filter if specified
    if (options?.category && options.category !== 'all') {
      const category = await db.select().from(categories).where(eq(categories.slug, options.category)).limit(1);
      if (category.length > 0) {
        results = results.filter(cake => cake.categoryId === category[0].id);
      }
    }
    
    // Apply price range filter if specified
    if (options?.priceRange && options.priceRange !== 'all') {
      const [min, max] = options.priceRange.split('-');
      if (max === undefined) {
        // Handle "2000+" format
        const minPrice = parseInt(min.replace('+', ''));
        results = results.filter(cake => cake.basePrice >= minPrice);
      } else {
        // Handle "500-1000" format
        const minPrice = parseInt(min);
        const maxPrice = parseInt(max);
        results = results.filter(cake => cake.basePrice >= minPrice && cake.basePrice <= maxPrice);
      }
    }
    
    // Apply sorting
    switch (options?.sort) {
      case 'price-low':
        results.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case 'price-high':
        results.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case 'rating':
        // For now, order by bestseller as a proxy for rating
        results.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
        break;
      case 'popular':
        results.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
        break;
      default:
        // Default to name order for relevance
        results.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return results;
  }

  // Addons
  async getAddons(): Promise<Addon[]> {
    return await db.select().from(addons).orderBy(addons.name);
  }

  async getAddonsByCategory(category: string): Promise<Addon[]> {
    return await db.select().from(addons)
      .where(eq(addons.category, category))
      .orderBy(addons.name);
  }

  // Orders
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const orderNumber = `CK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Transform the data to match database schema
    const orderData = {
      userId: insertOrder.userId || null,
      orderNumber,
      items: insertOrder.items,
      subtotal: insertOrder.subtotal,
      deliveryFee: insertOrder.deliveryFee || "0",
      discount: insertOrder.discount || "0",
      total: insertOrder.total,
      status: insertOrder.status || "pending",
      paymentStatus: insertOrder.paymentStatus || "pending",
      paymentMethod: insertOrder.paymentMethod,
      deliveryAddress: insertOrder.deliveryAddress,
      deliveryDate: insertOrder.deliveryDate,
      deliveryTime: insertOrder.deliveryTime,
      specialInstructions: insertOrder.specialInstructions,
      promoCode: insertOrder.promoCode,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [order] = await db.insert(orders).values(orderData).returning();
    return order;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order || undefined;
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async updateOrder(id: number, updates: Partial<Order>): Promise<void> {
    await db.update(orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orders.id, id));
  }

  async updateOrderStatus(id: number, status: string): Promise<void> {
    await db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id));
  }

  // Delivery Areas
  async getDeliveryAreas(): Promise<DeliveryArea[]> {
    return await db.select().from(deliveryAreas).orderBy(deliveryAreas.name);
  }

  async checkDeliveryArea(pincode: string): Promise<DeliveryArea | undefined> {
    const [area] = await db.select().from(deliveryAreas).where(eq(deliveryAreas.pincode, pincode));
    return area || undefined;
  }

  // Promo Codes
  async getPromoCode(code: string): Promise<PromoCode | undefined> {
    const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase()));
    return promo || undefined;
  }

  async validatePromoCode(code: string, orderValue: number): Promise<{ valid: boolean; discount?: number; message?: string }> {
    const promo = await this.getPromoCode(code);
    
    if (!promo) {
      return { valid: false, message: "Invalid promo code" };
    }

    if (!promo.isActive) {
      return { valid: false, message: "Promo code is not active" };
    }

    if (promo.validUntil && new Date(promo.validUntil) < new Date()) {
      return { valid: false, message: "Promo code has expired" };
    }

    if (promo.usageLimit && promo.usedCount && promo.usedCount >= promo.usageLimit) {
      return { valid: false, message: "Promo code usage limit reached" };
    }

    const minOrderValue = parseFloat(promo.minOrderValue || "0");
    if (orderValue < minOrderValue) {
      return { valid: false, message: `Minimum order value of ₹${minOrderValue} required` };
    }

    let discount = 0;
    if (promo.discountType === "percentage") {
      discount = (orderValue * parseFloat(promo.discountValue)) / 100;
      if (promo.maxDiscount) {
        discount = Math.min(discount, parseFloat(promo.maxDiscount));
      }
    } else {
      discount = parseFloat(promo.discountValue);
    }

    return { valid: true, discount };
  }

  // Reviews
  async getCakeReviews(cakeId: number): Promise<Review[]> {
    return await db.select().from(reviews)
      .where(eq(reviews.cakeId, cakeId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values({
      ...insertReview,
      createdAt: new Date()
    }).returning();
    return review;
  }

  // Order Ratings
  async createOrderRating(insertRating: InsertOrderRating): Promise<OrderRating> {
    const [rating] = await db.insert(orderRatings).values({
      ...insertRating,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return rating;
  }

  async getOrderRating(orderId: number): Promise<OrderRating | undefined> {
    const [rating] = await db.select().from(orderRatings).where(eq(orderRatings.orderId, orderId));
    return rating || undefined;
  }

  async getOrderRatingById(id: number): Promise<OrderRating | undefined> {
    const [rating] = await db.select().from(orderRatings).where(eq(orderRatings.id, id));
    return rating || undefined;
  }

  async updateOrderRating(id: number, updates: Partial<OrderRating>): Promise<void> {
    await db.update(orderRatings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orderRatings.id, id));
  }

  async getDeliveredOrdersWithoutRating(): Promise<Order[]> {
    // Get orders that are delivered but don't have a rating email sent yet
    const ordersWithoutRating = await db.select()
      .from(orders)
      .leftJoin(orderRatings, eq(orders.id, orderRatings.orderId))
      .where(
        and(
          eq(orders.status, 'delivered'),
          or(
            isNotNull(orderRatings.feedbackEmailSent),
            eq(orderRatings.feedbackEmailSent, false)
          )
        )
      );

    return ordersWithoutRating.map(row => row.orders);
  }

  async updateOrderRatingEmailStatus(orderId: number, sent: boolean): Promise<void> {
    // First check if a rating record exists for this order
    const existingRating = await this.getOrderRating(orderId);
    
    if (existingRating) {
      // Update existing record
      await this.updateOrderRating(existingRating.id, {
        feedbackEmailSent: sent,
        feedbackEmailSentAt: sent ? new Date() : null
      });
    } else {
      // Create a new rating record just to track email status
      await this.createOrderRating({
        orderId,
        overallRating: 0, // Will be updated when user actually rates
        feedbackEmailSent: sent,
        feedbackEmailSentAt: sent ? new Date() : null
      });
    }
  }

  // Admin methods
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<void> {
    await db.update(categories).set(updates).where(eq(categories.id, id));
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async createCake(insertCake: InsertCake): Promise<Cake> {
    const [cake] = await db.insert(cakes).values(insertCake).returning();
    return cake;
  }

  async updateCake(id: number, updates: Partial<Cake>): Promise<void> {
    await db.update(cakes).set(updates).where(eq(cakes.id, id));
  }

  async deleteCake(id: number): Promise<void> {
    await db.delete(cakes).where(eq(cakes.id, id));
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.status, status))
      .orderBy(desc(orders.createdAt));
  }

  async createPromoCode(insertPromoCode: InsertPromoCode): Promise<PromoCode> {
    const [promo] = await db.insert(promoCodes).values({
      ...insertPromoCode,
      usedCount: 0
    }).returning();
    return promo;
  }

  async updatePromoCode(id: number, updates: Partial<PromoCode>): Promise<void> {
    await db.update(promoCodes).set(updates).where(eq(promoCodes.id, id));
  }

  async deletePromoCode(id: number): Promise<void> {
    await db.delete(promoCodes).where(eq(promoCodes.id, id));
  }

  async getAllPromoCodes(): Promise<PromoCode[]> {
    return await db.select().from(promoCodes).orderBy(promoCodes.code);
  }

  async createAddon(insertAddon: InsertAddon): Promise<Addon> {
    const [addon] = await db.insert(addons).values(insertAddon).returning();
    return addon;
  }

  async updateAddon(id: number, updates: Partial<Addon>): Promise<void> {
    await db.update(addons).set(updates).where(eq(addons.id, id));
  }

  async deleteAddon(id: number): Promise<void> {
    await db.delete(addons).where(eq(addons.id, id));
  }

  // Event reminders management
  async createEventReminder(insertEventReminder: InsertEventReminder): Promise<EventReminder> {
    const [reminder] = await db.insert(eventReminders).values(insertEventReminder).returning();
    return reminder;
  }

  async getUserEventReminders(userId: number): Promise<EventReminder[]> {
    return await db.select().from(eventReminders).where(eq(eventReminders.userId, userId));
  }

  async getPendingReminders(): Promise<EventReminder[]> {
    const now = new Date();
    return await db.select().from(eventReminders)
      .where(and(
        eq(eventReminders.isProcessed, false),
        eq(eventReminders.notificationSent, false)
      ));
  }

  async updateEventReminder(id: number, updates: Partial<EventReminder>): Promise<void> {
    await db.update(eventReminders).set(updates).where(eq(eventReminders.id, id));
  }

  async deleteEventReminder(id: number): Promise<void> {
    await db.delete(eventReminders).where(eq(eventReminders.id, id));
  }

  // OTP verification methods
  async createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification> {
    const [newOtp] = await db.insert(otpVerifications).values(otp).returning();
    return newOtp;
  }

  async verifyOtp(phone: string, otp: string): Promise<OtpVerification | null> {
    const [verification] = await db.select().from(otpVerifications)
      .where(and(
        eq(otpVerifications.phone, phone),
        eq(otpVerifications.otp, otp),
        eq(otpVerifications.isUsed, false)
      ));
    
    if (verification && verification.expiresAt > new Date()) {
      // Mark as used
      await db.update(otpVerifications)
        .set({ isUsed: true })
        .where(eq(otpVerifications.id, verification.id));
      return verification;
    }
    
    return null;
  }

  async cleanupExpiredOtp(): Promise<void> {
    const now = new Date();
    await db.delete(otpVerifications).where(eq(otpVerifications.expiresAt, now));
  }

  // Loyalty Program implementations
  async updateUserLoyalty(userId: number, pointsToAdd: number, orderAmount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const newPoints = (user.loyaltyPoints || 0) + pointsToAdd;
    const newTotalSpent = parseFloat(user.totalSpent || "0") + orderAmount;
    const newOrderCount = (user.orderCount || 0) + 1;

    // Determine tier based on total spent
    let newTier = "Bronze";
    if (newTotalSpent >= 50000) newTier = "Platinum";
    else if (newTotalSpent >= 20000) newTier = "Gold";
    else if (newTotalSpent >= 5000) newTier = "Silver";

    await db.update(users)
      .set({
        loyaltyPoints: newPoints,
        totalSpent: newTotalSpent.toString(),
        orderCount: newOrderCount,
        loyaltyTier: newTier,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getUserLoyaltyStats(userId: number): Promise<User | undefined> {
    return this.getUser(userId);
  }

  async createLoyaltyTransaction(insertTransaction: InsertLoyaltyTransaction): Promise<LoyaltyTransaction> {
    const transactionData = {
      ...insertTransaction,
      createdAt: new Date()
    };
    const [transaction] = await db.insert(loyaltyTransactions).values(transactionData).returning();
    return transaction;
  }

  async getUserLoyaltyTransactions(userId: number, limit: number = 50): Promise<LoyaltyTransaction[]> {
    return db.select().from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.userId, userId))
      .orderBy(desc(loyaltyTransactions.createdAt))
      .limit(limit);
  }

  async getLoyaltyRewards(userTier?: string): Promise<LoyaltyReward[]> {
    const query = db.select().from(loyaltyRewards).where(eq(loyaltyRewards.isActive, true));
    
    if (userTier) {
      const tierOrder = { "Bronze": 1, "Silver": 2, "Gold": 3, "Platinum": 4 };
      const userTierLevel = tierOrder[userTier as keyof typeof tierOrder] || 1;
      
      return query.then(rewards => 
        rewards.filter(reward => {
          const rewardTierLevel = tierOrder[reward.minTier as keyof typeof tierOrder] || 1;
          return rewardTierLevel <= userTierLevel;
        })
      );
    }
    
    return query;
  }

  async getLoyaltyReward(id: number): Promise<LoyaltyReward | undefined> {
    const [reward] = await db.select().from(loyaltyRewards).where(eq(loyaltyRewards.id, id));
    return reward || undefined;
  }

  async createLoyaltyReward(insertReward: InsertLoyaltyReward): Promise<LoyaltyReward> {
    const rewardData = {
      ...insertReward,
      createdAt: new Date()
    };
    const [reward] = await db.insert(loyaltyRewards).values(rewardData).returning();
    return reward;
  }

  async updateLoyaltyReward(id: number, updates: Partial<LoyaltyReward>): Promise<void> {
    await db.update(loyaltyRewards)
      .set(updates)
      .where(eq(loyaltyRewards.id, id));
  }

  async deleteLoyaltyReward(id: number): Promise<void> {
    await db.delete(loyaltyRewards).where(eq(loyaltyRewards.id, id));
  }

  async redeemReward(userId: number, rewardId: number): Promise<UserReward> {
    const reward = await this.getLoyaltyReward(rewardId);
    const user = await this.getUser(userId);
    
    if (!reward || !user) {
      throw new Error("Reward or user not found");
    }

    if ((user.loyaltyPoints || 0) < reward.pointsCost) {
      throw new Error("Insufficient points");
    }

    // Generate unique code
    const code = `REWARD${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
    
    // Create user reward
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (reward.validityDays || 30));
    
    const userRewardData = {
      userId,
      rewardId,
      code,
      expiresAt,
      createdAt: new Date()
    };
    
    const [userReward] = await db.insert(userRewards).values(userRewardData).returning();
    
    // Deduct points from user
    await db.update(users)
      .set({
        loyaltyPoints: (user.loyaltyPoints || 0) - reward.pointsCost,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    // Create transaction record
    await this.createLoyaltyTransaction({
      userId,
      type: 'redeemed',
      points: -reward.pointsCost,
      description: `Redeemed: ${reward.title}`
    });
    
    // Update reward redemption count
    await db.update(loyaltyRewards)
      .set({
        currentRedemptions: (reward.currentRedemptions || 0) + 1
      })
      .where(eq(loyaltyRewards.id, rewardId));
    
    return userReward;
  }

  async getUserRewards(userId: number): Promise<UserReward[]> {
    return db.select().from(userRewards)
      .where(eq(userRewards.userId, userId))
      .orderBy(desc(userRewards.createdAt));
  }

  async getUserReward(code: string): Promise<UserReward | undefined> {
    const [userReward] = await db.select().from(userRewards).where(eq(userRewards.code, code));
    return userReward || undefined;
  }

  async useUserReward(code: string): Promise<void> {
    const userReward = await this.getUserReward(code);
    if (!userReward) {
      throw new Error("Reward not found");
    }
    
    if (userReward.isUsed) {
      throw new Error("Reward already used");
    }
    
    if (userReward.expiresAt < new Date()) {
      throw new Error("Reward expired");
    }
    
    await db.update(userRewards)
      .set({
        isUsed: true,
        usedAt: new Date()
      })
      .where(eq(userRewards.code, code));
  }

  async getEventReminder(id: number): Promise<EventReminder | undefined> {
    const [reminder] = await db.select().from(eventReminders).where(eq(eventReminders.id, id));
    return reminder || undefined;
  }

  async getUsersWithUpcomingEvents(): Promise<User[]> {
    return db.select().from(users)
      .where(
        or(
          isNotNull(users.birthday),
          isNotNull(users.anniversary)
        )
      );
  }

  async getUsersWithEventDates(): Promise<User[]> {
    return db.select().from(users)
      .where(
        or(
          isNotNull(users.birthday),
          isNotNull(users.anniversary)
        )
      );
  }

  // Invoice Management
  async getAllInvoices(): Promise<Invoice[]> {
    return db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  // Wallet Management
  async getUserWalletBalance(userId: number): Promise<string> {
    const user = await this.getUser(userId);
    return user?.walletBalance || "0";
  }

  async addWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const transactionData = {
      ...transaction,
      createdAt: new Date()
    };
    const [newTransaction] = await db.insert(walletTransactions).values(transactionData).returning();
    return newTransaction;
  }

  async getUserWalletTransactions(userId: number, limit: number = 50): Promise<WalletTransaction[]> {
    return db.select().from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit);
  }

  async updateUserWalletBalance(userId: number, amount: number, type: string, description: string, adminId?: number, orderId?: number): Promise<WalletTransaction> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentBalance = parseFloat(user.walletBalance || "0");
    const newBalance = type === 'credit' || type === 'refund' || type === 'cashback' || type === 'admin_credit' 
      ? currentBalance + amount 
      : currentBalance - amount;

    if (newBalance < 0 && (type === 'debit' || type === 'admin_debit')) {
      throw new Error("Insufficient wallet balance");
    }

    // Update user's wallet balance
    await db.update(users)
      .set({
        walletBalance: newBalance.toString(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Create transaction record
    const transaction = await this.addWalletTransaction({
      userId,
      type,
      amount: amount.toString(),
      description,
      orderId,
      adminId,
      balanceAfter: newBalance.toString()
    });

    return transaction;
  }

  // Admin Configuration Management
  async getAdminConfig(key: string): Promise<AdminConfig | undefined> {
    const [config] = await db.select().from(adminConfigs).where(eq(adminConfigs.key, key));
    return config || undefined;
  }

  async setAdminConfig(config: InsertAdminConfig): Promise<AdminConfig> {
    const configData = {
      ...config,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Try to update existing config first
    const existing = await this.getAdminConfig(config.key);
    if (existing) {
      await db.update(adminConfigs)
        .set({
          value: config.value,
          type: config.type,
          description: config.description,
          category: config.category,
          updatedBy: config.updatedBy,
          updatedAt: new Date()
        })
        .where(eq(adminConfigs.key, config.key));
      return { ...existing, ...config, updatedAt: new Date() };
    } else {
      const [newConfig] = await db.insert(adminConfigs).values(configData).returning();
      return newConfig;
    }
  }

  async getAllAdminConfigs(): Promise<AdminConfig[]> {
    return db.select().from(adminConfigs).orderBy(adminConfigs.category, adminConfigs.key);
  }

  async updateAdminConfig(key: string, value: string, updatedBy?: number): Promise<void> {
    await db.update(adminConfigs)
      .set({
        value,
        updatedBy,
        updatedAt: new Date()
      })
      .where(eq(adminConfigs.key, key));
  }

  async deleteAdminConfig(key: string): Promise<void> {
    await db.delete(adminConfigs).where(eq(adminConfigs.key, key));
  }

  // Delivery Boys Management
  async createDeliveryBoy(deliveryBoy: InsertDeliveryBoy): Promise<DeliveryBoy> {
    const deliveryBoyData = {
      ...deliveryBoy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const [newDeliveryBoy] = await db.insert(deliveryBoys).values(deliveryBoyData).returning();
    return newDeliveryBoy;
  }

  async getDeliveryBoy(id: number): Promise<DeliveryBoy | undefined> {
    const [deliveryBoy] = await db.select().from(deliveryBoys).where(eq(deliveryBoys.id, id));
    return deliveryBoy || undefined;
  }

  async getDeliveryBoyByPhone(phone: string): Promise<DeliveryBoy | undefined> {
    const [deliveryBoy] = await db.select().from(deliveryBoys).where(eq(deliveryBoys.phone, phone));
    return deliveryBoy || undefined;
  }

  async getAllDeliveryBoys(): Promise<DeliveryBoy[]> {
    return db.select().from(deliveryBoys).orderBy(deliveryBoys.name);
  }

  async getActiveDeliveryBoys(): Promise<DeliveryBoy[]> {
    return db.select().from(deliveryBoys)
      .where(eq(deliveryBoys.isActive, true))
      .orderBy(deliveryBoys.name);
  }

  async updateDeliveryBoy(id: number, updates: Partial<DeliveryBoy>): Promise<void> {
    await db.update(deliveryBoys)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(deliveryBoys.id, id));
  }

  async deleteDeliveryBoy(id: number): Promise<void> {
    await db.delete(deliveryBoys).where(eq(deliveryBoys.id, id));
  }

  // Order assignment to delivery boys
  async assignOrderToDeliveryBoy(orderId: number, deliveryBoyId: number): Promise<void> {
    await db.update(orders)
      .set({
        deliveryBoyId,
        assignedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));
  }

  async getDeliveryBoyOrders(deliveryBoyId: number, status?: string): Promise<Order[]> {
    if (status) {
      return db.select().from(orders)
        .where(and(eq(orders.deliveryBoyId, deliveryBoyId), eq(orders.status, status)))
        .orderBy(desc(orders.createdAt));
    }
    
    return db.select().from(orders)
      .where(eq(orders.deliveryBoyId, deliveryBoyId))
      .orderBy(desc(orders.createdAt));
  }

  async updateOrderAssignment(orderId: number, status: string, deliveryBoyId?: number): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'out_for_delivery' && deliveryBoyId) {
      updateData.pickedUpAt = new Date();
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId));
  }

}

export const storage = new DatabaseStorage();