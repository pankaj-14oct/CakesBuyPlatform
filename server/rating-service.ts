import { sendEmail } from "./email-service";
import { OrderRating, Order, User } from "@shared/schema";

interface RatingEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderTotal: string;
  deliveryDate: string;
  deliveryTime: string;
  items: OrderItem[];
  subtotal: string;
  deliveryFee: string;
  discount?: string;
  paymentMethod: string;
  deliveryAddress: string;
  specialInstructions?: string;
  ratingUrl: string;
}

interface OrderItem {
  name: string;
  weight: string;
  flavor: string;
  price: string;
  customMessage?: string;
  hasPhotoCustomization?: boolean;
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

    // Extract order items with detailed information
    const orderItems: OrderItem[] = order.items.map((item: any) => ({
      name: item.name,
      weight: item.weight,
      flavor: item.flavor,
      price: `₹${parseFloat(item.price).toFixed(2)}`,
      customMessage: item.customMessage,
      hasPhotoCustomization: !!item.photoCustomization?.compositeImage
    }));

    // Format delivery address
    const deliveryAddress = typeof order.deliveryAddress === 'string' 
      ? order.deliveryAddress 
      : `${order.deliveryAddress.address}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}`;

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
      deliveryTime: order.deliveryTime || 'Standard Delivery',
      items: orderItems,
      subtotal: `₹${parseFloat(order.subtotal).toFixed(2)}`,
      deliveryFee: `₹${parseFloat(order.deliveryFee || '0').toFixed(2)}`,
      discount: order.discount ? `₹${parseFloat(order.discount).toFixed(2)}` : undefined,
      paymentMethod: order.paymentMethod?.toUpperCase() || 'COD',
      deliveryAddress,
      specialInstructions: order.specialInstructions,
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
  // Format items for text email
  const itemsText = data.items.map(item => {
    let itemStr = `- ${item.name} (${item.weight}, ${item.flavor}) - ${item.price}`;
    if (item.customMessage) itemStr += `\n  Custom Message: "${item.customMessage}"`;
    if (item.hasPhotoCustomization) itemStr += `\n  📸 Personalized Photo Cake`;
    return itemStr;
  }).join('\n');

  const text = `
Dear ${data.customerName},

Thank you for choosing CakesBuy! Your recent order has been successfully delivered.

📋 ORDER SUMMARY
Order Number: ${data.orderNumber}
Delivery Date: ${data.deliveryDate} (${data.deliveryTime})
Payment Method: ${data.paymentMethod}

🍰 ITEMS ORDERED
${itemsText}

💰 BILLING BREAKDOWN
Subtotal: ${data.subtotal}
Delivery Fee: ${data.deliveryFee}${data.discount ? `\nDiscount: -${data.discount}` : ''}
Total Paid: ${data.orderTotal}

📍 DELIVERED TO
${data.deliveryAddress}
${data.specialInstructions ? `\nSpecial Instructions: ${data.specialInstructions}` : ''}

We hope you absolutely loved your fresh, delicious 100% eggless cake! Your feedback helps us serve you better and helps other customers make informed decisions.

Please take a moment to rate your experience:
${data.ratingUrl}

What we'd love to know:
- How did you find the taste and quality?
- Was the delivery on time?
- How was the packaging?
- Would you recommend us to friends?

Thank you for being a valued customer!

Best regards,
Team CakesBuy
🍰 100% Eggless Cake Shop
📧 support@cakesbuy.com
📞 +91-XXXXXXXXXX
`;

