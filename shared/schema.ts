import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().unique(),
  role: text("role").default("customer"), // customer, admin
  birthday: text("birthday"), // Format: MM-DD
  anniversary: text("anniversary"), // Format: MM-DD
  addresses: jsonb("addresses").$type<Array<{
    id: string;
    name: string;
    type: string;
    address: string;
    pincode: string;
    city: string;
    landmark?: string;
    isDefault: boolean;
  }>>().default([]),
  // Loyalty Program fields
  loyaltyPoints: integer("loyalty_points").default(0),
  loyaltyTier: text("loyalty_tier").default("Bronze"), // Bronze, Silver, Gold, Platinum
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
  orderCount: integer("order_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  isActive: boolean("is_active").default(true),
});

export const cakes = pgTable("cakes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  images: jsonb("images").$type<string[]>().default([]),
  flavors: jsonb("flavors").$type<string[]>().default([]),
  weights: jsonb("weights").$type<Array<{ weight: string; price: number }>>().default([]),
  isEggless: boolean("is_eggless").default(false),
  isCustomizable: boolean("is_customizable").default(true),
  isAvailable: boolean("is_available").default(true),
  isBestseller: boolean("is_bestseller").default(false),
  tags: jsonb("tags").$type<string[]>().default([]),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  deliveryOptions: jsonb("delivery_options").$type<{
    sameDay: boolean;
    midnight: boolean;
    scheduled: boolean;
  }>().default({ sameDay: true, midnight: true, scheduled: true }),
});

export const addons = pgTable("addons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category"), // balloons, candles, cards, flowers
  isAvailable: boolean("is_available").default(true),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  orderNumber: text("order_number").notNull().unique(),
  items: jsonb("items").$type<Array<{
    cakeId: number;
    name: string;
    quantity: number;
    weight: string;
    flavor: string;
    customMessage?: string;
    customImage?: string;
    price: number;
    addons?: Array<{ id: number; name: string; price: number; quantity: number }>;
  }>>().notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, preparing, out_for_delivery, delivered, cancelled
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed, refunded
  paymentMethod: text("payment_method"), // upi, card, cod
  deliveryAddress: jsonb("delivery_address").$type<{
    name: string;
    phone: string;
    email?: string;
    address: string;
    pincode: string;
    city: string;
    landmark?: string;
  }>().notNull(),
  deliveryDate: timestamp("delivery_date").notNull(),
  deliveryTime: text("delivery_time"), // morning, afternoon, evening, midnight, specific_time
  specialInstructions: text("special_instructions"),
  promoCode: text("promo_code"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deliveryAreas = pgTable("delivery_areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  pincode: text("pincode").notNull().unique(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  freeDeliveryThreshold: decimal("free_delivery_threshold", { precision: 10, scale: 2 }).default("500"),
  sameDayAvailable: boolean("same_day_available").default(true),
  midnightAvailable: boolean("midnight_available").default(true),
  isActive: boolean("is_active").default(true),
});

export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountType: text("discount_type").notNull(), // percentage, fixed
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderValue: decimal("min_order_value", { precision: 10, scale: 2 }).default("0"),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0),
  isActive: boolean("is_active").default(true),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  cakeId: integer("cake_id").references(() => cakes.id),
  orderId: integer("order_id").references(() => orders.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventReminders = pgTable("event_reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  eventType: text("event_type").notNull(), // 'birthday', 'anniversary', 'christmas', etc.
  eventDate: text("event_date").notNull(), // MM-DD format
  relationshipType: text("relationship_type"), // 'son', 'mother', etc.
  reminderDate: timestamp("reminder_date").notNull(),
  isProcessed: boolean("is_processed").default(false),
  notificationSent: boolean("notification_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  otp: text("otp").notNull(),
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Loyalty Program Tables
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  orderId: integer("order_id").references(() => orders.id),
  type: text("type").notNull(), // 'earned', 'redeemed', 'expired', 'bonus'
  points: integer("points").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const loyaltyRewards = pgTable("loyalty_rewards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  pointsCost: integer("points_cost").notNull(),
  rewardType: text("reward_type").notNull(), // 'discount_percent', 'discount_amount', 'free_item', 'free_delivery'
  rewardValue: decimal("reward_value", { precision: 10, scale: 2 }).notNull(),
  validityDays: integer("validity_days").default(30),
  maxRedemptions: integer("max_redemptions"), // null for unlimited
  currentRedemptions: integer("current_redemptions").default(0),
  minTier: text("min_tier").default("Bronze"), // Minimum tier required
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRewards = pgTable("user_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rewardId: integer("reward_id").references(() => loyaltyRewards.id).notNull(),
  code: text("code").notNull().unique(), // Unique redemption code
  isUsed: boolean("is_used").default(false),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertCakeSchema = createInsertSchema(cakes).omit({ id: true });
export const insertAddonSchema = createInsertSchema(addons).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, orderNumber: true, createdAt: true, updatedAt: true }).extend({
  deliveryDate: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val)
});
export const insertDeliveryAreaSchema = createInsertSchema(deliveryAreas).omit({ id: true });
export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({ id: true, usedCount: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertEventReminderSchema = createInsertSchema(eventReminders).omit({ id: true, createdAt: true });
export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).omit({ id: true, createdAt: true });

// Loyalty Program insert schemas
export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions).omit({ id: true, createdAt: true });
export const insertLoyaltyRewardSchema = createInsertSchema(loyaltyRewards).omit({ id: true, createdAt: true });
export const insertUserRewardSchema = createInsertSchema(userRewards).omit({ id: true, createdAt: true });

// Auth schemas
export const loginSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// OTP schemas
export const sendOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const otpRegisterSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Password reset schemas
export const forgotPasswordSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
});

export const resetPasswordSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Occasion reminder schema
export const occasionReminderSchema = z.object({
  title: z.string().min(1, "Reminder title is required"),
  eventType: z.enum(["birthday", "anniversary"]),
  day: z.string().min(1, "Day is required"),
  month: z.string().min(1, "Month is required"),
});

// Address schemas
export const addressSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Address name is required'),
  type: z.enum(['home', 'work', 'other']),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode'),
  city: z.string().min(2, 'City is required'),
  landmark: z.string().optional(),
  isDefault: z.boolean().default(false)
});

export const createAddressSchema = addressSchema.omit({ id: true });

// Profile update schema
export const profileUpdateSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number').optional(),
  birthday: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, 'Birthday must be in MM-DD format').optional(),
  anniversary: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, 'Anniversary must be in MM-DD format').optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Cake = typeof cakes.$inferSelect;
export type InsertCake = z.infer<typeof insertCakeSchema>;
export type Addon = typeof addons.$inferSelect;
export type InsertAddon = z.infer<typeof insertAddonSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type DeliveryArea = typeof deliveryAreas.$inferSelect;
export type InsertDeliveryArea = z.infer<typeof insertDeliveryAreaSchema>;
export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type EventReminder = typeof eventReminders.$inferSelect;
export type InsertEventReminder = z.infer<typeof insertEventReminderSchema>;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;

// Loyalty Program types
export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;
export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;
export type InsertLoyaltyReward = z.infer<typeof insertLoyaltyRewardSchema>;
export type UserReward = typeof userRewards.$inferSelect;
export type InsertUserReward = z.infer<typeof insertUserRewardSchema>;
