import {
  users, categories, cakes, addons, orders, deliveryAreas, promoCodes, reviews,
  type User, type InsertUser, type Category, type InsertCategory,
  type Cake, type InsertCake, type Addon, type InsertAddon,
  type Order, type InsertOrder, type DeliveryArea, type InsertDeliveryArea,
  type PromoCode, type InsertPromoCode, type Review, type InsertReview
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;

  // Cakes
  getCakes(filters?: { categoryId?: number; isEggless?: boolean; isBestseller?: boolean }): Promise<Cake[]>;
  getCake(id: number): Promise<Cake | undefined>;
  getCakeBySlug(slug: string): Promise<Cake | undefined>;
  searchCakes(query: string): Promise<Cake[]>;

  // Addons
  getAddons(): Promise<Addon[]>;
  getAddonsByCategory(category: string): Promise<Addon[]>;

  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
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
}

// DatabaseStorage implementation
export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
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

  async searchCakes(query: string): Promise<Cake[]> {
    return await db.select().from(cakes)
      .where(like(cakes.name, `%${query}%`))
      .orderBy(cakes.name);
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
}

export const storage = new DatabaseStorage();