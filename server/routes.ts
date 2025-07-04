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
  insertLoyaltyRewardSchema,
  insertInvoiceSchema,
  loginSchema,
  registerSchema,
  addressSchema,
  createAddressSchema,
  profileUpdateSchema,
  sendOtpSchema,
  verifyOtpSchema,
  otpRegisterSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from "@shared/schema";
import { 
  generateToken, 
  hashPassword, 
  comparePasswords, 
  authenticateToken, 
  optionalAuth, 
  type AuthRequest 
} from "./auth";
import { sendReminderEmail, type ReminderEmailData, sendOrderConfirmationEmail, sendOrderStatusUpdateEmail, type OrderEmailData, sendWelcomeEmail, type WelcomeEmailData } from "./email-service";
import { createInvoiceForOrder, updateInvoiceStatus, getInvoiceByOrderId, getInvoiceByNumber, getUserInvoices, getInvoiceWithOrder, getInvoiceDisplayData } from "./invoice-service";
import type { User } from "@shared/schema";

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
      const { categoryId, isEggless, isBestseller, search, sort, category, price } = req.query;
      
      if (search) {
        const cakes = await storage.searchCakes(search as string, {
          sort: sort as string,
          category: category as string,
          priceRange: price as string
        });
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
      console.log('Order request body:', JSON.stringify(req.body, null, 2));
      console.log('User from token:', req.user);
      
      // Validate the order data
      let orderData;
      try {
        orderData = insertOrderSchema.parse(req.body);
      } catch (validationError: any) {
        console.error('Order validation error:', JSON.stringify(validationError, null, 2));
        if (validationError.errors) {
          console.error('Validation errors:', validationError.errors);
        }
        return res.status(400).json({ 
          message: "Invalid order data", 
          errors: validationError.errors || validationError.message 
        });
      }
      
      // If user is authenticated, associate order with user
      if (req.user) {
        orderData.userId = req.user.id;
      }
      
      const order = await storage.createOrder(orderData);
      
      // Handle partial wallet payment after order creation
      if ((orderData.paymentMethod === 'partial_wallet' || orderData.paymentMethod === 'wallet') && req.user) {
        try {
          const user = await storage.getUser(req.user.id);
          if (!user) {
            throw new Error("User not found");
          }
          
          const userWalletBalance = parseFloat(user.walletBalance || '0');
          const walletAmountUsed = parseFloat((orderData as any).walletAmountUsed || '0');
          
          if (walletAmountUsed > 0) {
            if (userWalletBalance < walletAmountUsed) {
              return res.status(400).json({
                message: "Insufficient wallet balance",
                walletBalance: userWalletBalance,
                required: walletAmountUsed
              });
            }
            
            // Deduct wallet amount from user balance
            await storage.updateUserWalletBalance(
              req.user.id, 
              walletAmountUsed, 
              'debit', 
              `Partial wallet payment for order ${order.orderNumber} (${Math.round((walletAmountUsed / parseFloat(orderData.total)) * 100)}% of order value)`,
              undefined, // adminId 
              order.id   // orderId
            );
          }
          
        } catch (walletError) {
          console.error('Wallet payment failed:', walletError);
          return res.status(500).json({ message: "Wallet payment failed" });
        }
      }
      
      // Award loyalty points if user is authenticated
      if (req.user && orderData.userId) {
        try {
          const orderTotal = parseFloat(order.total);
          // Award 1 point per ₹10 spent (10% back in points)
          const pointsToAward = Math.floor(orderTotal / 10);
          
          if (pointsToAward > 0) {
            // Update user loyalty stats
            await storage.updateUserLoyalty(req.user.id, pointsToAward, orderTotal);
            
            // Create loyalty transaction record
            await storage.createLoyaltyTransaction({
              userId: req.user.id,
              orderId: order.id,
              type: 'earned',
              points: pointsToAward,
              description: `Earned ${pointsToAward} points from order ${order.orderNumber}`
            });
          }
        } catch (loyaltyError) {
          // Don't fail the order if loyalty update fails
          console.error('Failed to update loyalty points:', loyaltyError);
        }
      }

      // Send order confirmation email
      try {
        let customerEmail = order.deliveryAddress.email;
        const customerName = order.deliveryAddress.name;
        
        // If no email in delivery address and user is authenticated, get from user
        if (!customerEmail && req.user) {
          const user = await storage.getUser(req.user.id);
          customerEmail = user?.email;
        }
        
        if (customerEmail) {
          const emailData: OrderEmailData = {
            customerEmail,
            customerName,
            order
          };
          
          await sendOrderConfirmationEmail(emailData);
          console.log(`Order confirmation email sent to ${customerEmail} for order ${order.orderNumber}`);
        }
      } catch (emailError) {
        // Don't fail the order if email fails
        console.error('Failed to send order confirmation email:', emailError);
      }

      // Create invoice for the order
      let invoiceCreated = null;
      try {
        let customerInfo = undefined;
        if (req.user) {
          const user = await storage.getUser(req.user.id);
          customerInfo = {
            name: user?.email ? order.deliveryAddress.name : undefined,
            email: user?.email,
            phone: user?.phone
          };
        }
        
        invoiceCreated = await createInvoiceForOrder(order.id, customerInfo);
        console.log(`Invoice ${invoiceCreated.invoiceNumber} created for order ${order.orderNumber}`);
      } catch (invoiceError) {
        // Don't fail the order if invoice creation fails
        console.error('Failed to create invoice:', invoiceError);
      }
      
      res.status(201).json({ 
        ...order, 
        invoiceNumber: invoiceCreated?.invoiceNumber || null 
      });
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

  app.patch("/api/orders/:id/status", authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log('=== ORDER STATUS UPDATE REQUEST ===');
      console.log('Request body:', req.body);
      console.log('Order ID:', req.params.id);
      console.log('User:', req.user);
      
      const { status } = req.body;
      const orderId = parseInt(req.params.id);
      
      if (!status) {
        console.error('Status validation failed: Status is required');
        return res.status(400).json({ message: "Status is required" });
      }

      const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Update order status
      await storage.updateOrderStatus(orderId, status);
      
      // Get updated order for email
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Send status update email
      try {
        let customerEmail = order.deliveryAddress.email;
        const customerName = order.deliveryAddress.name;
        
        // If no email in delivery address and order has user, get from user
        if (!customerEmail && order.userId) {
          const user = await storage.getUser(order.userId);
          customerEmail = user?.email;
        }
        
        if (customerEmail) {
          const emailData: OrderEmailData = {
            customerEmail,
            customerName,
            order
          };
          
          await sendOrderStatusUpdateEmail(emailData);
          console.log(`Order status email sent to ${customerEmail} for order ${order.orderNumber} (${status})`);
        }
      } catch (emailError) {
        // Don't fail the status update if email fails
        console.error('Failed to send order status email:', emailError);
      }

      res.json({ message: "Order status updated successfully", order });
    } catch (error) {
      console.error('Failed to update order status:', error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Invoice Management
  app.post("/api/orders/:id/invoice", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const customerInfo = req.body.customerInfo;

      // Create invoice for the order
      const invoice = await createInvoiceForOrder(orderId, customerInfo);
      res.status(201).json(invoice);
    } catch (error) {
      console.error('Failed to create invoice:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create invoice" });
    }
  });

  app.get("/api/invoices/:invoiceNumber", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const invoiceNumber = req.params.invoiceNumber;
      const invoice = await getInvoiceByNumber(invoiceNumber);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // If user is authenticated, check if they own this invoice
      if (req.user && invoice.userId && invoice.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // If no user is authenticated, allow access (public invoice view)
      // This allows invoice sharing via direct link

      const invoiceWithOrder = await getInvoiceWithOrder(invoice.id);
      const displayData = getInvoiceDisplayData(invoiceWithOrder!);
      
      res.json(displayData);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.get("/api/orders/:id/invoice", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const invoice = await getInvoiceByOrderId(orderId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found for this order" });
      }

      // Check if user owns this invoice
      if (invoice.userId && invoice.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const invoiceWithOrder = await getInvoiceWithOrder(invoice.id);
      const displayData = getInvoiceDisplayData(invoiceWithOrder!);
      
      res.json(displayData);
    } catch (error) {
      console.error('Failed to fetch invoice by order:', error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.get("/api/auth/invoices", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const invoices = await getUserInvoices(req.user!.id);
      const displayInvoices = await Promise.all(
        invoices.map(async (invoice) => {
          const invoiceWithOrder = await getInvoiceWithOrder(invoice.id);
          return getInvoiceDisplayData(invoiceWithOrder!);
        })
      );
      
      res.json(displayInvoices);
    } catch (error) {
      console.error('Failed to fetch user invoices:', error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.patch("/api/invoices/:id/status", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { status, paymentStatus } = req.body;

      // First check if invoice exists and user owns it
      const invoice = await getInvoiceWithOrder(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      if (invoice.userId && invoice.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Update invoice status
      const updatedInvoice = await updateInvoiceStatus(invoiceId, status, paymentStatus);
      const displayData = getInvoiceDisplayData({ ...updatedInvoice, order: invoice.order });
      
      res.json(displayData);
    } catch (error) {
      console.error('Failed to update invoice status:', error);
      res.status(500).json({ message: "Failed to update invoice status" });
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

  // Address Management
  app.get("/api/auth/addresses", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log(`Fetching addresses for user ${req.user!.id}:`, user.addresses);
      res.json(user.addresses || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      res.status(500).json({ message: "Failed to fetch addresses" });
    }
  });

  app.post("/api/auth/addresses", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const addressData = createAddressSchema.parse(req.body);
      console.log(`Creating address for user ${req.user!.id}:`, addressData);
      
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentAddresses = user.addresses || [];
      console.log('Current addresses:', currentAddresses);
      
      const newAddress = {
        ...addressData,
        id: `addr_${Date.now()}`,
        isDefault: currentAddresses.length === 0 // First address is default
      };

      const updatedAddresses = [...currentAddresses, newAddress];
      console.log('Updated addresses:', updatedAddresses);
      
      await storage.updateUserAddresses(req.user!.id, updatedAddresses);
      
      // Verify the update by fetching the user again
      const updatedUser = await storage.getUser(req.user!.id);
      console.log('User after address update:', updatedUser?.addresses);
      
      res.status(201).json(newAddress);
    } catch (error) {
      console.error('Error creating address:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid address data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create address" });
    }
  });

  app.put("/api/auth/addresses/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const addressData = addressSchema.parse(req.body);
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentAddresses = user.addresses || [];
      const addressIndex = currentAddresses.findIndex(addr => addr.id === req.params.id);
      
      if (addressIndex === -1) {
        return res.status(404).json({ message: "Address not found" });
      }

      currentAddresses[addressIndex] = { ...currentAddresses[addressIndex], ...addressData };
      await storage.updateUserAddresses(req.user!.id, currentAddresses);
      
      res.json(currentAddresses[addressIndex]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid address data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update address" });
    }
  });

  app.delete("/api/auth/addresses/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentAddresses = user.addresses || [];
      const updatedAddresses = currentAddresses.filter(addr => addr.id !== req.params.id);
      
      await storage.updateUserAddresses(req.user!.id, updatedAddresses);
      res.json({ message: "Address deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete address" });
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
      console.log('Reminder request body:', JSON.stringify(req.body, null, 2));
      
      // Convert reminderDate string to Date object if needed
      const bodyData = { ...req.body };
      if (bodyData.reminderDate && typeof bodyData.reminderDate === 'string') {
        bodyData.reminderDate = new Date(bodyData.reminderDate);
      }
      
      const reminderData = insertEventReminderSchema.parse({
        ...bodyData,
        userId: req.user!.id
      });
      const reminder = await storage.createEventReminder(reminderData);
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Reminder validation error:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid reminder data", errors: error.errors });
      }
      console.error('Reminder creation error:', error);
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  app.put("/api/reminders/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Convert reminderDate string to Date object if needed
      const bodyData = { ...req.body };
      if (bodyData.reminderDate && typeof bodyData.reminderDate === 'string') {
        bodyData.reminderDate = new Date(bodyData.reminderDate);
      }
      
      const { eventType, eventDate, reminderDate, relationshipType } = insertEventReminderSchema.omit({ userId: true }).parse(bodyData);
      
      await storage.updateEventReminder(id, {
        eventType,
        eventDate,
        reminderDate: new Date(reminderDate),
        relationshipType
      });
      
      // Fetch the updated reminder to return it
      const updatedReminder = await storage.getEventReminder(id);
      res.json(updatedReminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Reminder update validation error:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid reminder data", errors: error.errors });
      }
      console.error('Reminder update error:', error);
      res.status(500).json({ message: "Failed to update reminder" });
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

  // Admin middleware - simpler approach without TypeScript conflicts
  const requireAdmin = (req: AuthRequest, res: any, next: any) => {
    // Use the existing authenticateToken middleware first
    authenticateToken(req, res, async () => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Access token required" });
        }

        // Get full user info to check role
        const user = await storage.getUser(req.user.id);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ message: "Admin access required" });
        }

        next();
      } catch (error) {
        return res.status(401).json({ message: "Admin access required" });
      }
    });
  };

  // Admin Invoice Management
  app.get("/api/admin/invoices", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.patch("/api/admin/invoices/:id/status", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      await updateInvoiceStatus(id, status);
      res.json({ message: "Invoice status updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update invoice status" });
    }
  });

  app.put("/api/admin/invoice-settings", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const settings = req.body;
      // For now, just return success. In a real app, you'd store these in the database
      res.json({ message: "Invoice settings updated successfully", settings });
    } catch (error) {
      res.status(500).json({ message: "Failed to update invoice settings" });
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

  // Admin Login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { phone, password } = req.body;
      
      if (!phone || !password) {
        return res.status(400).json({ message: "Phone and password are required" });
      }

      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user is admin
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user.id, user.phone, user.email);
      
      res.json({
        message: "Admin login successful",
        token,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Admin login failed" });
    }
  });

  // Admin: Test email service
  app.post("/api/admin/test-email", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email address format" });
      }

      const { sendEmail } = await import("./email-service");
      
      const testEmailData = {
        to: email,
        from: "order.cakesbuy@gmail.com",
        subject: "CakesBuy - Email Service Test",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h2 style="color: #8B4513; margin-bottom: 20px;">🧪 Email Service Test</h2>
              
              <p style="color: #333; margin-bottom: 15px;">
                This is a test email from your CakesBuy platform to verify that the email service is working correctly.
              </p>
              
              <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h3 style="color: #8B4513; margin-top: 0;">Test Details:</h3>
                <ul style="color: #666;">
                  <li><strong>Platform:</strong> CakesBuy E-commerce</li>
                  <li><strong>Service:</strong> Gmail SMTP</li>
                  <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
                  <li><strong>Status:</strong> ✅ Email Service Active</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                If you received this email, your email configuration is working properly and you can send customer notifications.
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #8B4513;">
                <p style="color: #8B4513; font-weight: bold; margin: 0;">CakesBuy</p>
                <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">
                  100% Eggless Cakes • Online Delivery in Gurgaon
                </p>
              </div>
            </div>
          </div>
        `,
        text: `
Email Service Test - CakesBuy

This is a test email from your CakesBuy platform to verify that the email service is working correctly.

Test Details:
- Platform: CakesBuy E-commerce  
- Service: Gmail SMTP
- Test Time: ${new Date().toLocaleString()}
- Status: Email Service Active

If you received this email, your email configuration is working properly and you can send customer notifications.

CakesBuy
100% Eggless Cakes • Online Delivery in Gurgaon
        `
      };

      const emailSent = await sendEmail(testEmailData);
      
      if (emailSent) {
        res.json({ 
          message: "Test email sent successfully",
          email: email,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({ 
          message: "Failed to send test email. Please check email service configuration." 
        });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ 
        message: "Failed to send test email",
        error: error instanceof Error ? error.message : "Unknown error"
      });
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
      // Send welcome email
      const welcomeEmailData: WelcomeEmailData = {
        userEmail: newUser.email,
        userName: newUser.email.split("@")[0], // Use email prefix as name since name is not collected
        userPhone: newUser.phone
      };
      
      // Send welcome email asynchronously (dont wait for it to complete)
      sendWelcomeEmail(welcomeEmailData).catch(error => {
        console.error("Failed to send welcome email:", error);
      });
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

  // Forgot Password - Send OTP
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { phone } = forgotPasswordSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ message: "No account found with this phone number" });
      }
      
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
      console.log(`Password reset OTP for ${phone}: ${otp}`);
      
      res.json({ 
        message: "Password reset OTP sent successfully",
        // Remove this in production - only for demo
        otp: otp 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid phone number", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send password reset OTP" });
    }
  });

  // Reset Password with OTP
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { phone, otp, newPassword } = resetPasswordSchema.parse(req.body);
      
      // Verify OTP
      const verification = await storage.verifyOtp(phone, otp);
      if (!verification) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      
      // Get user by phone
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user's password
      await storage.updateUser(user.id, { password: hashedPassword });
      
      res.json({ 
        message: "Password reset successful. You can now login with your new password." 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid password reset data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Traditional registration route (phone/email/password)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { phone, email, password, confirmPassword } = registerSchema.parse(req.body);
      
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
      // Send welcome email
      const welcomeEmailData: WelcomeEmailData = {
        userEmail: newUser.email,
        userName: newUser.email.split("@")[0], // Use email prefix as name since name is not collected
        userPhone: newUser.phone
      };
      
      // Send welcome email asynchronously (dont wait for it to complete)
      sendWelcomeEmail(welcomeEmailData).catch(error => {
        console.error("Failed to send welcome email:", error);
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

  // Get current user info (for authentication persistence)
  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          birthday: user.birthday,
          anniversary: user.anniversary,
          addresses: user.addresses,
          loyaltyPoints: user.loyaltyPoints,
          loyaltyTier: user.loyaltyTier,
          totalSpent: user.totalSpent,
          orderCount: user.orderCount
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user information" });
    }
  });

  // Loyalty Program Routes
  
  // Get user loyalty stats
  app.get("/api/loyalty/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const loyaltyStats = await storage.getUserLoyaltyStats(req.user.id);
      if (!loyaltyStats) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        points: loyaltyStats.loyaltyPoints || 0,
        tier: loyaltyStats.loyaltyTier || "Bronze",
        totalSpent: loyaltyStats.totalSpent || "0",
        orderCount: loyaltyStats.orderCount || 0
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loyalty stats" });
    }
  });

  // Get user loyalty transactions
  app.get("/api/loyalty/transactions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getUserLoyaltyTransactions(req.user.id, limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loyalty transactions" });
    }
  });

  // Get available loyalty rewards
  app.get("/api/loyalty/rewards", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const user = await storage.getUser(req.user.id);
      const userTier = user?.loyaltyTier || "Bronze";
      const rewards = await storage.getLoyaltyRewards(userTier);
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loyalty rewards" });
    }
  });

  // Redeem a loyalty reward
  app.post("/api/loyalty/redeem", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const { rewardId } = req.body;
      if (!rewardId) {
        return res.status(400).json({ message: "Reward ID is required" });
      }
      
      const userReward = await storage.redeemReward(req.user.id, rewardId);
      res.json({
        message: "Reward redeemed successfully",
        code: userReward.code,
        expiresAt: userReward.expiresAt
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get user's redeemed rewards
  app.get("/api/loyalty/my-rewards", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userRewards = await storage.getUserRewards(req.user.id);
      res.json(userRewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user rewards" });
    }
  });

  // Apply reward code (validate and use)
  app.post("/api/loyalty/apply-reward", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: "Reward code is required" });
      }
      
      const userReward = await storage.getUserReward(code);
      if (!userReward) {
        return res.status(404).json({ message: "Invalid reward code" });
      }
      
      if (userReward.isUsed) {
        return res.status(400).json({ message: "Reward already used" });
      }
      
      if (userReward.expiresAt < new Date()) {
        return res.status(400).json({ message: "Reward expired" });
      }
      
      // Get reward details
      const reward = await storage.getLoyaltyReward(userReward.rewardId);
      
      res.json({
        valid: true,
        reward: reward,
        userReward: userReward
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate reward code" });
    }
  });

  // Wallet Management Routes
  
  // Get user wallet balance and stats
  app.get("/api/wallet/balance", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const balance = await storage.getUserWalletBalance(req.user.id);
      res.json({ balance: parseFloat(balance) });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet balance" });
    }
  });

  // Get user wallet transactions
  app.get("/api/wallet/transactions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getUserWalletTransactions(req.user.id, limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet transactions" });
    }
  });

  // Admin: Add wallet credit to user
  app.post("/api/admin/wallet/credit", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { userId, amount, description } = req.body;
      
      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Valid user ID and positive amount required" });
      }
      
      const transaction = await storage.updateUserWalletBalance(
        userId, 
        parseFloat(amount), 
        'admin_credit', 
        description || 'Admin credit', 
        req.user!.id
      );
      
      res.json({ 
        message: "Wallet credited successfully", 
        transaction,
        newBalance: transaction.balanceAfter 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to credit wallet" });
    }
  });

  // Admin: Debit wallet from user
  app.post("/api/admin/wallet/debit", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { userId, amount, description } = req.body;
      
      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Valid user ID and positive amount required" });
      }
      
      const transaction = await storage.updateUserWalletBalance(
        userId, 
        parseFloat(amount), 
        'admin_debit', 
        description || 'Admin debit', 
        req.user!.id
      );
      
      res.json({ 
        message: "Wallet debited successfully", 
        transaction,
        newBalance: transaction.balanceAfter 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to debit wallet" });
    }
  });

  // Admin: Get all wallet transactions for a user
  app.get("/api/admin/wallet/transactions/:userId", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || 100;
      
      const transactions = await storage.getUserWalletTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet transactions" });
    }
  });

  // Admin Configuration Routes
  
  // Get all admin configurations
  app.get("/api/admin/config", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const configs = await storage.getAllAdminConfigs();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch configurations" });
    }
  });

  // Get specific admin configuration
  app.get("/api/admin/config/:key", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const config = await storage.getAdminConfig(req.params.key);
      if (!config) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch configuration" });
    }
  });

  // Set admin configuration
  app.post("/api/admin/config", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { key, value, type, description, category } = req.body;
      
      if (!key || !value) {
        return res.status(400).json({ message: "Key and value are required" });
      }
      
      const config = await storage.setAdminConfig({
        key,
        value,
        type: type || 'string',
        description,
        category: category || 'general',
        updatedBy: req.user!.id
      });
      
      res.json({ message: "Configuration saved successfully", config });
    } catch (error) {
      res.status(500).json({ message: "Failed to save configuration" });
    }
  });

  // Update admin configuration
  app.put("/api/admin/config/:key", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { value } = req.body;
      
      if (!value) {
        return res.status(400).json({ message: "Value is required" });
      }
      
      await storage.updateAdminConfig(req.params.key, value, req.user!.id);
      res.json({ message: "Configuration updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update configuration" });
    }
  });

  // Delete admin configuration
  app.delete("/api/admin/config/:key", requireAdmin, async (req: AuthRequest, res) => {
    try {
      await storage.deleteAdminConfig(req.params.key);
      res.json({ message: "Configuration deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete configuration" });
    }
  });

  // Admin: Create loyalty reward
  app.post("/api/admin/loyalty/rewards", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertLoyaltyRewardSchema.parse(req.body);
      const reward = await storage.createLoyaltyReward(validatedData);
      res.status(201).json(reward);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reward data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create loyalty reward" });
    }
  });

  // Admin Email Reminder Routes
  
  // Get all pending reminders
  app.get("/api/admin/reminders/pending", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const pendingReminders = await storage.getPendingReminders();
      res.json(pendingReminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending reminders" });
    }
  });

  // Send reminder emails manually
  app.post("/api/admin/reminders/send", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { reminderIds, discountCode, discountPercentage } = req.body;
      
      if (!Array.isArray(reminderIds) || reminderIds.length === 0) {
        return res.status(400).json({ message: "Please provide reminder IDs" });
      }

      const results = [];
      
      for (const reminderId of reminderIds) {
        try {
          const reminder = await storage.getEventReminder(reminderId);
          if (!reminder) {
            results.push({ reminderId, success: false, error: "Reminder not found" });
            continue;
          }

          const user = await storage.getUser(reminder.userId);
          if (!user || !user.email) {
            results.push({ reminderId, success: false, error: "User or email not found" });
            continue;
          }

          const emailData: ReminderEmailData = {
            userEmail: user.email,
            userName: user.email.split('@')[0], // Use email prefix as name fallback
            eventType: reminder.eventType as 'birthday' | 'anniversary',
            eventDate: reminder.eventDate,
            discountCode,
            discountPercentage
          };

          console.log(`Sending reminder email for user ${user.email}, event: ${reminder.eventType}, date: ${reminder.eventDate}`);
          const emailSent = await sendReminderEmail(emailData);
          
          if (emailSent) {
            await storage.updateEventReminder(reminderId, { 
              notificationSent: true, 
              isProcessed: true 
            });
            results.push({ reminderId, success: true });
            console.log(`Reminder email sent successfully for user ${user.email}`);
          } else {
            results.push({ reminderId, success: false, error: "Email sending failed - check server logs for details" });
            console.error(`Failed to send reminder email for user ${user.email}`);
          }
        } catch (error) {
          results.push({ reminderId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      res.json({ 
        message: "Reminder emails processed", 
        results,
        totalSent: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send reminder emails" });
    }
  });

  // Get all users with upcoming events
  // Get all users for admin panel
  app.get("/api/admin/users", requireAdmin, async (req: AuthRequest, res) => {
    try {
      // Check if user is admin (for now, any authenticated user can access)
      // In a real app, you'd check for admin role
      
      const users = await storage.getAllUsers();
      
      // Remove password field for security and parse JSON addresses
      const safeUsers = users.map((user: User) => {
        let parsedAddresses = user.addresses;
        if (typeof user.addresses === 'string') {
          try {
            parsedAddresses = JSON.parse(user.addresses);
          } catch (error) {
            console.error(`Failed to parse addresses for user ${user.id}:`, error);
            parsedAddresses = [];
          }
        }
        
        return {
          ...user,
          password: undefined,
          addresses: parsedAddresses
        };
      });
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/upcoming-events", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getUsersWithUpcomingEvents();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users with upcoming events" });
    }
  });

  // Create bulk reminders for users with birthday/anniversary data
  app.post("/api/admin/reminders/create-bulk", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getUsersWithEventDates();
      const created = [];
      
      for (const user of users) {
        try {
          if (user.birthday) {
            await createEventReminder(user.id, 'birthday', user.birthday);
            created.push({ userId: user.id, eventType: 'birthday' });
          }
          if (user.anniversary) {
            await createEventReminder(user.id, 'anniversary', user.anniversary);
            created.push({ userId: user.id, eventType: 'anniversary' });
          }
        } catch (error) {
          // Skip if reminder already exists
        }
      }
      
      res.json({ 
        message: "Bulk reminders created successfully", 
        created: created.length,
        details: created 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create bulk reminders" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
