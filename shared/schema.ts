import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().unique(),
  name: text("name"), // User's display name
  role: text("role").default("customer"), // customer, admin, vendor
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
  // Wallet fields
  walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  parentId: integer("parent_id").references(() => categories.id),
  isActive: boolean("is_active").default(true),
  showOnHomepage: boolean("show_on_homepage").default(true),
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
  isPhotoCake: boolean("is_photo_cake").default(false),
  backgroundImage: text("background_image"),
  photoPreviewShape: text("photo_preview_shape").default("circle"), // circle, heart, square
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
  images: jsonb("images").$type<string[]>().default([]),
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
    photoCustomization?: {
      uploadedImage?: string;
      customText?: string;
      imagePosition?: { x: number; y: number };
      textPosition?: { x: number; y: number };
      imageSize?: number;
      backgroundImage?: string;
      compositeImage?: string; // Generated final image combining background + user photo + text
    };
    price: number;
    addons?: Array<{ id: number; name: string; price: number; quantity: number; customInput?: string; images?: string[] }>;
  }>>().notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, preparing, out_for_delivery, delivered, cancelled
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed, refunded
  paymentMethod: text("payment_method"), // upi, card, cod, phonepe
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
  deliveryOccasion: text("delivery_occasion"), // birthday, anniversary, wedding, etc.
  relation: text("relation"), // mother, father, friend, etc.
  senderName: text("sender_name"), // name of person sending the cake
  specialInstructions: text("special_instructions"),
  promoCode: text("promo_code"),
  deliveryBoyId: integer("delivery_boy_id").references(() => deliveryBoys.id), // assigned delivery boy
  assignedAt: timestamp("assigned_at"), // when delivery boy was assigned
  pickedUpAt: timestamp("picked_up_at"), // when delivery boy picked up the order
  deliveredAt: timestamp("delivered_at"), // when order was delivered
  vendorId: integer("vendor_id").references(() => vendors.id), // assigned vendor for order processing
  vendorPrice: decimal("vendor_price", { precision: 10, scale: 2 }), // price set by admin for vendor
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

