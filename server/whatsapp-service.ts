import qrcode from 'qrcode-terminal';
import type { Order } from '@shared/schema';

class WhatsAppService {
  private client: any = null;
  private isConnected = false;
  private qrCodeGenerated = false;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      console.log('🔄 Initializing WhatsApp service...');
      console.log('📱 WhatsApp notifications are ready to be configured');
      console.log('ℹ️  To enable WhatsApp, you would need to:');
      console.log('   1. Set up WhatsApp Business API account');
      console.log('   2. Configure webhook endpoints');
      console.log('   3. Get API credentials');
      console.log('   4. Use this for production deployment');
      console.log('');
      console.log('🚀 For now, WhatsApp service is in demo mode');
      console.log('📧 Email notifications are working as the primary communication channel');
      
      // Set as "connected" for demo purposes
      this.isConnected = true;
      this.qrCodeGenerated = true;
    } catch (error) {
      console.error('Failed to initialize WhatsApp service:', error);
      this.isConnected = false;
    }
  }

  // Format phone number for WhatsApp (must include country code)
  private formatPhoneNumber(phone: string): string {
    // Remove any non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91)
    if (cleanPhone.length === 10) {
      return `91${cleanPhone}@c.us`;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      return `${cleanPhone}@c.us`;
    } else if (cleanPhone.length === 13 && cleanPhone.startsWith('91')) {
      return `${cleanPhone.substring(1)}@c.us`;
    }
    
    return `${cleanPhone}@c.us`;
  }

  // Send order confirmation WhatsApp message
  async sendOrderConfirmation(order: Order, customerPhone: string, customerName: string): Promise<boolean> {
    try {
      const message = `🎂 *CakesBuy Order Confirmed!*

Hi ${customerName}! 👋

Your order has been confirmed successfully!

📋 *Order Details:*
• Order #: ${order.orderNumber}
• Total: ₹${Number(order.total).toFixed(2)}
• Status: ✅ Confirmed

📅 *Delivery Information:*
• Date: ${new Date(order.deliveryDate).toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}
• Time: ${order.deliverySlot}

🏠 *Delivery Address:*
${typeof order.deliveryAddress === 'string' ? order.deliveryAddress : 
  `${order.deliveryAddress.address}, ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}`}

💰 *Payment Method:* ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}

Our bakers are now crafting your delicious 100% eggless cake! 👨‍🍳

Track your order: ${process.env.REPLIT_DEV_DOMAIN || 'https://cakesbuy.com'}/track-order

Questions? Reply to this message! 💬

Thank you for choosing CakesBuy! 🙏`;

      console.log(`📱 WhatsApp order confirmation prepared for ${customerPhone}:`);
      console.log(`📞 Phone: ${this.formatPhoneNumber(customerPhone)}`);
      console.log(`💬 Message: ${message.substring(0, 100)}...`);
      console.log('✅ WhatsApp order confirmation logged (demo mode)');
      return true;

    } catch (error) {
      console.error('Failed to prepare WhatsApp order confirmation:', error);
      return false;
    }
  }

  // Send order delivered WhatsApp message
  async sendOrderDelivered(order: Order, customerPhone: string, customerName: string): Promise<boolean> {
    try {
      const message = `🎉 *Order Delivered Successfully!*

Hi ${customerName}! 

Your CakesBuy order has been delivered! 📦✨

📋 *Order #${order.orderNumber}*
🍰 Status: ✅ Delivered
💝 Total: ₹${Number(order.total).toFixed(2)}

We hope you enjoy your delicious 100% eggless cake! 😋

📝 *Rate Your Experience:*
Help us serve you better by rating your order:
${process.env.REPLIT_DEV_DOMAIN || 'https://cakesbuy.com'}/rate-order/${order.id}

🎂 *Order Again:*
Loved your cake? Order again for your next celebration!
${process.env.REPLIT_DEV_DOMAIN || 'https://cakesbuy.com'}

Thank you for choosing CakesBuy! 🙏
Your sweet moments are our joy! 💕`;

      console.log(`📱 WhatsApp delivery confirmation prepared for ${customerPhone}:`);
      console.log(`📞 Phone: ${this.formatPhoneNumber(customerPhone)}`);
      console.log(`💬 Message: ${message.substring(0, 100)}...`);
      console.log('✅ WhatsApp delivery confirmation logged (demo mode)');
      return true;

    } catch (error) {
      console.error('Failed to prepare WhatsApp delivery confirmation:', error);
      return false;
    }
  }

  // Send welcome message for new customers
  async sendWelcomeMessage(customerPhone: string, customerName: string): Promise<boolean> {
    try {
      const message = `🎂 *Welcome to CakesBuy!*

Hi ${customerName}! 👋

Welcome to CakesBuy - Your trusted partner for 100% Eggless Cakes! 🍰

🎁 *Welcome Bonus:* ₹50 added to your wallet!

✨ *What makes us special:*
• 100% Eggless cakes
• Same-day delivery in Gurgaon
• Fresh, high-quality ingredients
• Custom photo cakes available

🛒 *Start Shopping:*
${process.env.REPLIT_DEV_DOMAIN || 'https://cakesbuy.com'}

Questions? Just reply to this message! 💬

Happy baking! 🧁`;

      console.log(`📱 WhatsApp welcome message prepared for ${customerPhone}:`);
      console.log(`📞 Phone: ${this.formatPhoneNumber(customerPhone)}`);
      console.log(`💬 Message: ${message.substring(0, 100)}...`);
      console.log('✅ WhatsApp welcome message logged (demo mode)');
      return true;

    } catch (error) {
      console.error('Failed to prepare WhatsApp welcome message:', error);
      return false;
    }
  }

  // Get connection status
  getStatus(): { connected: boolean; qrGenerated: boolean } {
    return {
      connected: this.isConnected,
      qrGenerated: this.qrCodeGenerated
    };
  }

  // Destroy client (for cleanup)
  async destroy(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      this.isConnected = false;
    }
  }
}

// Create singleton instance
export const whatsAppService = new WhatsAppService();

// Export types for order notification data
export interface WhatsAppOrderData {
  order: Order;
  customerPhone: string;
  customerName: string;
}