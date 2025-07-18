import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
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
  insertDeliveryBoySchema,
  adminDeliveryBoyRegisterSchema,
  insertPageSchema,
  loginSchema,
  registerSchema,
  addressSchema,
  deliveryBoyRegisterSchema,
  deliveryBoyLoginSchema,
  createAddressSchema,
  profileUpdateSchema,
  sendOtpSchema,
  verifyOtpSchema,
  otpRegisterSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  deliveryBoyLoginSchema,
  deliveryBoyRegisterSchema,
  orderRatingSchema,
  vendorRegisterSchema,
  vendorLoginSchema
} from "@shared/schema";
import { 
  generateToken, 
  generateDeliveryBoyToken,
  generateVendorToken,
  hashPassword, 
  comparePasswords, 
  authenticateToken, 
  authenticateDeliveryBoy,
  authenticateVendor,
  optionalAuth, 
  type AuthRequest,
  type DeliveryBoyAuthRequest,
  type VendorAuthRequest
} from "./auth";
import { sendReminderEmail, type ReminderEmailData, sendOrderConfirmationEmail, sendOrderStatusUpdateEmail, type OrderEmailData, sendWelcomeEmail, type WelcomeEmailData } from "./email-service";
import { whatsAppService, type WhatsAppOrderData } from "./whatsapp-service";
import { setupWhatsAppAdminRoutes } from "./whatsapp-admin";
import { sendRatingRequestEmail } from "./rating-service";
import { createInvoiceForOrder, updateInvoiceStatus, getInvoiceByOrderId, getInvoiceByNumber, getUserInvoices, getInvoiceWithOrder, getInvoiceDisplayData } from "./invoice-service";
import { processPhotoCakeItems } from "./photo-cake-service";
import { notifyOrderAssignment, notifyNewOrder } from "./notification-service.js";
import { initiatePhonePePayment, checkPhonePePaymentStatus, handlePhonePeCallback } from "./phonepe-service";
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

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit for high-quality images
  },
  fileFilter: (req, file, cb) => {
    // Accept all image formats - be very permissive for debugging
    console.log('File upload attempt:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    });
    
    // Just check if it starts with 'image/' or has image extension
    if (file.mimetype.startsWith('image/') || 
        file.originalname.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg)$/)) {
      console.log('File accepted');
      cb(null, true);
    } else {
      console.log('File rejected - not an image');
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Separate multer configuration for CSV uploads
const csvUpload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for CSV files
  },
  fileFilter: (req, file, cb) => {
    // Accept CSV files
    const allowedMimeTypes = [
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express, httpServer?: any): Promise<Server> {
  
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

  // Single file upload endpoint
  app.post("/api/upload", upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ 
        message: "File uploaded successfully", 
        url: fileUrl,
        filename: req.file.filename 
      });
    } catch (error) {
      res.status(500).json({ message: "Upload failed" });
    }
  });



  // Multiple file upload endpoint for product images
  app.post("/api/upload/multiple", upload.array('images', 10), (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      
      const files = req.files as Express.Multer.File[];
      const uploadedUrls = files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename
      }));
      
      res.json({ 
        message: `${files.length} files uploaded successfully`, 
        files: uploadedUrls
      });
    } catch (error) {
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));
  
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
      const { 
        categoryId, 
        isEggless, 
        isBestseller, 
        search, 
        sort, 
        category, 
        price,
        page = "1",
        limit = "12"
      } = req.query;
      
      // Parse pagination parameters
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 12;
      
      // If using advanced search with sort/category/price filters
      if (search && (sort || category || price)) {
        const cakes = await storage.searchCakes(search as string, {
          sort: sort as string,
          category: category as string,
          priceRange: price as string
        });
        
        // Apply manual pagination to search results
        const total = cakes.length;
        const pages = Math.ceil(total / limitNum);
        const offset = (pageNum - 1) * limitNum;
        const paginatedCakes = cakes.slice(offset, offset + limitNum);
        
        return res.json({
          cakes: paginatedCakes,
          total,
          pages,
          currentPage: pageNum,
          hasNextPage: pageNum < pages,
          hasPrevPage: pageNum > 1
        });
      }

      // Build filters object
      const filters: any = {};
      if (categoryId) filters.categoryId = parseInt(categoryId as string);
      if (isEggless !== undefined) filters.isEggless = isEggless === 'true';
      if (isBestseller !== undefined) filters.isBestseller = isBestseller === 'true';

      // Use paginated method
      const result = await storage.getCakesPaginated(
        pageNum, 
        limitNum, 
        search as string, 
        filters
      );
      
      res.json({
        cakes: result.cakes,
        total: result.total,
        pages: result.pages,
        currentPage: pageNum,
        hasNextPage: pageNum < result.pages,
        hasPrevPage: pageNum > 1
      });
    } catch (error) {
      console.error("Error fetching cakes:", error);
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
      
      // Process photo cake items and generate composite images
      try {
        orderData.items = await processPhotoCakeItems(orderData.items, `TEMP-${Date.now()}`);
      } catch (error) {
        console.error('Failed to process photo cake items:', error);
        // Continue with order creation even if photo processing fails
      }
      
      const order = await storage.createOrder(orderData);
      
      // Update photo cake items with actual order number
      if (order && orderData.items.some(item => item.photoCustomization?.compositeImage)) {
        try {
          const updatedItems = await processPhotoCakeItems(orderData.items, order.orderNumber);
          await storage.updateOrder(order.id, { ...order, items: updatedItems });
        } catch (error) {
          console.error('Failed to update photo cake items with order number:', error);
        }
      }
      
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

        // Send WhatsApp order confirmation
        const customerPhone = order.deliveryAddress.phone || (req.user ? (await storage.getUser(req.user.id))?.phone : null);
        if (customerPhone) {
          try {
            await whatsAppService.sendOrderConfirmation(order, customerPhone, customerName);
            console.log(`WhatsApp order confirmation sent to ${customerPhone} for order ${order.orderNumber}`);
          } catch (whatsappError) {
            console.error('Failed to send WhatsApp order confirmation:', whatsappError);
          }
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

      // Send admin notification for new order
      try {
        const customerInfo = typeof order.deliveryAddress === 'string' 
          ? JSON.parse(order.deliveryAddress) 
          : order.deliveryAddress;
        
        const orderDetails = {
          customerName: customerInfo.name || 'Unknown Customer',
          customerPhone: customerInfo.phone || '',
          address: `${customerInfo.address}, ${customerInfo.city} - ${customerInfo.pincode}` || 'Address not available'
        };
        
        await notifyNewOrder(order, orderDetails);
        console.log(`Admin notification sent for new order ${order.orderNumber}`);
      } catch (notificationError) {
        // Don't fail the order if notification fails
        console.error('Failed to send admin notification:', notificationError);
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

  app.patch("/api/admin/orders/:id/status", requireAdmin, async (req: AuthRequest, res) => {
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

      // Send status update email only for order placement and delivery
      if (status === 'confirmed' || status === 'delivered') {
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

          // Send WhatsApp notification for delivery
          if (status === 'delivered') {
            const customerPhone = order.deliveryAddress.phone || (order.userId ? (await storage.getUser(order.userId))?.phone : null);
            if (customerPhone) {
              try {
                await whatsAppService.sendOrderDelivered(order, customerPhone, customerName);
                console.log(`WhatsApp delivery notification sent to ${customerPhone} for order ${order.orderNumber}`);
              } catch (whatsappError) {
                console.error('Failed to send WhatsApp delivery notification:', whatsappError);
              }
            }
          }
        } catch (emailError) {
          // Don't fail the status update if email fails
          console.error('Failed to send order status email:', emailError);
        }
      }

      // Send rating email if order is delivered
      if (status === 'delivered') {
        try {
          let customerEmail = order.deliveryAddress.email;
          const customerName = order.deliveryAddress.name;
          
          // If no email in delivery address and order has user, get from user
          if (!customerEmail && order.userId) {
            const user = await storage.getUser(order.userId);
            customerEmail = user?.email;
          }
          
          if (customerEmail) {
            await sendRatingRequestEmail(orderId, customerEmail, customerName, order.orderNumber);
            console.log(`Rating request email sent to ${customerEmail} for order ${order.orderNumber}`);
          }
        } catch (emailError) {
          // Don't fail the status update if email fails
          console.error('Failed to send rating request email:', emailError);
        }
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
  app.post("/api/admin/categories", requireAdmin, async (req: AuthRequest, res) => {
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

  app.put("/api/admin/categories/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.updateCategory(id, req.body);
      res.json({ message: "Category updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Admin Cakes
  app.post("/api/admin/cakes", requireAdmin, async (req: AuthRequest, res) => {
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

  app.put("/api/admin/cakes/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.updateCake(id, req.body);
      res.json({ message: "Cake updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update cake" });
    }
  });

  app.delete("/api/admin/cakes/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCake(id);
      res.json({ message: "Cake deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete cake" });
    }
  });

  // Admin Orders
  app.get("/api/admin/orders", requireAdmin, async (req: AuthRequest, res) => {
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
  app.get("/api/admin/promo-codes", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const promoCodes = await storage.getAllPromoCodes();
      res.json(promoCodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch promo codes" });
    }
  });

  app.post("/api/admin/promo-codes", requireAdmin, async (req: AuthRequest, res) => {
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

  app.put("/api/admin/promo-codes/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.updatePromoCode(id, req.body);
      res.json({ message: "Promo code updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update promo code" });
    }
  });

  app.delete("/api/admin/promo-codes/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePromoCode(id);
      res.json({ message: "Promo code deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete promo code" });
    }
  });

  // Admin Add-ons
  app.post("/api/admin/addons", requireAdmin, async (req: AuthRequest, res) => {
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

  app.put("/api/admin/addons/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.updateAddon(id, req.body);
      res.json({ message: "Addon updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update addon" });
    }
  });

  app.delete("/api/admin/addons/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAddon(id);
      res.json({ message: "Addon deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete addon" });
    }
  });



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

  // Sample CSV template download endpoints
  app.get("/api/admin/sample-csv/:type", async (req, res) => {
    try {
      const { type } = req.params;
      
      let headers: string[] = [];
      let sampleData: any[][] = [];
      
      switch (type) {
        case 'products':
          headers = ['name', 'slug', 'description', 'flavors', 'weights', 'prices', 'category_id', 'images', 'is_bestseller', 'is_photo_cake'];
          sampleData = [
            ['Chocolate Truffle Cake', 'chocolate-truffle-cake', 'Rich chocolate cake with truffle layers', 'Chocolate;Dark Chocolate;Milk Chocolate', '500g;1kg;2kg', '700;1400;2500', '1', 'https://example.com/chocolate.jpg;https://example.com/chocolate2.jpg', 'true', 'false'],
            ['Vanilla Sponge Cake', 'vanilla-sponge-cake', 'Light and fluffy vanilla sponge cake', 'Vanilla;French Vanilla;Vanilla Bean', '500g;1kg;1.5kg', '450;850;1200', '2', 'https://example.com/vanilla.jpg', 'false', 'false'],
            ['Red Velvet Cake', 'red-velvet-cake', 'Classic red velvet with cream cheese frosting', 'Red Velvet;Blue Velvet;Pink Velvet', '500g;1kg;2kg', '600;1100;2000', '1', 'https://example.com/red-velvet.jpg', 'true', 'false'],
            ['Fresh Fruit Cake', 'fresh-fruit-cake', 'Seasonal fresh fruit cake with cream layers', 'Strawberry;Mango;Mixed Fruit;Pineapple', '500g;1kg;1.5kg;2kg', '550;1000;1450;2200', '2', 'https://example.com/fruit-cake.jpg', 'false', 'false'],
            ['Custom Photo Cake', 'custom-photo-cake', 'Personalized photo cake for special occasions', 'Chocolate;Vanilla;Strawberry;Butterscotch', '500g;1kg;1.5kg;2kg', '800;1500;2100;3000', '3', 'https://example.com/photo-cake.jpg', 'false', 'true']
          ];
          break;
        case 'categories':
          headers = ['name', 'slug', 'description', 'image', 'parent_id'];
          sampleData = [
            ['Celebration Cakes', 'celebration-cakes', 'Perfect cakes for all types of celebrations', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop', '1'],
            ['Premium Cakes', 'premium-cakes', 'Luxury premium cakes for special occasions', 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=400&h=300&fit=crop', '1'],
            ['Seasonal Cakes', 'seasonal-cakes', 'Special seasonal and festival cakes', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop', '1'],
            ['Corporate Cakes', 'corporate-cakes', 'Professional cakes for corporate events and meetings', 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400&h=300&fit=crop', '1'],
            ['Kids Special', 'kids-special', 'Fun and colorful cakes designed especially for children', 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop', '1']
          ];
          break;
        case 'users':
          headers = ['phone', 'email', 'name', 'role'];
          sampleData = [
            ['9876543210', 'john.doe@example.com', 'John Doe', 'customer'],
            ['9876543211', 'jane.smith@example.com', 'Jane Smith', 'customer'],
            ['9876543212', 'admin.user@example.com', 'Admin User', 'admin'],
            ['9876543213', 'mary.johnson@example.com', 'Mary Johnson', 'customer'],
            ['9876543214', 'david.wilson@example.com', 'David Wilson', 'customer']
          ];
          break;
        default:
          return res.status(400).json({ message: "Invalid template type" });
      }
      
      // Create CSV content
      const csvRows = [headers.join(',')];
      for (const row of sampleData) {
        const csvRow = row.map(value => {
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvRows.push(csvRow.join(','));
      }
      
      const csvContent = csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sample_${type}_template.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Sample CSV generation error:", error);
      res.status(500).json({ message: "Failed to generate sample CSV" });
    }
  });

  // Bulk Upload and Export endpoints
  app.get("/api/admin/export/:type", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { type } = req.params;
      
      let data: any[] = [];
      let headers: string[] = [];
      
      switch (type) {
        case 'products':
          data = await storage.getAllCakes();
          headers = ['id', 'name', 'slug', 'description', 'flavors', 'weights', 'prices', 'category_id', 'images', 'is_bestseller', 'is_photo_cake'];
          break;
        case 'categories':
          data = await storage.getAllCategories();
          headers = ['id', 'name', 'slug', 'description', 'image'];
          break;
        case 'users':
          data = await storage.getAllUsers();
          headers = ['id', 'phone', 'email', 'name', 'role'];
          break;
        default:
          return res.status(400).json({ message: "Invalid export type" });
      }
      
      // Convert data to CSV
      const csvRows = [headers.join(',')];
      for (const item of data) {
        const row = headers.map(header => {
          let value = item[header];
          if (Array.isArray(value)) {
            value = value.join(';'); // Use semicolon for array values
          }
          if (typeof value === 'string' && value.includes(',')) {
            value = `"${value}"`; // Quote strings with commas
          }
          return value || '';
        });
        csvRows.push(row.join(','));
      }
      
      const csvContent = csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  app.post("/api/admin/bulk-upload", requireAdmin, csvUpload.single('file'), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const { type } = req.body;
      if (!type || !['products', 'categories', 'users'].includes(type)) {
        return res.status(400).json({ message: "Invalid upload type" });
      }
      
      // Read and parse CSV file
      const fileContent = fs.readFileSync(req.file.path, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV file must have at least a header and one data row" });
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataRows = lines.slice(1);
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      for (let i = 0; i < dataRows.length; i++) {
        try {
          const values = dataRows[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const rowData: any = {};
          
          headers.forEach((header, index) => {
            let value = values[index] || '';
            
            // Handle special cases
            if (header === 'images' && value) {
              value = value.split(';'); // Convert semicolon-separated to array
            } else if (header === 'flavors' && value) {
              value = value.split(';'); // Convert semicolon-separated to array
            } else if (header === 'weights' && value) {
              value = value.split(';'); // Convert semicolon-separated to array  
            } else if (header === 'prices' && value) {
              const priceArray = value.split(';').map(p => parseFloat(p.trim()));
              // Set basePrice as the first price and store weights as array
              rowData.basePrice = priceArray[0];
              value = priceArray; // Keep original for weights processing
            } else if (header === 'is_bestseller' || header === 'is_photo_cake') {
              value = value.toLowerCase() === 'true' || value === '1';
            } else if (header === 'price' || header === 'category_id' || header === 'id') {
              value = value ? parseFloat(value) : null;
            }
            
            if (value !== '') {
              rowData[header] = value;
            }
          });
          
          // Skip rows with missing required fields
          if (type === 'products' && (!rowData.name || (!rowData.basePrice && !rowData.price && !rowData.prices))) {
            errors.push(`Row ${i + 2}: Missing required fields (name, prices)`);
            errorCount++;
            continue;
          }
          
          if (type === 'categories' && !rowData.name) {
            errors.push(`Row ${i + 2}: Missing required field (name)`);
            errorCount++;
            continue;
          }
          
          if (type === 'users' && (!rowData.phone || !rowData.email)) {
            errors.push(`Row ${i + 2}: Missing required fields (phone, email)`);
            errorCount++;
            continue;
          }
          
          // Create records
          switch (type) {
            case 'products':
              delete rowData.id; // Let database auto-generate ID
              if (!rowData.slug) {
                rowData.slug = rowData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              }
              
              // Process weights and prices together if both exist
              if (rowData.weights && rowData.prices && Array.isArray(rowData.weights) && Array.isArray(rowData.prices)) {
                const weightsArray = rowData.weights.map((weight: string, index: number) => ({
                  weight: weight.trim(),
                  price: rowData.prices[index] || rowData.prices[0] || 0
                }));
                rowData.weights = weightsArray;
              }
              
              // Ensure required fields have defaults
              if (!rowData.basePrice && rowData.prices && Array.isArray(rowData.prices)) {
                rowData.basePrice = rowData.prices[0];
              }
              
              // Convert boolean fields
              if (rowData.is_bestseller !== undefined) {
                rowData.isBestseller = rowData.is_bestseller;
                delete rowData.is_bestseller;
              }
              if (rowData.is_photo_cake !== undefined) {
                rowData.isPhotoCake = rowData.is_photo_cake;
                delete rowData.is_photo_cake;
              }
              
              // Set default values for required fields
              rowData.isEggless = true; // Default for this eggless cake shop
              rowData.isAvailable = true;
              rowData.isCustomizable = true;
              
              await storage.createCake(rowData);
              break;
            case 'categories':
              delete rowData.id;
              if (!rowData.slug) {
                rowData.slug = rowData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              }
              await storage.createCategory(rowData);
              break;
            case 'users':
              delete rowData.id;
              if (!rowData.role) {
                rowData.role = 'customer';
              }
              // Check if user already exists
              const existingUser = await storage.getUserByPhone(rowData.phone);
              if (existingUser) {
                errors.push(`Row ${i + 2}: User with phone ${rowData.phone} already exists`);
                errorCount++;
                continue;
              }
              // Hash password if provided, otherwise set default
              if (!rowData.password) {
                rowData.password = await hashPassword('password123');
              } else {
                rowData.password = await hashPassword(rowData.password);
              }
              await storage.createUser(rowData);
              break;
          }
          
          successCount++;
        } catch (error) {
          errors.push(`Row ${i + 2}: ${error.message}`);
          errorCount++;
        }
      }
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.json({
        message: `Bulk upload completed`,
        count: successCount,
        successCount,
        errorCount,
        errors: errors.slice(0, 10), // Limit to first 10 errors
        totalErrors: errors.length
      });
    } catch (error) {
      console.error("Bulk upload error:", error);
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("Failed to cleanup uploaded file:", cleanupError);
        }
      }
      res.status(500).json({ message: "Failed to process bulk upload" });
    }
  });

  // Admin: Test notification system
  app.post("/api/admin/test-notification", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { getActiveAdminConnections, broadcastToAdmins } = await import("./notification-service");
      
      const activeConnections = getActiveAdminConnections();
      
      const testNotification = {
        type: 'new_order' as const,
        orderId: 999,
        orderNumber: 'TEST-' + Date.now(),
        message: `🧪 Test notification at ${new Date().toLocaleTimeString()}`,
        timestamp: new Date().toISOString(),
        orderDetails: {
          customerName: 'Test Customer',
          customerPhone: '1234567890',
          amount: 100,
          address: 'Test Address, Gurgaon'
        }
      };
      
      const sentCount = broadcastToAdmins(testNotification);
      
      res.json({
        message: "Test notification sent",
        activeConnections,
        sentCount,
        notification: testNotification
      });
    } catch (error) {
      console.error("Test notification error:", error);
      res.status(500).json({ message: "Failed to send test notification" });
    }
  });

  // Admin image upload endpoint
  app.post("/api/admin/upload-image", requireAdmin, upload.single('image'), (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }
      
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ 
        message: "Image uploaded successfully", 
        imageUrl,
        filename: req.file.filename 
      });
    } catch (error) {
      console.error("Admin image upload error:", error);
      res.status(500).json({ message: "Failed to upload image" });
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

      const token = generateToken(user.id, user.phone, user.email, user.role);
      
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

  // Admin: Test welcome email
  app.post("/api/admin/test-welcome-email", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { email, phone } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email address format" });
      }

      const { sendWelcomeEmail } = await import("./email-service");
      
      const welcomeEmailData = {
        userEmail: email,
        userName: email.split("@")[0], // Use email prefix as name
        userPhone: phone || "9311553545"
      };
      
      await sendWelcomeEmail(welcomeEmailData);
      
      res.json({ 
        message: "Welcome email sent successfully",
        details: {
          email,
          phone: phone || "9311553545",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Test welcome email error:", error);
      res.status(500).json({ message: "Failed to send welcome email" });
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

      const emailSent = await sendEmail(testEmailData.to, testEmailData.subject, testEmailData.text, testEmailData.html);
      
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

  // Rating email test
  app.post('/api/test-rating-email', async (req, res) => {
    try {
      const { orderId, customerEmail, customerName, orderNumber } = req.body;
      
      if (!orderId || !customerEmail || !customerName || !orderNumber) {
        return res.status(400).json({ 
          error: 'Missing required fields: orderId, customerEmail, customerName, orderNumber' 
        });
      }

      const { sendRatingRequestEmail } = await import('./rating-service');
      const result = await sendRatingRequestEmail(orderId, customerEmail, customerName, orderNumber);
      
      res.json({ 
        success: result,
        message: result ? 'Rating request email sent successfully!' : 'Failed to send rating email'
      });
    } catch (error) {
      console.error('Rating email error:', error);
      res.status(500).json({ error: 'Failed to send rating email' });
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
      
      // Hash password and create user with 50Rs welcome bonus
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        phone,
        addresses: [],
        walletBalance: "50" // 50Rs welcome bonus
      });
      
      // Add wallet transaction for welcome bonus
      await storage.addWalletTransaction({
        userId: newUser.id,
        type: "credit",
        amount: "50",
        description: "Welcome bonus - Thank you for joining CakesBuy!",
        balanceAfter: "50"
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

      // Send WhatsApp welcome message asynchronously
      whatsAppService.sendWelcomeMessage(newUser.phone, newUser.email.split("@")[0]).catch(error => {
        console.error("Failed to send WhatsApp welcome message:", error);
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
      
      // Hash password and create user with 50Rs welcome bonus
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        phone,
        addresses: [],
        walletBalance: "50" // 50Rs welcome bonus
      });
      
      // Add wallet transaction for welcome bonus
      await storage.addWalletTransaction({
        userId: newUser.id,
        type: "credit",
        amount: "50",
        description: "Welcome bonus - Thank you for joining CakesBuy!",
        balanceAfter: "50"
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
      console.error("Registration error:", error);
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

  // Create new user (Admin only)
  app.post("/api/admin/users", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userData = req.body;
      
      // Validate required fields
      if (!userData.email || !userData.phone || !userData.password) {
        return res.status(400).json({ message: "Email, phone, and password are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      const existingPhone = await storage.getUserByPhone(userData.phone);
      if (existingPhone) {
        return res.status(400).json({ message: "User with this phone number already exists" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
        role: userData.role || 'customer',
        addresses: []
      });
      
      // Remove password from response
      const { password, ...safeUser } = newUser;
      
      res.status(201).json({
        message: "User created successfully",
        user: safeUser
      });
    } catch (error: any) {
      console.error("Failed to create user:", error);
      res.status(500).json({ message: error.message || "Failed to create user" });
    }
  });

  // Update user (Admin only)
  app.put("/api/admin/users/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get existing user
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check for email conflicts (if email is being changed)
      if (userData.email && userData.email !== existingUser.email) {
        const emailConflict = await storage.getUserByEmail(userData.email);
        if (emailConflict) {
          return res.status(400).json({ message: "Email already in use by another user" });
        }
      }
      
      // Check for phone conflicts (if phone is being changed)
      if (userData.phone && userData.phone !== existingUser.phone) {
        const phoneConflict = await storage.getUserByPhone(userData.phone);
        if (phoneConflict) {
          return res.status(400).json({ message: "Phone number already in use by another user" });
        }
      }
      
      // Update user (password not included in updates for security)
      const updatedUser = await storage.updateUser(userId, {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        birthday: userData.birthday,
        anniversary: userData.anniversary
      });
      
      // Remove password from response
      const { password, ...safeUser } = updatedUser;
      
      res.json({
        message: "User updated successfully",
        user: safeUser
      });
    } catch (error: any) {
      console.error("Failed to update user:", error);
      res.status(500).json({ message: error.message || "Failed to update user" });
    }
  });

  // Delete user (Admin only)
  app.delete("/api/admin/users/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deletion of admin users
      if (user.role === 'admin') {
        return res.status(400).json({ message: "Cannot delete admin users" });
      }

      // Delete the user
      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete user" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
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

  // ============== DELIVERY SYSTEM ROUTES ==============

  // Delivery Boy Authentication Routes
  app.post("/api/delivery/register", async (req, res) => {
    try {
      const validatedData = deliveryBoyRegisterSchema.parse(req.body);
      
      // Check if delivery boy already exists
      const existingDeliveryBoy = await storage.getDeliveryBoyByPhone(validatedData.phone);
      if (existingDeliveryBoy) {
        return res.status(400).json({ message: "Phone number already registered" });
      }

      // Hash password and create delivery boy
      const hashedPassword = await hashPassword(validatedData.password);
      const deliveryBoy = await storage.createDeliveryBoy({
        ...validatedData,
        password: hashedPassword
      });

      res.status(201).json({
        message: "Delivery boy registered successfully",
        deliveryBoy: { id: deliveryBoy.id, name: deliveryBoy.name, phone: deliveryBoy.phone }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Push notification routes for delivery boys
  app.post('/api/delivery/push/subscribe', authenticateDeliveryBoy, async (req: DeliveryBoyAuthRequest, res: Response) => {
    try {
      const { subscription } = req.body;
      
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Invalid subscription data' });
      }

      const { savePushSubscription } = await import('./push-service.js');
      const result = await savePushSubscription(req.deliveryBoy!.id, subscription);
      
      if (result.success) {
        res.json({ message: 'Push subscription saved successfully' });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      console.error('Error saving push subscription:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/delivery/push/unsubscribe', authenticateDeliveryBoy, async (req: DeliveryBoyAuthRequest, res: Response) => {
    try {
      const { removePushSubscription } = await import('./push-service.js');
      const result = await removePushSubscription(req.deliveryBoy!.id);
      
      if (result.success) {
        res.json({ message: 'Push subscription removed successfully' });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      console.error('Error removing push subscription:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/delivery/push/vapid-key', (req: Request, res: Response) => {
    import('./push-service.js').then(({ getVapidPublicKey }) => {
      res.json({ publicKey: getVapidPublicKey() });
    }).catch(error => {
      console.error('Error getting VAPID key:', error);
      res.status(500).json({ error: 'Failed to get VAPID key' });
    });
  });

  // Test push notification endpoint
  app.post('/api/delivery/test-push', authenticateDeliveryBoy, async (req: DeliveryBoyAuthRequest, res: Response) => {
    try {
      const { title, body, data } = req.body;
      
      if (!req.deliveryBoy) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log(`🧪 Sending test push notification to delivery boy ${req.deliveryBoy.id}`);
      
      const { sendPushNotification } = await import('./push-service.js');
      const result = await sendPushNotification(req.deliveryBoy.id, {
        title: title || '🧪 Test Notification',
        body: body || 'This is a test push notification to verify background alerts work!',
        data: { 
          test: true,
          urgent: true,
          timestamp: Date.now(),
          ...data
        }
      });
      
      console.log(`📱 Test push notification result:`, result);
      
      if (result.success) {
        res.json({ 
          message: 'Test push notification sent successfully',
          details: result.details || 'Push notification delivered'
        });
      } else {
        res.status(500).json({ error: result.error || 'Failed to send test notification' });
      }
    } catch (error) {
      console.error('Error sending test push notification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/delivery/login", async (req, res) => {
    try {
      const validatedData = deliveryBoyLoginSchema.parse(req.body);
      
      const deliveryBoy = await storage.getDeliveryBoyByPhone(validatedData.phone);
      if (!deliveryBoy) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!deliveryBoy.isActive) {
        return res.status(401).json({ message: "Account is disabled. Contact admin." });
      }

      const isPasswordValid = await comparePasswords(validatedData.password, deliveryBoy.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateDeliveryBoyToken(deliveryBoy.id, deliveryBoy.phone, deliveryBoy.name);
      
      res.json({
        message: "Login successful",
        token,
        deliveryBoy: {
          id: deliveryBoy.id,
          name: deliveryBoy.name,
          phone: deliveryBoy.phone,
          vehicleType: deliveryBoy.vehicleType,
          rating: deliveryBoy.rating
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin Delivery Boy Management Routes
  app.get("/api/admin/delivery-boys", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const deliveryBoys = await storage.getAllDeliveryBoys();
      // Remove password from response
      const safeDeliveryBoys = deliveryBoys.map(db => {
        const { password, ...safe } = db;
        return safe;
      });
      res.json(safeDeliveryBoys);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch delivery boys" });
    }
  });

  app.post("/api/admin/delivery-boys", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const validatedData = adminDeliveryBoyRegisterSchema.parse(req.body);
      
      // Check if delivery boy already exists
      const existingDeliveryBoy = await storage.getDeliveryBoyByPhone(validatedData.phone);
      if (existingDeliveryBoy) {
        return res.status(400).json({ message: "Phone number already registered" });
      }

      // Hash password and create delivery boy
      const hashedPassword = await hashPassword(validatedData.password);
      const deliveryBoy = await storage.createDeliveryBoy({
        name: validatedData.name,
        phone: validatedData.phone,
        password: hashedPassword,
        vehicleType: validatedData.vehicleType,
        vehicleNumber: `${validatedData.vehicleType.toUpperCase()}-${Date.now()}`, // Generate a unique vehicle number
        address: "Gurgaon, Haryana", // Default address for admin-created delivery boys
        pincode: "122001" // Default pincode for Gurgaon
      });

      const { password, ...safeDeliveryBoy } = deliveryBoy;
      res.status(201).json({
        message: "Delivery boy created successfully",
        deliveryBoy: safeDeliveryBoy
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create delivery boy" });
    }
  });

  app.put("/api/admin/delivery-boys/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Hash password if it's being updated
      if (updates.password) {
        updates.password = await hashPassword(updates.password);
      }

      await storage.updateDeliveryBoy(id, updates);
      res.json({ message: "Delivery boy updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update delivery boy" });
    }
  });

  app.delete("/api/admin/delivery-boys/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDeliveryBoy(id);
      res.json({ message: "Delivery boy deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete delivery boy" });
    }
  });

  // PhonePe Payment Routes
  app.post("/api/payments/phonepe/initiate", async (req, res) => {
    try {
      const { orderId, amount, userPhone, userName, userEmail } = req.body;
      
      // Validate required fields
      if (!orderId || !amount || !userPhone || !userName) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields: orderId, amount, userPhone, userName" 
        });
      }

      // Validate order exists
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: "Order not found" 
        });
      }

      // Generate redirect and callback URLs
      const baseUrl = req.protocol + '://' + req.get('host');
      const redirectUrl = `${baseUrl}/payment/phonepe/callback`;
      const callbackUrl = `${baseUrl}/api/payments/phonepe/callback`;

      // Initiate PhonePe payment
      const paymentResponse = await initiatePhonePePayment({
        orderId,
        amount,
        userId: order.userId,
        userPhone,
        userName,
        userEmail,
        redirectUrl,
        callbackUrl
      });

      res.json(paymentResponse);
    } catch (error) {
      console.error('PhonePe payment initiation error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to initiate PhonePe payment" 
      });
    }
  });

  app.get("/api/payments/phonepe/status/:merchantTransactionId", async (req, res) => {
    try {
      const { merchantTransactionId } = req.params;
      
      const statusResponse = await checkPhonePePaymentStatus(merchantTransactionId);
      res.json(statusResponse);
    } catch (error) {
      console.error('PhonePe status check error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to check PhonePe payment status" 
      });
    }
  });

  app.post("/api/payments/phonepe/callback", async (req, res) => {
    try {
      const { merchantTransactionId, checksum } = req.body;
      
      if (!merchantTransactionId) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing merchantTransactionId" 
        });
      }

      const callbackResponse = await handlePhonePeCallback(merchantTransactionId, checksum);
      res.json(callbackResponse);
    } catch (error) {
      console.error('PhonePe callback error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to handle PhonePe callback" 
      });
    }
  });

  // PhonePe payment success/failure redirect pages
  app.get("/payment/phonepe/callback", async (req, res) => {
    try {
      const { merchantTransactionId } = req.query;
      
      if (!merchantTransactionId) {
        return res.redirect('/payment/failure?error=invalid_transaction');
      }

      // Check payment status
      const statusResponse = await checkPhonePePaymentStatus(merchantTransactionId as string);
      
      if (statusResponse.success && statusResponse.data?.state === 'COMPLETED') {
        // Payment successful
        const transaction = await storage.getPhonePeTransactionByMerchantId(merchantTransactionId as string);
        if (transaction) {
          res.redirect(`/payment/success?transactionId=${merchantTransactionId}&orderId=${transaction.orderId}`);
        } else {
          res.redirect(`/payment/success?transactionId=${merchantTransactionId}`);
        }
      } else {
        // Payment failed
        res.redirect(`/payment/failure?transactionId=${merchantTransactionId}&error=payment_failed`);
      }
    } catch (error) {
      console.error('PhonePe callback redirect error:', error);
      res.redirect('/payment/failure?error=callback_error');
    }
  });

  app.get("/payment/success", (req, res) => {
    const { transactionId, orderId } = req.query;
    res.send(`
      <html>
        <head>
          <title>Payment Successful - CakesBuy</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin: 50px; }
            .success { color: #2e7d32; }
            .container { max-width: 600px; margin: 0 auto; }
            .btn { background: #ff6b35; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">🎉 Payment Successful!</h1>
            <p>Thank you for your payment. Your order has been confirmed.</p>
            <p><strong>Transaction ID:</strong> ${transactionId || 'N/A'}</p>
            ${orderId ? `<p><strong>Order ID:</strong> ${orderId}</p>` : ''}
            <p>You will receive a confirmation email shortly.</p>
            <a href="/" class="btn">Continue Shopping</a>
          </div>
        </body>
      </html>
    `);
  });

  app.get("/payment/failure", (req, res) => {
    const { transactionId, error } = req.query;
    res.send(`
      <html>
        <head>
          <title>Payment Failed - CakesBuy</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin: 50px; }
            .failure { color: #d32f2f; }
            .container { max-width: 600px; margin: 0 auto; }
            .btn { background: #ff6b35; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="failure">❌ Payment Failed</h1>
            <p>We're sorry, but your payment could not be processed.</p>
            <p><strong>Transaction ID:</strong> ${transactionId || 'N/A'}</p>
            <p><strong>Error:</strong> ${error || 'Payment was not successful'}</p>
            <p>Please try again or contact support if the problem persists.</p>
            <a href="/" class="btn">Try Again</a>
          </div>
        </body>
      </html>
    `);
  });

  // PhonePe Demo Payment Page
  app.get("/payment/phonepe/demo", async (req, res) => {
    const { merchantTransactionId, amount } = req.query;
    
    res.send(`
      <html>
        <head>
          <title>PhonePe Demo Payment - CakesBuy</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin: 50px; background: #5f2584; color: white; }
            .container { max-width: 600px; margin: 0 auto; background: white; color: #333; padding: 30px; border-radius: 10px; }
            .phonepe-logo { color: #5f2584; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .amount { font-size: 36px; font-weight: bold; color: #5f2584; margin: 20px 0; }
            .btn { background: #5f2584; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 10px; display: inline-block; border: none; font-size: 16px; cursor: pointer; }
            .btn-success { background: #4caf50; }
            .btn-danger { background: #f44336; }
            .merchant-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: left; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="phonepe-logo">📱 PhonePe Demo</div>
            <h2>Payment Gateway Simulation</h2>
            <div class="merchant-info">
              <strong>Merchant:</strong> CakesBuy<br>
              <strong>Transaction ID:</strong> ${merchantTransactionId}<br>
              <strong>Order Amount:</strong> ₹${amount}
            </div>
            <div class="amount">₹${amount}</div>
            <p>This is a demo payment gateway for testing purposes.</p>
            <p>Click one of the buttons below to simulate payment result:</p>
            
            <button class="btn btn-success" onclick="processPayment('success')">
              ✅ Simulate Success
            </button>
            <button class="btn btn-danger" onclick="processPayment('failure')">
              ❌ Simulate Failure
            </button>
            
            <script>
              function processPayment(result) {
                if (result === 'success') {
                  // Simulate successful payment
                  fetch('/api/payments/phonepe/demo-callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      merchantTransactionId: '${merchantTransactionId}',
                      status: 'COMPLETED'
                    })
                  }).then(() => {
                    window.location.href = '/payment/phonepe/callback?merchantTransactionId=${merchantTransactionId}';
                  });
                } else {
                  // Simulate failed payment
                  fetch('/api/payments/phonepe/demo-callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      merchantTransactionId: '${merchantTransactionId}',
                      status: 'FAILED'
                    })
                  }).then(() => {
                    window.location.href = '/payment/failure?transactionId=${merchantTransactionId}&error=demo_payment_failed';
                  });
                }
              }
            </script>
          </div>
        </body>
      </html>
    `);
  });

  // Demo callback handler
  app.post("/api/payments/phonepe/demo-callback", async (req, res) => {
    try {
      const { merchantTransactionId, status } = req.body;
      
      // Update transaction status
      await storage.updatePhonePeTransaction(merchantTransactionId, {
        status: status === 'COMPLETED' ? 'success' : 'failed',
        phonepeTransactionId: 'DEMO_TXN_' + Date.now(),
        responseCode: status === 'COMPLETED' ? 'PAYMENT_SUCCESS' : 'PAYMENT_FAILED'
      });

      // Get transaction to update order
      const transaction = await storage.getPhonePeTransactionByMerchantId(merchantTransactionId);
      if (transaction) {
        if (status === 'COMPLETED') {
          await storage.updateOrderPaymentStatus(transaction.orderId, 'paid', 'phonepe');
        } else {
          await storage.updateOrderPaymentStatus(transaction.orderId, 'failed', 'phonepe');
        }
      }

      res.json({ success: true, status });
    } catch (error) {
      console.error('Demo callback error:', error);
      res.status(500).json({ error: 'Demo callback failed' });
    }
  });

  // Order Assignment Routes
  app.post("/api/admin/orders/:orderId/assign", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { deliveryBoyId, deliveryPrice } = req.body;

      if (!deliveryBoyId) {
        return res.status(400).json({ message: "Delivery boy ID is required" });
      }

      // Update delivery fee if provided
      if (deliveryPrice !== undefined) {
        await storage.updateOrder(orderId, { deliveryFee: deliveryPrice.toString() });
      }

      // Assign order to delivery boy
      await storage.assignOrderToDeliveryBoy(orderId, deliveryBoyId);
      
      // Get order and delivery boy details for notification
      const order = await storage.getOrder(orderId);
      const deliveryBoy = await storage.getDeliveryBoy(deliveryBoyId);
      
      if (order && deliveryBoy) {
        // Send notification to delivery boy
        const notificationResult = await notifyOrderAssignment(deliveryBoy, order);
        console.log(`Order ${order.orderNumber} assigned to ${deliveryBoy.name}:`, {
          realTimeNotification: notificationResult.realTime ? 'sent' : 'failed',
          emailNotification: notificationResult.email ? 'sent' : 'failed'
        });
      }
      
      res.json({ message: "Order assigned successfully" });
    } catch (error) {
      console.error('Order assignment error:', error);
      res.status(500).json({ message: "Failed to assign order" });
    }
  });

  // Delivery boy rejection route
  app.post("/api/delivery/orders/:orderId/reject", authenticateDeliveryBoy, async (req: DeliveryBoyAuthRequest, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { reason } = req.body;

      if (!req.deliveryBoy) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if order is assigned to this delivery boy
      const order = await storage.getOrder(orderId);
      if (!order || order.deliveryBoyId !== req.deliveryBoy.id) {
        return res.status(403).json({ message: "Order not assigned to you" });
      }

      // Unassign the delivery boy and add rejection reason to special instructions
      const currentInstructions = order.specialInstructions || '';
      const rejectionNote = `\n[REJECTED by ${req.deliveryBoy.name}: ${reason || 'No reason provided'}]`;
      
      await storage.updateOrder(orderId, {
        deliveryBoyId: null,
        assignedAt: null,
        specialInstructions: currentInstructions + rejectionNote
      });

      res.json({ message: "Order rejected successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject order" });
    }
  });

  app.get("/api/admin/delivery-boys/:id/orders", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const status = req.query.status as string;
      
      const orders = await storage.getDeliveryBoyOrders(id, status);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch delivery boy orders" });
    }
  });

  // Delivery Boy App Routes
  app.get("/api/delivery/profile", authenticateDeliveryBoy, async (req: DeliveryBoyAuthRequest, res) => {
    try {
      if (!req.deliveryBoy) {
        return res.status(401).json({ message: "Delivery boy not authenticated" });
      }

      const deliveryBoy = await storage.getDeliveryBoy(req.deliveryBoy.id);
      if (!deliveryBoy) {
        return res.status(404).json({ message: "Delivery boy not found" });
      }

      const { password, ...safeDeliveryBoy } = deliveryBoy;
      res.json(safeDeliveryBoy);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get("/api/delivery/orders", authenticateDeliveryBoy, async (req: DeliveryBoyAuthRequest, res) => {
    try {
      if (!req.deliveryBoy) {
        return res.status(401).json({ message: "Delivery boy not authenticated" });
      }

      const status = req.query.status as string;
      const orders = await storage.getDeliveryBoyOrders(req.deliveryBoy.id, status);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get delivery boy stats
  app.get("/api/delivery/stats", authenticateDeliveryBoy, async (req: DeliveryBoyAuthRequest, res) => {
    try {
      if (!req.deliveryBoy) {
        return res.status(401).json({ message: "Delivery boy not authenticated" });
      }

      const allOrders = await storage.getDeliveryBoyOrders(req.deliveryBoy.id);
      const deliveredOrders = allOrders.filter(order => order.status === 'delivered');
      const totalOrders = allOrders.length;
      const totalEarnings = deliveredOrders.reduce((sum, order) => sum + Number(order.deliveryFee || 0), 0);
      const averageRating = deliveredOrders.length > 0 ? (4.5 + Math.random() * 0.5).toFixed(1) : "0.0"; // Simulated rating
      
      // Calculate monthly stats
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyDeliveries = deliveredOrders.filter(order => {
        const orderDate = new Date(order.deliveryDate);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      }).length;
      
      const monthlyEarnings = deliveredOrders
        .filter(order => {
          const orderDate = new Date(order.deliveryDate);
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        })
        .reduce((sum, order) => sum + Number(order.deliveryFee || 0), 0);

      // Calculate weekly stats
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyDeliveries = deliveredOrders.filter(order => {
        const orderDate = new Date(order.deliveryDate);
        return orderDate >= weekAgo;
      }).length;

      const stats = {
        totalOrders,
        deliveredOrders: deliveredOrders.length,
        totalEarnings: totalEarnings.toFixed(2),
        averageRating: parseFloat(averageRating),
        monthlyDeliveries,
        monthlyEarnings: monthlyEarnings.toFixed(2),
        weeklyDeliveries,
        successRate: totalOrders > 0 ? ((deliveredOrders.length / totalOrders) * 100).toFixed(1) : "0.0",
        avgDeliveryTime: "25 mins", // Simulated
        onTimeDeliveryRate: "94%"    // Simulated
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get delivery boy order history with pagination
  app.get("/api/delivery/order-history", authenticateDeliveryBoy, async (req: DeliveryBoyAuthRequest, res) => {
    try {
      if (!req.deliveryBoy) {
        return res.status(401).json({ message: "Delivery boy not authenticated" });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      
      const allOrders = await storage.getDeliveryBoyOrders(req.deliveryBoy.id, status);
      const sortedOrders = allOrders.sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime());
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedOrders = sortedOrders.slice(startIndex, endIndex);
      
      res.json({
        orders: paginatedOrders,
        pagination: {
          page,
          limit,
          total: allOrders.length,
          pages: Math.ceil(allOrders.length / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order history" });
    }
  });

  app.patch("/api/delivery/orders/:orderId/status", authenticateDeliveryBoy, async (req: DeliveryBoyAuthRequest, res) => {
    try {
      if (!req.deliveryBoy) {
        return res.status(401).json({ message: "Delivery boy not authenticated" });
      }

      const orderId = parseInt(req.params.orderId);
      const { status } = req.body;

      // Validate that the order is assigned to this delivery boy
      const order = await storage.getOrder(orderId);
      if (!order || order.deliveryBoyId !== req.deliveryBoy.id) {
        return res.status(403).json({ message: "Order not assigned to you" });
      }

      await storage.updateOrderAssignment(orderId, status, req.deliveryBoy.id);
      
      // Handle payment and delivery completion when order is delivered
      if (status === 'delivered') {
        const deliveryBoy = await storage.getDeliveryBoy(req.deliveryBoy.id);
        const order = await storage.getOrder(orderId);
        if (deliveryBoy && order) {
          const deliveryEarning = parseFloat(order.deliveryFee || '0');
          
          // Update delivery boy stats
          await storage.updateDeliveryBoy(req.deliveryBoy.id, {
            totalDeliveries: (deliveryBoy.totalDeliveries || 0) + 1,
            totalEarnings: ((parseFloat(deliveryBoy.totalEarnings || '0')) + deliveryEarning).toString()
          });
          
          // Process payment for COD orders
          if (order.paymentMethod === 'cod' && order.paymentStatus === 'pending') {
            // Mark payment as completed for COD orders upon delivery
            await storage.updateOrder(orderId, {
              paymentStatus: 'completed',
              updatedAt: new Date()
            });
            
            // Add loyalty points for the order (1 point per ₹10 spent)
            const loyaltyPoints = Math.floor(order.total / 10);
            if (order.userId && loyaltyPoints > 0) {
              const user = await storage.getUser(order.userId);
              if (user) {
                await storage.updateUser(order.userId, {
                  loyaltyPoints: (user.loyaltyPoints || 0) + loyaltyPoints
                });
                
                // Check for tier upgrade
                const newPoints = (user.loyaltyPoints || 0) + loyaltyPoints;
                let newTier = user.loyaltyTier || 'Bronze';
                if (newPoints >= 10000) newTier = 'Platinum';
                else if (newPoints >= 5000) newTier = 'Gold';
                else if (newPoints >= 1000) newTier = 'Silver';
                
                if (newTier !== user.loyaltyTier) {
                  await storage.updateUser(order.userId, { loyaltyTier: newTier });
                }
              }
            }
          }
        }
      }

      res.json({ message: "Order status updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Order Rating Routes
  
  // Get order rating page (for public access via rating URL)
  app.get("/api/orders/:orderId/rating", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const existingRating = await storage.getOrderRating(orderId);
      
      res.json({
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          items: order.items,
          total: order.total,
          deliveryDate: order.deliveryDate,
          deliveryAddress: order.deliveryAddress,
          status: order.status
        },
        rating: existingRating
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order rating data" });
    }
  });

  // Submit order rating (public access)
  app.post("/api/orders/:orderId/rating", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const ratingData = orderRatingSchema.parse(req.body);
      
      // Verify order exists and is delivered
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      if (order.status !== 'delivered') {
        return res.status(400).json({ message: "Order must be delivered before rating" });
      }
      
      // Check if rating already exists
      const existingRating = await storage.getOrderRating(orderId);
      
      if (existingRating && existingRating.overallRating > 0) {
        // Update existing rating
        await storage.updateOrderRating(existingRating.id, {
          ...ratingData,
          updatedAt: new Date()
        });
        res.json({ message: "Rating updated successfully" });
      } else {
        // Create new rating or update placeholder
        if (existingRating) {
          await storage.updateOrderRating(existingRating.id, {
            ...ratingData,
            updatedAt: new Date()
          });
        } else {
          await storage.createOrderRating({
            orderId,
            ...ratingData,
            feedbackEmailSent: false
          });
        }
        res.json({ message: "Rating submitted successfully" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rating data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit rating" });
    }
  });

  // Send rating email for delivered order (admin/system use)
  app.post("/api/orders/:orderId/send-rating-email", requireAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      if (order.status !== 'delivered') {
        return res.status(400).json({ message: "Order must be delivered before sending rating email" });
      }
      
      let user = null;
      if (order.userId) {
        user = await storage.getUser(order.userId);
      }
      
      let customerEmail = req.body.customerEmail;
      const customerName = order.deliveryAddress.name;
      
      // If no email provided, try to get from delivery address or user
      if (!customerEmail) {
        customerEmail = order.deliveryAddress.email;
        
        // If no email in delivery address and order has user, get from user
        if (!customerEmail && order.userId) {
          customerEmail = user?.email;
        }
      }
      
      if (!customerEmail) {
        return res.status(400).json({ message: "Customer email is required" });
      }
      
      await sendRatingRequestEmail(orderId, customerEmail, customerName, order.orderNumber);
      await storage.updateOrderRatingEmailStatus(orderId, true);
      res.json({ message: "Rating email sent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send rating email" });
    }
  });

  // Get all ratings for admin
  app.get("/api/admin/ratings", requireAdmin, async (req, res) => {
    try {
      // This would need to be implemented in storage
      // For now, return empty array
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  // Helper function to generate slug from name
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Helper function to generate URL from category and name
  async function generateUrl(name: string, categoryId?: number): Promise<string> {
    if (categoryId) {
      const category = await storage.getCategory(categoryId);
      if (category) {
        return `/category/${category.slug}`;
      }
    }
    // Fallback to using name as slug
    return `/${generateSlug(name)}`;
  }

  // Navigation Items API routes
  app.get("/api/navigation-items", async (req, res) => {
    try {
      const items = await storage.getNavigationItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch navigation items" });
    }
  });

  // Admin Navigation Items Management
  app.get("/api/admin/navigation-items", requireAdmin, async (req, res) => {
    try {
      const items = await storage.getAllNavigationItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch navigation items" });
    }
  });

  app.post("/api/admin/navigation-items", requireAdmin, async (req, res) => {
    try {
      const { insertNavigationItemSchema } = await import("@shared/schema");
      const itemData = insertNavigationItemSchema.parse(req.body);
      
      // Auto-generate slug if not provided
      if (!itemData.slug || itemData.slug.trim() === '') {
        itemData.slug = generateSlug(itemData.name);
      }
      
      // Auto-generate URL if not provided
      if (!itemData.url || itemData.url.trim() === '') {
        itemData.url = await generateUrl(itemData.name, itemData.categoryId);
      }
      
      // Auto-assign position if not provided
      if (!itemData.position && itemData.position !== 0) {
        const existingItems = await storage.getAllNavigationItems();
        itemData.position = existingItems.length;
      }
      
      const newItem = await storage.createNavigationItem(itemData);
      res.json(newItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid navigation item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create navigation item" });
    }
  });

  app.put("/api/admin/navigation-items/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { insertNavigationItemSchema } = await import("@shared/schema");
      const updateData = insertNavigationItemSchema.partial().parse(req.body);
      
      // Auto-generate slug if not provided but name is provided
      if (updateData.name && (!updateData.slug || updateData.slug.trim() === '')) {
        updateData.slug = generateSlug(updateData.name);
      }
      
      // Auto-generate URL if not provided but name or categoryId is provided
      if ((!updateData.url || updateData.url.trim() === '') && (updateData.name || updateData.categoryId !== undefined)) {
        // Get the current item to use existing name if not provided
        const currentItem = await storage.getNavigationItem(id);
        const nameToUse = updateData.name || currentItem?.name || '';
        const categoryIdToUse = updateData.categoryId !== undefined ? updateData.categoryId : currentItem?.categoryId;
        
        if (nameToUse) {
          updateData.url = await generateUrl(nameToUse, categoryIdToUse);
        }
      }
      
      await storage.updateNavigationItem(id, updateData);
      res.json({ message: "Navigation item updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid navigation item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update navigation item" });
    }
  });

  app.delete("/api/admin/navigation-items/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteNavigationItem(id);
      res.json({ message: "Navigation item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete navigation item" });
    }
  });

  app.post("/api/admin/navigation-items/reorder", requireAdmin, async (req, res) => {
    try {
      const { itemIds } = req.body;
      
      if (!Array.isArray(itemIds)) {
        return res.status(400).json({ message: "itemIds must be an array" });
      }
      
      await storage.reorderNavigationItems(itemIds);
      res.json({ message: "Navigation items reordered successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reorder navigation items" });
    }
  });

  // ==========================================
  // PAGES MANAGEMENT ROUTES
  // ==========================================

  // Public route to get published pages
  app.get("/api/pages", async (req, res) => {
    try {
      const pages = await storage.getPublishedPages();
      res.json(pages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pages" });
    }
  });

  // Public route to get a specific page by slug
  app.get("/api/pages/:slug", async (req, res) => {
    try {
      const page = await storage.getPageBySlug(req.params.slug);
      if (!page || !page.isPublished) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json(page);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch page" });
    }
  });

  // Admin routes for pages management
  app.get("/api/admin/pages", requireAdmin, async (req, res) => {
    try {
      const pages = await storage.getPages();
      res.json(pages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pages" });
    }
  });

  app.get("/api/admin/pages/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const page = await storage.getPage(id);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json(page);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch page" });
    }
  });

  app.post("/api/admin/pages", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertPageSchema.parse(req.body);
      
      // Check if slug already exists
      const existingPage = await storage.getPageBySlug(validatedData.slug);
      if (existingPage) {
        return res.status(400).json({ message: "A page with this slug already exists" });
      }

      const page = await storage.createPage({
        ...validatedData,
        createdBy: req.user!.id,
        updatedBy: req.user!.id
      });
      
      res.json(page);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid page data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create page" });
    }
  });

  app.put("/api/admin/pages/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPageSchema.partial().parse(req.body);

      // Check if slug already exists (excluding current page)
      if (validatedData.slug) {
        const existingPage = await storage.getPageBySlug(validatedData.slug);
        if (existingPage && existingPage.id !== id) {
          return res.status(400).json({ message: "A page with this slug already exists" });
        }
      }

      await storage.updatePage(id, {
        ...validatedData,
        updatedBy: req.user!.id
      });
      
      res.json({ message: "Page updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid page data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update page" });
    }
  });

  app.delete("/api/admin/pages/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePage(id);
      res.json({ message: "Page deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete page" });
    }
  });

  // ==========================================
  // PAGINATED ADMIN API ROUTES
  // ==========================================

  // Paginated Users API
  app.get("/api/admin/users/paginated", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || "";
      
      const result = await storage.getUsersPaginated(page, limit, search);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Paginated Categories API
  app.get("/api/admin/categories/paginated", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || "";
      
      const result = await storage.getCategoriesPaginated(page, limit, search);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Paginated Cakes API
  app.get("/api/admin/cakes/paginated", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || "";
      
      const result = await storage.getCakesPaginated(page, limit, search);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cakes" });
    }
  });

  // Paginated Addons API
  app.get("/api/admin/addons/paginated", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || "";
      
      const result = await storage.getAddonsPaginated(page, limit, search);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch addons" });
    }
  });

  // Paginated Orders API
  app.get("/api/admin/orders/paginated", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || "";
      
      const result = await storage.getOrdersPaginated(page, limit, search);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Paginated Pages API
  app.get("/api/admin/pages/paginated", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || "";
      
      const result = await storage.getPagesPaginated(page, limit, search);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pages" });
    }
  });

  // Setup WhatsApp admin routes
  setupWhatsAppAdminRoutes(app);

  // Vendor Registration
  app.post("/api/vendors/register", async (req, res) => {
    try {
      const vendorData = vendorRegisterSchema.parse(req.body);
      
      // Check if vendor already exists
      const existingVendorByEmail = await storage.getVendorByEmail(vendorData.email);
      if (existingVendorByEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const existingVendorByPhone = await storage.getVendorByPhone(vendorData.phone);
      if (existingVendorByPhone) {
        return res.status(400).json({ message: "Phone number already registered" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(vendorData.password);
      
      // Create vendor
      const newVendor = await storage.createVendor({
        ...vendorData,
        password: hashedPassword,
        isActive: false, // Vendors need admin approval
        isVerified: false
      });
      
      res.status(201).json({
        message: "Vendor registration successful. Please wait for admin approval.",
        vendor: {
          id: newVendor.id,
          name: newVendor.name,
          email: newVendor.email,
          phone: newVendor.phone,
          businessName: newVendor.businessName,
          isActive: newVendor.isActive,
          isVerified: newVendor.isVerified
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      console.error("Vendor registration error:", error);
      res.status(500).json({ message: "Failed to register vendor" });
    }
  });

  // Vendor Login
  app.post("/api/vendors/login", async (req, res) => {
    try {
      const { phone, password } = vendorLoginSchema.parse(req.body);
      
      const vendor = await storage.getVendorByPhone(phone);
      if (!vendor) {
        return res.status(401).json({ message: "Invalid phone or password" });
      }
      
      if (!vendor.isActive) {
        return res.status(401).json({ message: "Vendor account is not active. Please contact admin." });
      }
      
      const isPasswordValid = await comparePasswords(password, vendor.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid phone or password" });
      }
      
      const token = generateVendorToken(vendor.id, vendor.phone, vendor.email, vendor.name);
      
      res.json({
        message: "Login successful",
        vendor: {
          id: vendor.id,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          businessName: vendor.businessName,
          isActive: vendor.isActive,
          isVerified: vendor.isVerified
        },
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to login vendor" });
    }
  });

  // Vendor Dashboard - Get vendor info
  app.get("/api/vendors/me", authenticateVendor, async (req: VendorAuthRequest, res) => {
    try {
      if (!req.vendor) {
        return res.status(401).json({ message: "Vendor not authenticated" });
      }
      
      const vendor = await storage.getVendor(req.vendor.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      res.json({
        vendor: {
          id: vendor.id,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          businessName: vendor.businessName,
          address: vendor.address,
          description: vendor.description,
          isActive: vendor.isActive,
          isVerified: vendor.isVerified
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vendor info" });
    }
  });

  // Vendor Orders - Get orders assigned to vendor
  app.get("/api/vendors/orders", authenticateVendor, async (req: VendorAuthRequest, res) => {
    try {
      if (!req.vendor) {
        return res.status(401).json({ message: "Vendor not authenticated" });
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await storage.getVendorOrders(req.vendor.id, page, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching vendor orders:", error);
      res.status(500).json({ message: "Failed to fetch vendor orders", error: error.message });
    }
  });

  // Vendor Update Order Status
  app.patch("/api/vendors/orders/:id/status", authenticateVendor, async (req: VendorAuthRequest, res) => {
    try {
      if (!req.vendor) {
        return res.status(401).json({ message: "Vendor not authenticated" });
      }
      
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["confirmed", "preparing", "out_for_delivery", "delivered"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Verify order belongs to vendor
      const order = await storage.getOrder(orderId);
      if (!order || order.vendorId !== req.vendor.id) {
        return res.status(404).json({ message: "Order not found or not assigned to you" });
      }
      
      // Update order status
      await storage.updateOrderStatus(orderId, status);
      
      res.json({ message: "Order status updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Admin Vendor Management
  app.get("/api/admin/vendors", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || "";
      
      const result = await storage.getVendorsPaginated(page, limit, search);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  // Admin Approve Vendor
  app.patch("/api/admin/vendors/:id/approve", requireAdmin, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Admin not authenticated" });
      }
      
      const vendorId = parseInt(req.params.id);
      await storage.approveVendor(vendorId, req.user.id);
      
      res.json({ message: "Vendor approved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve vendor" });
    }
  });

  // Admin Deactivate Vendor
  app.patch("/api/admin/vendors/:id/deactivate", requireAdmin, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);
      await storage.deactivateVendor(vendorId);
      
      res.json({ message: "Vendor deactivated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate vendor" });
    }
  });

  // Admin Assign Order to Vendor
  app.patch("/api/admin/orders/:id/assign-vendor", requireAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { vendorId, vendorPrice } = req.body;
      
      if (!vendorId) {
        return res.status(400).json({ message: "Vendor ID is required" });
      }
      
      if (!vendorPrice || isNaN(parseFloat(vendorPrice))) {
        return res.status(400).json({ message: "Valid vendor price is required" });
      }
      
      await storage.assignOrderToVendor(orderId, vendorId, parseFloat(vendorPrice));
      
      res.json({ message: "Order assigned to vendor successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to assign order to vendor" });
    }
  });

  const server = httpServer || createServer(app);
  return server;
}
