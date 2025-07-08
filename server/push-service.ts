import webpush from 'web-push';
import { db } from './db.js';
import { pushSubscriptions } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

// VAPID keys from environment variables
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || ''
};

// Configure web-push
if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    'mailto:support@cakesbuy.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  console.log('✅ VAPID keys configured for push notifications');
} else {
  console.warn('⚠️ VAPID keys not configured. Push notifications will not work.');
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Save push subscription for a delivery boy
 */
export async function savePushSubscription(deliveryBoyId: number, subscription: any) {
  try {
    await db.insert(pushSubscriptions).values({
      deliveryBoyId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      isActive: true
    }).onConflictDoUpdate({
      target: pushSubscriptions.deliveryBoyId,
      set: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        isActive: true,
        updatedAt: new Date()
      }
    });
    
    console.log(`Push subscription saved for delivery boy ${deliveryBoyId}`);
    return { success: true };
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return { success: false, error: 'Failed to save subscription' };
  }
}

/**
 * Send push notification to specific delivery boy
 */
export async function sendPushNotification(deliveryBoyId: number, payload: PushNotificationPayload) {
  try {
    // Get delivery boy's push subscription
    const subscription = await db.select().from(pushSubscriptions)
      .where(eq(pushSubscriptions.deliveryBoyId, deliveryBoyId))
      .limit(1);

    if (!subscription.length || !subscription[0].isActive) {
      console.log(`No active push subscription found for delivery boy ${deliveryBoyId}`);
      return { success: false, error: 'No active subscription' };
    }

    const sub = subscription[0];
    
    // Construct push subscription object
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    };

    // Default notification payload
    const notificationPayload = {
      title: payload.title || '🚚 CakesBuy Delivery',
      body: payload.body || 'New notification',
      icon: payload.icon || '/delivery-icon-192.svg',
      badge: payload.badge || '/delivery-icon-192.svg',
      tag: 'delivery-notification',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      data: payload.data || {},
      actions: payload.actions || [
        {
          action: 'view',
          title: 'View Orders',
          icon: '/delivery-icon-192.svg'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    // Send push notification
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(notificationPayload)
    );

    console.log(`Push notification sent to delivery boy ${deliveryBoyId}`);
    return { success: true };
    
  } catch (error) {
    console.error('Error sending push notification:', error);
    
    // If subscription is invalid, mark as inactive
    if (error.statusCode === 410) {
      await db.update(pushSubscriptions)
        .set({ isActive: false })
        .where(eq(pushSubscriptions.deliveryBoyId, deliveryBoyId));
      console.log(`Marked inactive push subscription for delivery boy ${deliveryBoyId}`);
    }
    
    return { success: false, error: 'Failed to send notification' };
  }
}

/**
 * Send order assignment push notification
 */
export async function sendOrderAssignmentPush(deliveryBoyId: number, orderDetails: any) {
  const payload: PushNotificationPayload = {
    title: '🚚 New Order Assignment!',
    body: `Order ${orderDetails.orderNumber} has been assigned to you. Total: ₹${orderDetails.total}`,
    icon: '/delivery-icon-192.svg',
    badge: '/delivery-icon-192.svg',
    data: {
      orderId: orderDetails.id,
      orderNumber: orderDetails.orderNumber,
      type: 'order_assignment'
    },
    actions: [
      {
        action: 'view',
        title: 'View Order',
        icon: '/delivery-icon-192.svg'
      },
      {
        action: 'dismiss',
        title: 'Later'
      }
    ]
  };

  return await sendPushNotification(deliveryBoyId, payload);
}

/**
 * Get VAPID public key for frontend subscription
 */
export function getVapidPublicKey() {
  return vapidKeys.publicKey;
}

/**
 * Remove push subscription for delivery boy
 */
export async function removePushSubscription(deliveryBoyId: number) {
  try {
    await db.update(pushSubscriptions)
      .set({ isActive: false })
      .where(eq(pushSubscriptions.deliveryBoyId, deliveryBoyId));
    
    console.log(`Push subscription removed for delivery boy ${deliveryBoyId}`);
    return { success: true };
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return { success: false, error: 'Failed to remove subscription' };
  }
}