import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    phone: string;
    email: string;
    role?: string;
  };
}

export interface DeliveryBoyAuthRequest extends Request {
  deliveryBoy?: {
    id: number;
    phone: string;
    name: string;
  };
}

export const generateToken = (userId: number, phone: string, email: string): string => {
  return jwt.sign({ userId, phone, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const generateDeliveryBoyToken = (deliveryBoyId: number, phone: string, name: string): string => {
  return jwt.sign({ deliveryBoyId, phone, name, type: 'delivery_boy' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      phone: user.phone,
      email: user.email
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    
    if (user) {
      req.user = {
        id: user.id,
        phone: user.phone,
        email: user.email
      };
    }
  } catch (error) {
    // Invalid token, but continue without authentication
  }
  
  next();
};

export const authenticateDeliveryBoy = async (req: DeliveryBoyAuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.type !== 'delivery_boy') {
      return res.status(401).json({ message: 'Invalid token type' });
    }
    
    const deliveryBoy = await storage.getDeliveryBoy(decoded.deliveryBoyId);
    
    if (!deliveryBoy || !deliveryBoy.isActive) {
      return res.status(401).json({ message: 'Invalid token or account disabled' });
    }

    req.deliveryBoy = {
      id: deliveryBoy.id,
      phone: deliveryBoy.phone,
      name: deliveryBoy.name
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
/**
 * Authenticate delivery boy token and return delivery boy info (for WebSocket)
 */
export const authenticateDeliveryBoyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== "delivery_boy") {
      return null;
    }

    return {
      id: decoded.deliveryBoyId,
      phone: decoded.phone,
      name: decoded.name
    };
  } catch (error) {
    return null;
  }
};
