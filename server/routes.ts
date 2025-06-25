import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertOrderSchema } from "@shared/schema";

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

  // Orders
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders/:orderNumber", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
