import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import { registerDeliveryBoyConnection, registerAdminConnection } from "./notification-service.js";
import { authenticateDeliveryBoyToken } from "./auth.js";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Seed database on startup in development
  if (app.get("env") === "development") {
    await seedDatabase().catch(console.error);
  }

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server for delivery boy notifications
  const deliveryWss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws/delivery' 
  });

  deliveryWss.on('connection', (ws, req) => {
    log('Delivery WebSocket connection established from:', req.url);
    
    // Authenticate delivery boy from query parameters or headers
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');
    
    log('Delivery WebSocket token received:', token ? 'Yes' : 'No');
    
    if (!token) {
      log('Delivery WebSocket authentication failed: No token provided');
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      const deliveryBoy = authenticateDeliveryBoyToken(token);
      if (deliveryBoy) {
        registerDeliveryBoyConnection(deliveryBoy.id, ws);
        log(`Delivery boy ${deliveryBoy.name} (ID: ${deliveryBoy.id}) connected via WebSocket`);
        
        // Send welcome message
        ws.send(JSON.stringify({
          type: 'connected',
          message: 'Successfully connected to delivery notifications',
          timestamp: new Date().toISOString()
        }));
      } else {
        log('Delivery WebSocket authentication failed: Invalid token');
        ws.close(1008, 'Invalid authentication token');
      }
    } catch (error) {
      log('Delivery WebSocket authentication failed:', error);
      ws.close(1008, 'Authentication failed');
    }
  });

  // Setup WebSocket server for admin notifications
  const adminWss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws/admin' 
  });

  adminWss.on('connection', (ws, req) => {
    log('Admin WebSocket connection established from:', req.url);
    
    // Authenticate admin from query parameters or headers
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');
    
    log('Admin WebSocket token received:', token ? 'Yes' : 'No');
    
    if (!token) {
      log('Admin WebSocket authentication failed: No token provided');
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      // Verify admin JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production') as any;
      
      if (decoded && decoded.userId && decoded.role === 'admin') {
        registerAdminConnection(decoded.userId, ws);
        log(`Admin user (ID: ${decoded.userId}) connected via WebSocket`);
        
        // Send welcome message
        ws.send(JSON.stringify({
          type: 'connected',
          message: 'Successfully connected to admin notifications',
          timestamp: new Date().toISOString()
        }));
      } else {
        log('Admin WebSocket authentication failed: Invalid token or not admin');
        ws.close(1008, 'Invalid authentication token');
      }
    } catch (error) {
      log('Admin WebSocket authentication failed:', error);
      ws.close(1008, 'Authentication failed');
    }
  });

  const server = await registerRoutes(app, httpServer);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  httpServer.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    log(`WebSocket server available at ws://localhost:${port}/ws/delivery`);
    log(`Admin WebSocket server available at ws://localhost:${port}/ws/admin`);
  });
})();
