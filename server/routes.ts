import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertOrderSchema, 
  insertCategorySchema, 
  insertCakeSchema, 
  insertAddonSchema, 
  insertPromoCodeSchema,
  insertEventReminderSchema,
  loginSchema,
  registerSchema,
  addressSchema,
  profileUpdateSchema,
  sendOtpSchema,
  verifyOtpSchema,
  otpRegisterSchema
} from "@shared/schema";
import { 
  generateToken, 
  hashPassword, 
  comparePasswords, 
  authenticateToken, 
  optionalAuth, 
  type AuthRequest 
} from "./auth";

// Helper function to create event reminders
async function createEventReminder(userId: number, eventType: 'birthday' | 'anniversary', eventDate: string) {
  const currentYear = new Date().getFullYear();
  const [month, day] = eventDate.split('-');
  
  // Calculate reminder date (7 days before event)
  const eventDateThisYear = new Date(currentYear, parseInt(month) - 1, parseInt(day));
  const reminderDate = new Date(eventDateThisYear);
  reminderDate.setDate(reminderDate.getDate() - 7);
  
  // If the reminder date has passed this year, set for next year
  if (reminderDate < new Date()) {
    eventDateThisYear.setFullYear(currentYear + 1);
    reminderDate.setFullYear(currentYear + 1);
  }
  
  await storage.createEventReminder({
    userId,
    eventType,
    eventDate,
    reminderDate,
    isProcessed: false,
    notificationSent: false
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Cakes
  app.get("/api/cakes", async (req, res) => {
    try {
      const { categoryId, isEggless, isBestseller, search } = req.query;
      
      if (search) {
        const cakes = await storage.searchCakes(search as string);
        return res.json(cakes);
      }

      const filters: any = {};
      if (categoryId) filters.categoryId = parseInt(categoryId as string);
      if (isEggless !== undefined) filters.isEggless = isEggless === 'true';
      if (isBestseller !== undefined) filters.isBestseller = isBestseller === 'true';

      const cakes = await storage.getCakes(filters);
      res.json(cakes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cakes" });
    }
  });

  app.get("/api/cakes/:slug", async (req, res) => {
    try {
      const cake = await storage.getCakeBySlug(req.params.slug);
      if (!cake) {
        return res.status(404).json({ message: "Cake not found" });
      }
      res.json(cake);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cake" });
    }
  });

  // Addons
  app.get("/api/addons", async (req, res) => {
    try {
      const { category } = req.query;
      
      if (category) {
        const addons = await storage.getAddonsByCategory(category as string);
        return res.json(addons);
      }

      const addons = await storage.getAddons();
      res.json(addons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch addons" });
    }
  });

  // Delivery areas
  app.get("/api/delivery-areas", async (req, res) => {
    try {
      const areas = await storage.getDeliveryAreas();
      res.json(areas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch delivery areas" });
    }
  });

  app.get("/api/delivery-areas/check/:pincode", async (req, res) => {
    try {
      const area = await storage.checkDeliveryArea(req.params.pincode);
      if (!area) {
        return res.status(404).json({ 
          available: false, 
          message: "Delivery not available in this area" 
        });
      }
      res.json({ 
        available: true, 
        area,
        message: `Delivery available in ${area.name}` 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check delivery area" });
    }
  });

  // Promo codes
  app.post("/api/promo-codes/validate", async (req, res) => {
    try {
      const { code, orderValue } = req.body;
      
      if (!code || !orderValue) {
        return res.status(400).json({ message: "Code and order value are required" });
      }

      const validation = await storage.validatePromoCode(code, orderValue);
      res.json(validation);
    } catch (error) {
      res.status(500).json({ message: "Failed to validate promo code" });
    }
  });

  // Orders (with optional authentication)
  app.post("/api/orders", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      
      // If user is authenticated, associate order with user
      if (req.user) {
        orderData.userId = req.user.id;
      }
      
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/auth/orders", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orders = await storage.getUserOrders(req.user!.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user orders" });
    }
  });

  app.get("/api/orders/:orderNumber", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const order = await storage.getOrderByNumber(req.params.orderNumber);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const orderId = parseInt(req.params.id);
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      await storage.updateOrderStatus(orderId, status);
      res.json({ message: "Order status updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Reviews
  app.get("/api/cakes/:id/reviews", async (req, res) => {
    try {
      const cakeId = parseInt(req.params.id);
      const reviews = await storage.getCakeReviews(cakeId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // User Profile Management
  app.get("/api/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password in response
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const updateData = profileUpdateSchema.parse(req.body);
      await storage.updateUser(req.user!.id, updateData);
      
      // Create event reminders for birthday and anniversary if provided
      if (updateData.birthday) {
        await createEventReminder(req.user!.id, 'birthday', updateData.birthday);
      }
      if (updateData.anniversary) {
        await createEventReminder(req.user!.id, 'anniversary', updateData.anniversary);
      }
      
      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Event Reminders
  app.get("/api/reminders", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const reminders = await storage.getUserEventReminders(req.user!.id);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.post("/api/reminders", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const reminderData = insertEventReminderSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      const reminder = await storage.createEventReminder(reminderData);
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reminder data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  app.delete("/api/reminders/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventReminder(id);
      res.json({ message: "Reminder deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });

  // Admin API Routes
  
  // Admin Categories
  app.post("/api/admin/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/admin/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.updateCategory(id, req.body);
      res.json({ message: "Category updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Admin Cakes
  app.post("/api/admin/cakes", async (req, res) => {
    try {
      const cakeData = insertCakeSchema.parse(req.body);
      const cake = await storage.createCake(cakeData);
      res.status(201).json(cake);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cake data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create cake" });
    }
  });

  app.put("/api/admin/cakes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.updateCake(id, req.body);
      res.json({ message: "Cake updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update cake" });
    }
  });

  app.delete("/api/admin/cakes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCake(id);
      res.json({ message: "Cake deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete cake" });
    }
  });

  // Admin Orders
  app.get("/api/admin/orders", async (req, res) => {
    try {
      const { status } = req.query;
      
      if (status) {
        const orders = await storage.getOrdersByStatus(status as string);
        return res.json(orders);
      }

      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Admin Promo Codes
  app.get("/api/admin/promo-codes", async (req, res) => {
    try {
      const promoCodes = await storage.getAllPromoCodes();
      res.json(promoCodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch promo codes" });
    }
  });

  app.post("/api/admin/promo-codes", async (req, res) => {
    try {
      const promoData = insertPromoCodeSchema.parse(req.body);
      const promoCode = await storage.createPromoCode(promoData);
      res.status(201).json(promoCode);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid promo code data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create promo code" });
    }
  });

  app.put("/api/admin/promo-codes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.updatePromoCode(id, req.body);
      res.json({ message: "Promo code updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update promo code" });
    }
  });

  app.delete("/api/admin/promo-codes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePromoCode(id);
      res.json({ message: "Promo code deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete promo code" });
    }
  });

  // Admin Add-ons
  app.post("/api/admin/addons", async (req, res) => {
    try {
      const addonData = insertAddonSchema.parse(req.body);
      const addon = await storage.createAddon(addonData);
      res.status(201).json(addon);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid addon data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create addon" });
    }
  });

  app.put("/api/admin/addons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.updateAddon(id, req.body);
      res.json({ message: "Addon updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update addon" });
    }
  });

  app.delete("/api/admin/addons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAddon(id);
      res.json({ message: "Addon deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete addon" });
    }
  });

  // Admin Data Management
  app.post("/api/admin/import-dummy-data", async (req, res) => {
    try {
      const { importDummyData } = await import("./dummy-data-fixed");
      const result = await importDummyData();
      res.json({ 
        message: "Dummy data imported successfully", 
        data: result 
      });
    } catch (error) {
      console.error("Import dummy data error:", error);
      res.status(500).json({ message: "Failed to import dummy data" });
    }
  });

  app.delete("/api/admin/clear-data", async (req, res) => {
    try {
      const { clearAllData } = await import("./dummy-data-fixed");
      const result = await clearAllData();
      res.json(result);
    } catch (error) {
      console.error("Clear data error:", error);
      res.status(500).json({ message: "Failed to clear data" });
    }
  });

  // OTP Authentication Routes
  
  // Send OTP for registration
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phone } = sendOtpSchema.parse(req.body);
      
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set expiry time (5 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);
      
      // Store OTP in database
      await storage.createOtpVerification({
        phone,
        otp,
        expiresAt,
        isUsed: false
      });
      
      // In a real app, you would send the OTP via SMS here
      // For demo purposes, we'll return it in the response
      console.log(`OTP for ${phone}: ${otp}`);
      
      res.json({ 
        message: "OTP sent successfully",
        // Remove this in production - only for demo
        otp: otp 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid phone number", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  // Verify OTP and register user
  app.post("/api/auth/register-with-otp", async (req, res) => {
    try {
      const { phone, otp, email, password } = otpRegisterSchema.parse(req.body);
      
      // Verify OTP
      const verification = await storage.verifyOtp(phone, otp);
      if (!verification) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      
      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const existingUserByPhone = await storage.getUserByPhone(phone);
      if (existingUserByPhone) {
        return res.status(400).json({ message: "Phone number already registered" });
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        phone,
        addresses: []
      });
      
      // Generate JWT token
      const token = generateToken(newUser.id, newUser.phone, newUser.email);
      
      res.status(201).json({
        message: "Registration successful",
        user: {
          id: newUser.id,
          email: newUser.email,
          phone: newUser.phone
        },
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // Traditional login route (phone/password)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(401).json({ message: "Invalid phone number or password" });
      }
      
      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid phone number or password" });
      }
      
      const token = generateToken(user.id, user.phone, user.email);
      
      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone
        },
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Traditional registration route (phone/email/password)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { phone, email, password } = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const existingUserByPhone = await storage.getUserByPhone(phone);
      if (existingUserByPhone) {
        return res.status(400).json({ message: "Phone number already registered" });
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        phone,
        addresses: []
      });
      
      // Generate JWT token
      const token = generateToken(newUser.id, newUser.phone, newUser.email);
      
      res.status(201).json({
        message: "Registration successful",
        user: {
          id: newUser.id,
          email: newUser.email,
          phone: newUser.phone
        },
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