  // Format items for HTML email
  const itemsHtml = data.items.map(item => `
    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 10px 0; border-left: 3px solid #D2691E;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <strong style="color: #D2691E;">${item.name}</strong>
        <span style="font-weight: bold;">${item.price}</span>
      </div>
      <div style="color: #666; font-size: 14px;">
        <span>Weight: ${item.weight}</span> • <span>Flavor: ${item.flavor}</span>
        ${item.hasPhotoCustomization ? '<br><span style="color: #e91e63;">📸 Personalized Photo Cake</span>' : ''}
        ${item.customMessage ? `<br><em>Custom Message: "${item.customMessage}"</em>` : ''}
      </div>
    </div>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rate Your CakesBuy Experience</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 650px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { text-align: center; background: linear-gradient(135deg, #D2691E, #8B4513); color: white; padding: 40px 20px; }
    .content { padding: 40px 30px; }
    .section { margin: 30px 0; }
    .order-details { background: #f8f9fa; padding: 25px; border-radius: 10px; border-left: 5px solid #D2691E; }
    .billing-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .billing-total { display: flex; justify-content: space-between; padding: 15px 0; font-weight: bold; font-size: 18px; color: #D2691E; border-top: 2px solid #D2691E; margin-top: 10px; }
    .rating-section { text-align: center; background: linear-gradient(135deg, #fff3e0, #ffe0b2); padding: 30px; border-radius: 10px; margin: 30px 0; }
    .rating-button { display: inline-block; background: #D2691E; color: white; padding: 18px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: all 0.3s; }
    .rating-button:hover { background: #8B4513; transform: translateY(-2px); }
    .footer { text-align: center; color: #666; margin-top: 40px; padding-top: 30px; border-top: 2px solid #eee; }
    .star-rating { font-size: 28px; margin: 15px 0; }
    .highlights { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .address-box { background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin: 15px 0; }
    h2 { color: #D2691E; margin-bottom: 20px; }
    h3 { color: #8B4513; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🍰 Thank You for Your Order!</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Your delicious 100% eggless cake has been delivered</p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 25px;">Dear <strong>${data.customerName}</strong>,</p>
      
      <p style="font-size: 16px; margin-bottom: 30px;">We hope you absolutely loved your fresh, delicious cake from CakesBuy! Your order has been successfully delivered, and we'd love to hear about your experience.</p>
      
      <div class="section">
        <h2>📋 Order Summary</h2>
        <div class="order-details">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div><strong>Order Number:</strong><br>${data.orderNumber}</div>
            <div><strong>Payment Method:</strong><br>${data.paymentMethod}</div>
            <div><strong>Delivery Date:</strong><br>${data.deliveryDate}</div>
            <div><strong>Delivery Time:</strong><br>${data.deliveryTime}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>🍰 Items Ordered</h2>
        ${itemsHtml}
      </div>

      <div class="section">
        <h2>💰 Billing Breakdown</h2>
        <div class="order-details">
          <div class="billing-row">
            <span>Subtotal:</span>
            <span>${data.subtotal}</span>
          </div>
          <div class="billing-row">
            <span>Delivery Fee:</span>
            <span>${data.deliveryFee}</span>
          </div>
          ${data.discount ? `
          <div class="billing-row" style="color: #28a745;">
            <span>Discount:</span>
            <span>-${data.discount}</span>
          </div>` : ''}
          <div class="billing-total">
            <span>Total Paid:</span>
            <span>${data.orderTotal}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>📍 Delivery Information</h2>
        <div class="address-box">
          <strong>Delivered to:</strong><br>
          ${data.deliveryAddress}
          ${data.specialInstructions ? `<br><br><strong>Special Instructions:</strong><br><em>${data.specialInstructions}</em>` : ''}
        </div>
      </div>
      
      <div class="rating-section">
        <div class="star-rating">⭐⭐⭐⭐⭐</div>
        <h3 style="margin: 15px 0; color: #333;">How was your experience?</h3>
        <p style="margin-bottom: 25px; color: #666;">Your feedback helps us improve and helps other customers make informed decisions.</p>
        <a href="${data.ratingUrl}" class="rating-button">Rate Your Experience Now</a>
      </div>
      
      <div class="highlights">
        <h4 style="color: #2e7d32; margin-bottom: 15px;">🎯 What we'd love to know:</h4>
        <ul style="color: #2e7d32; padding-left: 20px;">
          <li>How did you find the taste and quality of your cake?</li>
          <li>Was the delivery on time and professional?</li>
          <li>How was the packaging and presentation?</li>
          <li>Would you recommend CakesBuy to friends and family?</li>
          <li>Any suggestions for improvement?</li>
        </ul>
      </div>
      
      <div class="footer">
        <p style="margin-bottom: 15px; font-size: 18px; color: #D2691E;">
          <strong>🍰 CakesBuy - 100% Eggless Cake Shop</strong>
        </p>
        <p style="margin: 5px 0; color: #666;">
          📧 support@cakesbuy.com | 📞 +91-XXXXXXXXXX
        </p>
        <p style="margin: 5px 0; color: #999; font-size: 14px;">
          Freshly baked with love in Gurgaon | Same-day delivery available
        </p>
        <p style="margin-top: 20px; color: #999; font-size: 12px;">
          You received this email because you placed an order with CakesBuy. 
          If you have any questions, please contact our support team.
        </p>
      </div>
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