// Order Ratings - Specifically for post-delivery feedback
export const orderRatings = pgTable("order_ratings", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  
  // Overall Experience Rating
  overallRating: integer("overall_rating").notNull(), // 1-5 stars
  
  // Specific Ratings
  tasteRating: integer("taste_rating"), // 1-5 stars
  qualityRating: integer("quality_rating"), // 1-5 stars
  deliveryRating: integer("delivery_rating"), // 1-5 stars
  packagingRating: integer("packaging_rating"), // 1-5 stars
  
  // Comments
  comment: text("comment"),
  improvements: text("improvements"), // What could be improved
  
  // Would recommend?
  wouldRecommend: boolean("would_recommend").default(true),
  
  // Delivery Boy Rating (if applicable)
  deliveryBoyRating: integer("delivery_boy_rating"), // 1-5 stars
  deliveryBoyComment: text("delivery_boy_comment"),
  
  // Email tracking
  feedbackEmailSent: boolean("feedback_email_sent").default(false),
  feedbackEmailSentAt: timestamp("feedback_email_sent_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventReminders = pgTable("event_reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  eventType: text("event_type").notNull(), // 'birthday', 'anniversary', 'christmas', etc.
  eventDate: text("event_date").notNull(), // MM-DD format
  relationshipType: text("relationship_type"), // 'son', 'mother', etc.
  title: text("title"), // User-entered reminder title like "Mom's Birthday"
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

// Invoice System
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  
  // Customer Information
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone").notNull(),
  
  // Billing Address
  billingAddress: jsonb("billing_address").$type<{
    address: string;
    pincode: string;
    city: string;
    landmark?: string;
  }>().notNull(),
  
  // Invoice Items
  items: jsonb("items").$type<Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRate?: number;
    taxAmount?: number;
  }>>().notNull(),
  
  // Financial Details
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Invoice Status
  status: text("status").notNull().default("draft"), // draft, sent, paid, cancelled
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, partially_paid, overdue
  paymentMethod: text("payment_method"), // upi, card, cod, bank_transfer, phonepe
  
  // Dates
  invoiceDate: timestamp("invoice_date").defaultNow(),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  
  // Additional Fields
  notes: text("notes"),
  terms: text("terms"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// PhonePe Transactions
export const phonepeTransactions = pgTable("phonepe_transactions", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  merchantTransactionId: text("merchant_transaction_id").notNull().unique(),
  phonepeTransactionId: text("phonepe_transaction_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, success, failed, cancelled
  responseCode: text("response_code"),
  responseMessage: text("response_message"),
  paymentMethod: text("payment_method"), // UPI, CARD, NET_BANKING, WALLET
  paymentInstrument: jsonb("payment_instrument").$type<{
    type: string;
    utr?: string;
    maskedAccountNumber?: string;
    maskedMobileNumber?: string;
    bankId?: string;
    pgTransactionId?: string;
    pgAuthorizationCode?: string;
    arn?: string;
  }>(),
  checkoutRequestId: text("checkout_request_id"),
  redirectUrl: text("redirect_url"),
  callbackUrl: text("callback_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wallet Transactions
export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'credit', 'debit', 'refund', 'cashback', 'admin_credit', 'admin_debit'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  orderId: integer("order_id").references(() => orders.id), // Optional: link to order
  adminId: integer("admin_id").references(() => users.id), // Admin who made the transaction
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vendors
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  businessName: text("business_name"),
  businessAddress: text("business_address"),
  businessLicense: text("business_license"),
  gstNumber: text("gst_number"),
  panNumber: text("pan_number"),
  bankDetails: jsonb("bank_details").$type<{
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
    accountHolderName: string;
  }>(),
  isActive: boolean("is_active").default(false), // Admin approval required
  isVerified: boolean("is_verified").default(false), // Document verification
  approvedBy: integer("approved_by").references(() => users.id), // Admin who approved
  approvedAt: timestamp("approved_at"),
  totalOrdersProcessed: integer("total_orders_processed").default(0),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
  commission: decimal("commission", { precision: 5, scale: 2 }).default("10.00"), // Commission percentage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Delivery Boys
export const deliveryBoys = pgTable("delivery_boys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  password: text("password").notNull(),
  vehicleType: text("vehicle_type").notNull(), // 'bike', 'scooter', 'car', 'bicycle'
  vehicleNumber: text("vehicle_number").notNull(),
  address: text("address").notNull(),
  pincode: text("pincode").notNull(),
  isActive: boolean("is_active").default(true),
  totalDeliveries: integer("total_deliveries").default(0),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Push Subscriptions for delivery boys
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  deliveryBoyId: integer("delivery_boy_id").references(() => deliveryBoys.id).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin Configuration
export const adminConfigs = pgTable("admin_configs", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  type: text("type").notNull().default("string"), // 'string', 'number', 'boolean', 'json'
  description: text("description"),
  category: text("category").default("general"), // 'general', 'wallet', 'loyalty', 'orders', 'email'
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pages for static content management
export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  isPublished: boolean("is_published").default(true),
  showInMenu: boolean("show_in_menu").default(false),
  menuOrder: integer("menu_order").default(0),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Navigation Items
export const navigationItems = pgTable("navigation_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug"), // Optional - auto-generated from name if empty
  url: text("url"), // Optional - auto-generated from category/name if empty
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").default(true),
  isNew: boolean("is_new").default(false), // Shows "New" badge
  categoryId: integer("category_id").references(() => categories.id), // Optional link to category
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof insertUserSchema._type;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof insertCategorySchema._type;
export type Cake = typeof cakes.$inferSelect;
export type InsertCake = typeof insertCakeSchema._type;
export type Addon = typeof addons.$inferSelect;
export type InsertAddon = typeof insertAddonSchema._type;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof insertOrderSchema._type;
export type DeliveryArea = typeof deliveryAreas.$inferSelect;
export type InsertDeliveryArea = typeof insertDeliveryAreaSchema._type;
export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof insertPromoCodeSchema._type;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof insertReviewSchema._type;
export type OrderRating = typeof orderRatings.$inferSelect;
export type InsertOrderRating = typeof insertOrderRatingSchema._type;
export type EventReminder = typeof eventReminders.$inferSelect;
export type InsertEventReminder = typeof insertEventReminderSchema._type;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = typeof insertOtpVerificationSchema._type;
export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type InsertLoyaltyTransaction = typeof insertLoyaltyTransactionSchema._type;
export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;
export type InsertLoyaltyReward = typeof insertLoyaltyRewardSchema._type;
export type UserReward = typeof userRewards.$inferSelect;
export type InsertUserReward = typeof insertUserRewardSchema._type;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof insertInvoiceSchema._type;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof insertWalletTransactionSchema._type;
export type AdminConfig = typeof adminConfigs.$inferSelect;
export type InsertAdminConfig = typeof insertAdminConfigSchema._type;
export type DeliveryBoy = typeof deliveryBoys.$inferSelect;
export type InsertDeliveryBoy = typeof insertDeliveryBoySchema._type;
export type NavigationItem = typeof navigationItems.$inferSelect;
export type InsertNavigationItem = typeof insertNavigationItemSchema._type;
export type Page = typeof pages.$inferSelect;
export type InsertPage = typeof insertPageSchema._type;
export type PhonePeTransaction = typeof phonepeTransactions.$inferSelect;
export type InsertPhonePeTransaction = typeof insertPhonePeTransactionSchema._type;

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
export const insertOrderRatingSchema = createInsertSchema(orderRatings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEventReminderSchema = createInsertSchema(eventReminders).omit({ id: true, createdAt: true });
export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).omit({ id: true, createdAt: true });
export const insertDeliveryBoySchema = createInsertSchema(deliveryBoys).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });

// Loyalty Program insert schemas
export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions).omit({ id: true, createdAt: true });
export const insertLoyaltyRewardSchema = createInsertSchema(loyaltyRewards).omit({ id: true, createdAt: true });
export const insertUserRewardSchema = createInsertSchema(userRewards).omit({ id: true, createdAt: true });

// Invoice insert schema
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, invoiceNumber: true, createdAt: true, updatedAt: true });

// Wallet and Admin Config insert schemas
export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({ id: true, createdAt: true });
export const insertAdminConfigSchema = createInsertSchema(adminConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNavigationItemSchema = createInsertSchema(navigationItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPageSchema = createInsertSchema(pages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPhonePeTransactionSchema = createInsertSchema(phonepeTransactions).omit({ id: true, createdAt: true, updatedAt: true });

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

// Vendor schemas
export const vendorRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  businessName: z.string().min(2, 'Business name is required').optional(),
  businessAddress: z.string().min(10, 'Business address is required').optional(),
  businessLicense: z.string().optional(),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number').optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number').optional(),
  address: z.string().optional(),
  description: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export type VendorRegisterRequest = z.infer<typeof vendorRegisterSchema>;

export const vendorLoginSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

// Delivery Boy schemas
export const deliveryBoyLoginSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const deliveryBoyRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  vehicleType: z.enum(['bike', 'scooter', 'car', 'bicycle']),
  vehicleNumber: z.string().min(1, 'Vehicle number is required'),
  licenseNumber: z.string().optional(),
  address: z.string().min(10, 'Complete address is required'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Simplified schema for admin to register delivery boys
export const adminDeliveryBoyRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  vehicleType: z.enum(['bike', 'scooter', 'car']),
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
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number').optional(),
  birthday: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, 'Birthday must be in MM-DD format').optional(),
  anniversary: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, 'Anniversary must be in MM-DD format').optional(),
});

// Order Rating schema
export const orderRatingSchema = z.object({
  orderId: z.number().positive('Order ID is required'),
  overallRating: z.number().min(1, 'Overall rating is required').max(5, 'Rating must be between 1 and 5'),
  tasteRating: z.number().min(1).max(5).optional(),
  qualityRating: z.number().min(1).max(5).optional(),
  deliveryRating: z.number().min(1).max(5).optional(),
  packagingRating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  improvements: z.string().optional(),
  wouldRecommend: z.boolean().default(true),
  deliveryBoyRating: z.number().min(1).max(5).optional(),
  deliveryBoyComment: z.string().optional(),
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
export type OrderRating = typeof orderRatings.$inferSelect;
export type InsertOrderRating = z.infer<typeof insertOrderRatingSchema>;
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

// Invoice types
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

// Wallet and Admin Config types
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type DeliveryBoy = typeof deliveryBoys.$inferSelect;
export type InsertDeliveryBoy = z.infer<typeof insertDeliveryBoySchema>;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

export type AdminConfig = typeof adminConfigs.$inferSelect;
export type InsertAdminConfig = z.infer<typeof insertAdminConfigSchema>;
