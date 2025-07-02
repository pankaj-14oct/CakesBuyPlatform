import { MailService } from '@sendgrid/mail';
import { Order } from '../shared/schema';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set. Email reminders will be disabled.");
}

let mailService: MailService | null = null;

if (process.env.SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!mailService) {
    console.warn('SendGrid not configured. Email not sent:', params.subject);
    return false;
  }

  try {
    const mailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
    };
    
    if (params.text) {
      mailData.text = params.text;
    }
    
    if (params.html) {
      mailData.html = params.html;
    }

    await mailService.send(mailData);
    console.log(`Email sent successfully to ${params.to}: ${params.subject}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export interface ReminderEmailData {
  userEmail: string;
  userName: string;
  eventType: 'birthday' | 'anniversary';
  eventDate: string;
  discountCode?: string;
  discountPercentage?: number;
}

export async function sendReminderEmail(data: ReminderEmailData): Promise<boolean> {
  const eventTypeText = data.eventType === 'birthday' ? 'Birthday' : 'Anniversary';
  const discountText = data.discountCode && data.discountPercentage 
    ? `Get ${data.discountPercentage}% off with code ${data.discountCode}!` 
    : 'Special discount available!';

  const subject = `🎉 ${eventTypeText} Reminder - ${discountText}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B4513; margin: 0; font-size: 28px;">🎂 EgglessCakes</h1>
          <p style="color: #666; margin: 5px 0 0 0;">100% Eggless Cakes for Special Moments</p>
        </div>
        
        <h2 style="color: #8B4513; text-align: center; margin-bottom: 20px;">
          🎉 ${eventTypeText} Reminder!
        </h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Dear ${data.userName || 'Valued Customer'},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          A special ${data.eventType} is coming up on <strong>${data.eventDate}</strong>! 
          Make it memorable with our delicious 100% eggless cakes.
        </p>
        
        ${data.discountCode && data.discountPercentage ? `
          <div style="background-color: #f0f8ff; border: 2px dashed #8B4513; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px;">
            <h3 style="color: #8B4513; margin: 0 0 10px 0;">🎁 Special Offer</h3>
            <p style="font-size: 18px; margin: 5px 0; color: #333;">
              <strong>${data.discountPercentage}% OFF</strong> on your ${data.eventType} cake!
            </p>
            <p style="font-size: 16px; margin: 5px 0; color: #666;">
              Use code: <strong style="color: #8B4513; font-size: 20px;">${data.discountCode}</strong>
            </p>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.REPLIT_DEV_DOMAIN || 'https://your-domain.com'}" 
             style="background-color: #8B4513; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
            Order Your Cake Now
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
          <p>🚚 <strong>Free delivery</strong> on orders above ₹500</p>
          <p>⏰ <strong>Same day delivery</strong> available in Gurgaon</p>
          <p>🌱 <strong>100% Eggless</strong> - Perfect for everyone!</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
          <p>EgglessCakes - Making your celebrations sweeter!</p>
          <p>Call us: +91-XXXXXXXXXX | Email: info@egglesscakes.com</p>
        </div>
      </div>
    </div>
  `;

  const text = `
    ${eventTypeText} Reminder!
    
    Dear ${data.userName || 'Valued Customer'},
    
    A special ${data.eventType} is coming up on ${data.eventDate}! 
    Make it memorable with our delicious 100% eggless cakes.
    
    ${data.discountCode && data.discountPercentage ? 
      `Special Offer: ${data.discountPercentage}% OFF with code ${data.discountCode}!` : 
      ''}
    
    Order now at ${process.env.REPLIT_DEV_DOMAIN || 'https://your-domain.com'}
    
    Free delivery on orders above ₹500
    Same day delivery available in Gurgaon
    100% Eggless - Perfect for everyone!
    
    EgglessCakes - Making your celebrations sweeter!
  `;

  return await sendEmail({
    to: data.userEmail,
    from: 'noreply@egglesscakes.com', // You'll need to verify this domain with SendGrid
    subject,
    text,
    html
  });
}

// Order notification functions
export interface OrderEmailData {
  customerEmail: string;
  customerName: string;
  order: Order;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  const { customerEmail, customerName, order } = data;
  
  const subject = `🎂 Order Confirmed - ${order.orderNumber} | EgglessCakes`;
  
  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B4513; margin: 0; font-size: 28px;">🎂 EgglessCakes</h1>
          <p style="color: #666; margin: 5px 0 0 0;">100% Eggless Cakes for Special Moments</p>
        </div>
        
        <div style="background-color: #e8f5e8; border-left: 4px solid #4CAF50; padding: 15px; margin-bottom: 30px;">
          <h2 style="color: #4CAF50; margin: 0 0 10px 0;">✅ Order Confirmed!</h2>
          <p style="margin: 0; font-size: 16px;">Your delicious eggless cake order has been confirmed.</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Dear ${customerName},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Thank you for choosing EgglessCakes! Your order has been confirmed and we're preparing your delicious 100% eggless cake.
        </p>
        
        <div style="background-color: #f8f8f8; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #8B4513; margin: 0 0 15px 0;">📋 Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; color: #666;">Order Number:</td>
              <td style="padding: 5px 0; font-weight: bold; color: #333;">${order.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666;">Order Total:</td>
              <td style="padding: 5px 0; font-weight: bold; color: #8B4513; font-size: 18px;">${formatPrice(parseFloat(order.total || '0'))}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666;">Delivery Date:</td>
              <td style="padding: 5px 0; font-weight: bold; color: #333;">${new Date(order.deliveryDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666;">Payment Status:</td>
              <td style="padding: 5px 0; font-weight: bold; color: ${order.paymentStatus === 'paid' ? '#4CAF50' : '#FF9800'};">
                ${order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
              </td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #f8f8f8; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #8B4513; margin: 0 0 15px 0;">🍰 Order Items</h3>
          ${order.items.map(item => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0; margin-bottom: 10px;">
              <div style="font-weight: bold; color: #333; margin-bottom: 5px;">${item.name}</div>
              <div style="color: #666; font-size: 14px;">
                Weight: ${item.weight} | Flavor: ${item.flavor} | Qty: ${item.quantity}
              </div>
              ${item.customMessage ? `<div style="color: #666; font-size: 14px; font-style: italic;">Message: "${item.customMessage}"</div>` : ''}
              <div style="text-align: right; color: #8B4513; font-weight: bold;">${formatPrice(item.price)}</div>
            </div>
          `).join('')}
        </div>
        
        <div style="background-color: #f8f8f8; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #8B4513; margin: 0 0 15px 0;">🚚 Delivery Address</h3>
          <div style="color: #333;">
            <strong>${order.deliveryAddress.name}</strong><br>
            ${order.deliveryAddress.phone}<br>
            ${order.deliveryAddress.address}<br>
            ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}
            ${order.deliveryAddress.landmark ? `<br>Landmark: ${order.deliveryAddress.landmark}` : ''}
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.REPLIT_DEV_DOMAIN || 'https://your-domain.com'}/track-order" 
             style="background-color: #FF4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
            Track Your Order
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
          <p>📱 <strong>Track your order:</strong> Use order number ${order.orderNumber}</p>
          <p>🎂 <strong>Fresh baked:</strong> We start baking only after order confirmation</p>
          <p>🚚 <strong>Timely delivery:</strong> We'll deliver right on time for your special moment</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
          <p>EgglessCakes - Making your celebrations sweeter!</p>
          <p>Call us: +91-XXXXXXXXXX | Email: info@egglesscakes.com</p>
        </div>
      </div>
    </div>
  `;

  const text = `
    Order Confirmed - ${order.orderNumber}
    
    Dear ${customerName},
    
    Thank you for choosing EgglessCakes! Your order has been confirmed.
    
    Order Details:
    - Order Number: ${order.orderNumber}
    - Total: ${formatPrice(parseFloat(order.total || '0'))}
    - Delivery Date: ${new Date(order.deliveryDate).toLocaleDateString('en-IN')}
    - Payment Status: ${order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
    
    Delivery Address:
    ${order.deliveryAddress.name}
    ${order.deliveryAddress.phone}
    ${order.deliveryAddress.address}
    ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}
    
    Track your order at: ${process.env.REPLIT_DEV_DOMAIN || 'https://your-domain.com'}/track-order
    
    EgglessCakes - Making your celebrations sweeter!
  `;

  return await sendEmail({
    to: customerEmail,
    from: 'orders@egglesscakes.com',
    subject,
    text,
    html
  });
}

export async function sendOrderStatusUpdateEmail(data: OrderEmailData): Promise<boolean> {
  const { customerEmail, customerName, order } = data;
  
  const statusMessages = {
    pending: { title: '⏳ Order Received', message: 'We have received your order and will confirm it shortly.' },
    confirmed: { title: '✅ Order Confirmed', message: 'Your order has been confirmed and we are preparing it.' },
    preparing: { title: '👨‍🍳 Baking in Progress', message: 'Our bakers are crafting your delicious eggless cake!' },
    out_for_delivery: { title: '🚚 Out for Delivery', message: 'Your cake is on its way to you!' },
    delivered: { title: '🎉 Order Delivered', message: 'Your cake has been delivered. Enjoy your sweet moments!' },
    cancelled: { title: '❌ Order Cancelled', message: 'Your order has been cancelled. If you have any questions, please contact us.' }
  };
  
  const statusInfo = statusMessages[order.status as keyof typeof statusMessages] || statusMessages.pending;
  const subject = `${statusInfo.title} - Order ${order.orderNumber} | EgglessCakes`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B4513; margin: 0; font-size: 28px;">🎂 EgglessCakes</h1>
          <p style="color: #666; margin: 5px 0 0 0;">100% Eggless Cakes for Special Moments</p>
        </div>
        
        <div style="background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin-bottom: 30px;">
          <h2 style="color: #2196F3; margin: 0 0 10px 0;">${statusInfo.title}</h2>
          <p style="margin: 0; font-size: 16px;">${statusInfo.message}</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Dear ${customerName},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Your order <strong>${order.orderNumber}</strong> status has been updated.
        </p>
        
        <div style="background-color: #f8f8f8; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #8B4513; margin: 0 0 15px 0;">📋 Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; color: #666;">Order Number:</td>
              <td style="padding: 5px 0; font-weight: bold; color: #333;">${order.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666;">Current Status:</td>
              <td style="padding: 5px 0; font-weight: bold; color: #2196F3;">${statusInfo.title}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666;">Delivery Date:</td>
              <td style="padding: 5px 0; font-weight: bold; color: #333;">${new Date(order.deliveryDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
          </table>
        </div>
        
        ${order.status === 'out_for_delivery' ? `
          <div style="background-color: #fff3e0; border: 1px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="color: #ff9800; margin: 0 0 10px 0;">🚚 Delivery Information</h3>
            <p style="margin: 0; color: #333;">
              Your cake will be delivered to:<br>
              <strong>${order.deliveryAddress.name}</strong><br>
              ${order.deliveryAddress.address}<br>
              ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}
            </p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
              Please ensure someone is available to receive the delivery.
            </p>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.REPLIT_DEV_DOMAIN || 'https://your-domain.com'}/track-order" 
             style="background-color: #FF4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
            Track Your Order
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
          <p>EgglessCakes - Making your celebrations sweeter!</p>
          <p>Call us: +91-XXXXXXXXXX | Email: info@egglesscakes.com</p>
        </div>
      </div>
    </div>
  `;

  const text = `
    ${statusInfo.title} - Order ${order.orderNumber}
    
    Dear ${customerName},
    
    ${statusInfo.message}
    
    Order Details:
    - Order Number: ${order.orderNumber}
    - Current Status: ${statusInfo.title}
    - Delivery Date: ${new Date(order.deliveryDate).toLocaleDateString('en-IN')}
    
    Track your order at: ${process.env.REPLIT_DEV_DOMAIN || 'https://your-domain.com'}/track-order
    
    EgglessCakes - Making your celebrations sweeter!
  `;

  return await sendEmail({
    to: customerEmail,
    from: 'orders@egglesscakes.com',
    subject,
    text,
    html
  });
}