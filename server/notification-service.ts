import { WebSocket } from 'ws';
import { sendOrderAssignmentPush } from './push-service.js';
import type { Order, DeliveryBoy } from '../shared/schema.js';

// Store active WebSocket connections for delivery boys
const deliveryBoyConnections = new Map<number, WebSocket>();

// Store active WebSocket connections for admin users
const adminConnections = new Map<number, WebSocket>();

export interface NotificationData {
  type: 'order_assigned' | 'order_updated' | 'order_cancelled' | 'connected' | 'new_order';
  orderId?: number;
  orderNumber?: string;
  message: string;
  timestamp: string;
  orderDetails?: {
    customerName: string;
    customerPhone: string;
    amount: number;
    address: string;
  };
}

/**
 * Register a delivery boy's WebSocket connection for real-time notifications
 */
export function registerDeliveryBoyConnection(deliveryBoyId: number, ws: WebSocket) {
  deliveryBoyConnections.set(deliveryBoyId, ws);
  
  // Clean up connection when it closes
  ws.on('close', () => {
    deliveryBoyConnections.delete(deliveryBoyId);
  });
  
  ws.on('error', () => {
    deliveryBoyConnections.delete(deliveryBoyId);
  });
}

/**
 * Send real-time notification to delivery boy via WebSocket
 */
export function sendRealTimeNotification(deliveryBoyId: number, notification: NotificationData) {
  const connection = deliveryBoyConnections.get(deliveryBoyId);
  if (connection && connection.readyState === WebSocket.OPEN) {
    connection.send(JSON.stringify(notification));
    return true;
  }
  return false;
}

/**
 * Send email notification to delivery boy about order assignment
 */
