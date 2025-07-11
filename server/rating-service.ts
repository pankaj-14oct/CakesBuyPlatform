import { sendEmail } from "./email-service";
import { OrderRating, Order, User } from "@shared/schema";

interface RatingEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderTotal: string;
  deliveryDate: string;
  items: string[];
  ratingUrl: string;
}

export async function sendRatingRequestEmail(orderId: number, customerEmail: string, customerName: string, orderNumber: string): Promise<boolean> {
  try {
    // Import storage to get order data
    const { storage } = await import("./storage");
    
    // Get order data
    const order = await storage.getOrder(orderId);
    if (!order) {
      console.error(`Order not found for rating email: ${orderId}`);
      return false;
    }

    // Create rating URL
    const ratingUrl = `${process.env.REPLIT_APP_URL || 'http://localhost:5000'}/rate-order/${orderId}`;

    // Extract order items for email
    const orderItems = order.items.map((item: any) => `${item.name} (${item.weight})`);

    const emailData: RatingEmailData = {
      orderNumber,
      customerName,
      customerEmail,
      orderTotal: `₹${parseFloat(order.total).toFixed(2)}`,
      deliveryDate: new Date(order.deliveryDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      items: orderItems,
      ratingUrl
    };

    const emailContent = generateRatingEmailTemplate(emailData);

    const result = await sendEmail(
      customerEmail,
      'How was your CakesBuy experience? Share your feedback!',
      emailContent.text,
      emailContent.html
    );

    return result;
  } catch (error) {
    console.error('Error sending rating request email:', error);
    return false;
  }
}

function generateRatingEmailTemplate(data: RatingEmailData): { text: string; html: string } {
  const text = `
Dear ${data.customerName},

Thank you for choosing CakesBuy! Your recent order has been delivered.

Order Details:
- Order Number: ${data.orderNumber}
- Delivery Date: ${data.deliveryDate}
- Items: ${data.items.join(', ')}
- Total: ${data.orderTotal}

We hope you loved your delicious 100% eggless cake! Your feedback helps us serve you better.

Please take a moment to rate your experience:
${data.ratingUrl}

Your review helps other customers make informed decisions and helps us improve our service.

Thank you for being a valued customer!

Best regards,
Team CakesBuy
🍰 100% Eggless Cake Shop
📧 support@cakesbuy.com
📞 +91-XXXXXXXXXX
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rate Your CakesBuy Experience</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; background: linear-gradient(135deg, #D2691E, #8B4513); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D2691E; }
    .rating-button { display: inline-block; background: #D2691E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .rating-button:hover { background: #8B4513; }
    .footer { text-align: center; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
    .star-rating { font-size: 24px; color: #FFD700; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍰 Thank You for Your Order!</h1>
      <p>Your delicious 100% eggless cake has been delivered</p>
    </div>
    
    <div class="content">
      <p>Dear <strong>${data.customerName}</strong>,</p>
      
      <p>We hope you absolutely loved your fresh, delicious cake from CakesBuy! Your order has been successfully delivered, and we'd love to hear about your experience.</p>
      
      <div class="order-details">
        <h3>📋 Order Summary</h3>
        <p><strong>Order Number:</strong> ${data.orderNumber}</p>
        <p><strong>Delivery Date:</strong> ${data.deliveryDate}</p>
        <p><strong>Items:</strong> ${data.items.join(', ')}</p>
        <p><strong>Total:</strong> ${data.orderTotal}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <div class="star-rating">⭐⭐⭐⭐⭐</div>
        <h3>How was your experience?</h3>
        <p>Your feedback helps us improve and helps other customers make informed decisions.</p>
        <a href="${data.ratingUrl}" class="rating-button">Rate Your Experience</a>
      </div>
      
      <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <h4>🎯 What we'd love to know:</h4>
        <ul>
          <li>How did you find the taste and quality?</li>
          <li>Was the delivery on time?</li>
          <li>How was the packaging?</li>
          <li>Would you recommend us to friends?</li>
        </ul>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>CakesBuy - 100% Eggless Cake Shop</strong></p>
      <p>📧 support@cakesbuy.com | 📞 +91-XXXXXXXXXX</p>
      <p>Thank you for choosing CakesBuy for your sweet moments! 🍰</p>
    </div>
  </div>
</body>
</html>
`;

  return { text, html };
}

export async function processDeliveredOrders() {
  // This function would be called periodically to send rating emails
  // for recently delivered orders that haven't received rating emails yet
  try {
    // Implementation would fetch delivered orders from the last 24 hours
    // that haven't had rating emails sent yet
    console.log('Processing delivered orders for rating requests...');
    
    // This would be implemented with actual database queries
    // and would be called by a cron job or scheduled task
    
    return true;
  } catch (error) {
    console.error('Error processing delivered orders:', error);
    return false;
  }
}