// Admin WhatsApp status endpoint
import type { Express } from 'express';
import { whatsAppService } from './whatsapp-service';
import type { AuthRequest } from './auth';
import { storage } from './storage';

// Admin middleware
const requireAdmin = async (req: AuthRequest, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    const decoded = jwt.default.verify(token, JWT_SECRET) as any;
    
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if user is admin (phone number 1111111111 is admin)
    if (user.phone !== '1111111111') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: 'admin'
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export function setupWhatsAppAdminRoutes(app: Express) {
  // Get WhatsApp connection status
  app.get("/api/admin/whatsapp/status", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const status = whatsAppService.getStatus();
      res.json({
        connected: status.connected,
        qrGenerated: status.qrGenerated,
        message: status.connected 
          ? "WhatsApp is connected and ready for notifications" 
          : status.qrGenerated 
            ? "WhatsApp QR code generated - scan to connect"
            : "WhatsApp is initializing..."
      });
    } catch (error) {
      console.error('WhatsApp status error:', error);
      res.status(500).json({ error: 'Failed to get WhatsApp status' });
    }
  });

  // Test WhatsApp message sending
  app.post("/api/admin/whatsapp/test", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { phone, message } = req.body;
      
      if (!phone || !message) {
        return res.status(400).json({ error: 'Phone number and message are required' });
      }

      // This would send a test message if WhatsApp is connected
      const status = whatsAppService.getStatus();
      if (!status.connected) {
        return res.status(400).json({ 
          error: 'WhatsApp not connected',
          status: status.qrGenerated ? 'QR code ready for scanning' : 'Initializing...'
        });
      }

      // For now, just return success
      res.json({ 
        success: true, 
        message: 'Test message functionality ready (implementation pending connection)',
        phone,
        testMessage: message
      });
    } catch (error) {
      console.error('WhatsApp test error:', error);
      res.status(500).json({ error: 'Failed to send test message' });
    }
  });
}