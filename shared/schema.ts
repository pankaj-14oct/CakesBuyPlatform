import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  addresses: jsonb("addresses").$type<Array<{
    type: 'home' | 'work' | 'other';
    address: string;
    pincode: string;
    city: string;
    isDefault?: boolean;
  }>>().default([]),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertCakeSchema = createInsertSchema(cakes).omit({ id: true });
export const insertAddonSchema = createInsertSchema(addons).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, orderNumber: true, createdAt: true, updatedAt: true });
export const insertDeliveryAreaSchema = createInsertSchema(deliveryAreas).omit({ id: true });
export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({ id: true, usedCount: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });

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
