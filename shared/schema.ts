import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
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
  eventType: text("event_type").notNull(), // 'birthday' or 'anniversary'
  eventDate: text("event_date").notNull(), // MM-DD format
  reminderDate: timestamp("reminder_date").notNull(),
  isProcessed: boolean("is_processed").default(false),
  notificationSent: boolean("notification_sent").default(false),
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

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Address schemas
export const addressSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Address name is required'),
  type: z.enum(['home', 'office', 'other']),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode'),
  city: z.string().min(2, 'City is required'),
  landmark: z.string().optional(),
  isDefault: z.boolean().default(false)
});

// Profile update schema
export const profileUpdateSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
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