export async function sendOrderAssignmentEmail(
  deliveryBoy: DeliveryBoy,
  order: Order,
  orderDetails: any
): Promise<boolean> {
  const subject = `New Order Assigned - ${order.orderNumber}`;
  
  const customerInfo = typeof order.deliveryAddress === 'string' 
    ? JSON.parse(order.deliveryAddress) 
    : order.deliveryAddress;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🚚 New Delivery Assignment</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">CakesBuy - Delivery Partner</p>
      </div>
      
      <div style="padding: 30px;">
        <h2 style="color: #8B4513; margin-bottom: 20px;">Hi ${deliveryBoy.name}!</h2>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          A new order has been assigned to you. Please check your delivery app for details.
        </p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #8B4513;">📦 Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Order Number:</td>
              <td style="padding: 8px 0;">${order.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Customer:</td>
              <td style="padding: 8px 0;">${customerInfo.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
              <td style="padding: 8px 0;">${customerInfo.phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Delivery Address:</td>
              <td style="padding: 8px 0;">${customerInfo.address}, ${customerInfo.city} - ${customerInfo.pincode}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Order Value:</td>
              <td style="padding: 8px 0;">₹${order.total}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Delivery Fee:</td>
              <td style="padding: 8px 0;">₹${order.deliveryFee || '0'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Payment Method:</td>
              <td style="padding: 8px 0;">${order.paymentMethod.toUpperCase()}</td>
            </tr>
            ${order.deliveryDate ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Delivery Date:</td>
              <td style="padding: 8px 0;">${new Date(order.deliveryDate).toLocaleDateString()}</td>
            </tr>
            ` : ''}
            ${order.deliverySlot ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Delivery Slot:</td>
              <td style="padding: 8px 0;">${order.deliverySlot}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        ${order.specialInstructions ? `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #856404;">📝 Special Instructions</h4>
          <p style="margin-bottom: 0;">${order.specialInstructions}</p>
        </div>
        ` : ''}
        
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #155724;">📱 Next Steps</h4>
          <ol style="margin-bottom: 0; padding-left: 20px;">
            <li>Open your delivery app to view full order details</li>
            <li>Contact the customer if needed: ${customerInfo.phone}</li>
            <li>Pick up the order from our store</li>
            <li>Update delivery status in the app</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #666; font-size: 14px;">
            If you need to reject this order, please do so promptly through the delivery app.
          </p>
        </div>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          CakesBuy - 100% Eggless Cake Shop<br>
          Gurgaon Delivery Partner Network
        </p>
      </div>
    </div>
  `;

  try {
    const { sendEmail } = await import('./email-service.js');
    return await sendEmail(deliveryBoy.email, subject, '', html);
  } catch (error) {
    console.error('Failed to send order assignment email:', error);
    return false;
  }
}

/**
 * Send comprehensive notification (both real-time and email) when order is assigned
 */
export async function notifyOrderAssignment(
  deliveryBoy: DeliveryBoy,
  order: Order,
  orderDetails?: any
): Promise<{ realTime: boolean; email: boolean }> {
  // Parse customer info from delivery address
  const customerInfo = typeof order.deliveryAddress === 'string' 
    ? JSON.parse(order.deliveryAddress) 
    : order.deliveryAddress;

  // Prepare notification data with full order details
  const notification: NotificationData = {
    type: 'order_assigned',
    orderId: order.id,
    orderNumber: order.orderNumber,
    message: `🚨 URGENT: New Order ${order.orderNumber} assigned to you!`,
    timestamp: new Date().toISOString(),
    orderDetails: {
      customerName: customerInfo.name || 'Unknown Customer',
      customerPhone: customerInfo.phone || '',
      amount: Number(order.total) || 0,
      address: `${customerInfo.address}, ${customerInfo.city} - ${customerInfo.pincode}` || 'Address not available'
    }
  };

  // Send real-time notification
  const realTimeSuccess = sendRealTimeNotification(deliveryBoy.id, notification);

  // Send email notification
  const emailSuccess = await sendOrderAssignmentEmail(deliveryBoy, order, orderDetails);

  // Send push notification for background alerts (when app is closed)
  let pushSuccess = false;
  try {
    const { sendOrderAssignmentPush } = await import('./push-service.js');
    const pushResponse = await sendOrderAssignmentPush(deliveryBoy.id, {
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      customerName: notification.orderDetails?.customerName || 'Customer',
      customerPhone: notification.orderDetails?.customerPhone || '',
      address: notification.orderDetails?.address || ''
    });
    pushSuccess = pushResponse.success;
    console.log(`Push notification ${pushSuccess ? 'sent' : 'failed'} for delivery boy ${deliveryBoy.id}`);
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }

  return {
    realTime: realTimeSuccess,
    email: emailSuccess,
    push: pushSuccess
  };
}

/**
 * Send notification when order is reassigned or unassigned
 */
export async function notifyOrderUpdate(
  deliveryBoyId: number,
  order: Order,
  message: string
): Promise<boolean> {
  const notification: NotificationData = {
    type: 'order_updated',
    orderId: order.id,
    orderNumber: order.orderNumber,
    message,
    timestamp: new Date().toISOString()
  };

  return sendRealTimeNotification(deliveryBoyId, notification);
}

/**
 * Get all active delivery boy connections count
 */
export function getActiveDeliveryBoyConnections(): number {
  return deliveryBoyConnections.size;
}

/**
 * Get specific delivery boy connection status
 */
export function isDeliveryBoyOnline(deliveryBoyId: number): boolean {
  const connection = deliveryBoyConnections.get(deliveryBoyId);
  return connection ? connection.readyState === WebSocket.OPEN : false;
}

/**
 * Register an admin user's WebSocket connection for real-time notifications
 */
export function registerAdminConnection(adminId: number, ws: WebSocket) {
  adminConnections.set(adminId, ws);
  
  // Clean up connection when it closes
  ws.on('close', () => {
    adminConnections.delete(adminId);
  });
  
  ws.on('error', () => {
    adminConnections.delete(adminId);
  });
}

/**
 * Send real-time notification to admin via WebSocket
 */
export function sendAdminNotification(adminId: number, notification: NotificationData) {
  const connection = adminConnections.get(adminId);
  if (connection && connection.readyState === WebSocket.OPEN) {
    connection.send(JSON.stringify(notification));
    return true;
  }
  return false;
}

/**
 * Send notification to all connected admins
 */
export function broadcastToAdmins(notification: NotificationData) {
  let sentCount = 0;
  for (const [adminId, connection] of adminConnections) {
    if (connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(notification));
      sentCount++;
    }
  }
  return sentCount;
}

/**
 * Send notification when a new order is placed
 */
export async function notifyNewOrder(order: any, orderDetails: any) {
  const notification: NotificationData = {
    type: 'new_order',
    orderId: order.id,
    orderNumber: order.orderNumber,
    message: `🚨 NEW ORDER: ${order.orderNumber} from ${orderDetails.customerName} - ₹${order.total}`,
    timestamp: new Date().toISOString(),
    orderDetails: {
      customerName: orderDetails.customerName,
      customerPhone: orderDetails.customerPhone,
      amount: order.total,
      address: orderDetails.address
    }
  };

  // Send to all connected admins
  const sentCount = broadcastToAdmins(notification);
  
  console.log(`New order notification sent to ${sentCount} admin(s)`);
  
  return {
    realTimeNotification: sentCount > 0 ? 'sent' : 'no_admins_online',
    adminCount: sentCount
  };
}

/**
 * Get all active admin connections count
 */
export function getActiveAdminConnections(): number {
  return adminConnections.size;
}