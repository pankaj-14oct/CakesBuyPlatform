import nodemailer from 'nodemailer';
import { Order } from '../shared/schema';

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.warn("Gmail credentials not set. Email reminders will be disabled.");
  console.warn("Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.");
}

let transporter: nodemailer.Transporter | null = null;

if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  // Clean up the app password by removing any spaces
  const cleanPassword = process.env.GMAIL_APP_PASSWORD.replace(/\s/g, '');
  
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: cleanPassword
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  
  // Verify connection (but don't fail startup if it fails)
  if (transporter) {
    transporter.verify(function(error, success) {
      if (error) {
        console.error('Gmail SMTP connection error:', error.message);
        console.error('Please check your Gmail credentials and ensure:');
        console.error('1. GMAIL_USER is your full Gmail address');
        console.error('2. GMAIL_APP_PASSWORD is a 16-character app password (not your regular password)');
        console.error('3. 2-factor authentication is enabled on your Gmail account');
        console.error('4. App password is generated from Gmail Security settings');
        console.error('5. App password should be 16 characters without spaces');
        console.error('6. Make sure "Less secure app access" is NOT enabled (use App Password instead)');
      } else {
        console.log('Gmail SMTP server is ready to send emails');
      }
    });
  }
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
  if (!transporter) {
    console.error('Gmail transporter not configured. Email not sent:', subject);
    console.error('Check GMAIL_USER and GMAIL_APP_PASSWORD environment variables');
    return false;
  }

  try {
    console.log(`Attempting to send email to: ${to}, subject: ${subject}`);
    
    const mailOptions = {
      from: `"CakesBuy" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html || text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}: ${subject}`, { messageId: result.messageId });
    return true;
  } catch (error) {
    console.error('Gmail email error details:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      to: to,
      subject: subject
    });
    return false;
  }
}

// Legacy function for backwards compatibility
export async function sendEmailWithParams(params: EmailParams): Promise<boolean> {
  return sendEmail(params.to, params.subject, params.text || '', params.html);
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
  console.log('Preparing reminder email with data:', JSON.stringify(data, null, 2));
  
  const eventTypeText = data.eventType === 'birthday' ? 'Birthday' : 'Anniversary';
  const discountText = data.discountCode && data.discountPercentage 
    ? `Get ${data.discountPercentage}% off with code ${data.discountCode}!` 
    : 'Special discount available!';

  const subject = `🎉 ${eventTypeText} Reminder - ${discountText}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B4513; margin: 0; font-size: 28px;">🎂 CakesBuy</h1>
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
          <p>CakesBuy - Making your celebrations sweeter!</p>
          <p>Call us: +91-XXXXXXXXXX | Email: info@cakesbuy.com</p>
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
    
    CakesBuy - Making your celebrations sweeter!
  `;

  return await sendEmail(data.userEmail, subject, text, html);
}

// Order notification functions
export interface OrderEmailData {
  customerEmail: string;
  customerName: string;
  order: Order;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  const { customerEmail, customerName, order } = data;
  
  const subject = `🎂 Order Confirmed - ${order.orderNumber} | CakesBuy`;
  
  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B4513; margin: 0; font-size: 28px;">🎂 CakesBuy</h1>
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
          Thank you for choosing CakesBuy! Your order has been confirmed and we're preparing your delicious 100% eggless cake.
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
          <p>CakesBuy - Making your celebrations sweeter!</p>
          <p>Call us: +91-XXXXXXXXXX | Email: info@cakesbuy.com</p>
        </div>
      </div>
    </div>
  `;

  const text = `
    Order Confirmed - ${order.orderNumber}
    
    Dear ${customerName},
    
    Thank you for choosing CakesBuy! Your order has been confirmed.
    
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
    
    CakesBuy - Making your celebrations sweeter!
  `;

  return await sendEmail(customerEmail, subject, text, html);
}

export interface WelcomeEmailData {
  userEmail: string;
  userName: string;
  userPhone: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const subject = `🎉 Welcome to CakesBuy! Your Account is Ready`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B4513; margin: 0; font-size: 28px;">🎂 CakesBuy</h1>
          <p style="color: #666; margin: 5px 0 0 0;">100% Eggless Cakes for Special Moments</p>
        </div>
        
        <div style="background-color: #e8f5e8; border-left: 4px solid #4CAF50; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
          <h2 style="color: #4CAF50; margin: 0 0 10px 0;">🎉 Welcome to CakesBuy!</h2>
          <p style="margin: 0; font-size: 16px;">Congratulations! Your account has been successfully created.</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Dear ${data.userName},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Welcome to CakesBuy - Gurgaon's premier destination for 100% eggless cakes! We're thrilled to have you join our sweet family.
        </p>
        
        <div style="background-color: #f8f8f8; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #8B4513; margin: 0 0 15px 0;">📋 Your Account Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 30%;">Name:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">${data.userName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Email:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">${data.userEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Phone:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">${data.userPhone}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #fff3e0; border: 1px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #ff9800; margin: 0 0 15px 0;">🎁 What's Next?</h3>
          <ul style="margin: 0; padding-left: 20px; color: #333;">
            <li style="margin-bottom: 8px;">Browse our delicious collection of 100% eggless cakes</li>
            <li style="margin-bottom: 8px;">Add your delivery addresses for quick checkout</li>
            <li style="margin-bottom: 8px;">Set up birthday and anniversary reminders for special discounts</li>
            <li style="margin-bottom: 8px;">Earn loyalty points with every order</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.REPLIT_DEV_DOMAIN || 'https://your-domain.com'}" 
             style="background-color: #8B4513; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
            Start Shopping Now
          </a>
        </div>
        
        <div style="background-color: #f0f8ff; border: 1px solid #2196F3; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #2196F3; margin: 0 0 15px 0;">🌟 Why Choose CakesBuy?</h3>
          <div style="color: #333; font-size: 14px;">
            <p style="margin: 5px 0;">🥚 <strong>100% Eggless:</strong> Perfect for vegetarians and health-conscious customers</p>
            <p style="margin: 5px 0;">🚚 <strong>Same Day Delivery:</strong> Fresh cakes delivered in Gurgaon</p>
            <p style="margin: 5px 0;">🎂 <strong>Custom Orders:</strong> Personalized messages and designs</p>
            <p style="margin: 5px 0;">💝 <strong>Loyalty Program:</strong> Earn points and get exclusive rewards</p>
            <p style="margin: 5px 0;">📱 <strong>Easy Ordering:</strong> Simple online ordering process</p>
          </div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
          <p>🎉 <strong>First Order Tip:</strong> Orders above ₹500 get FREE delivery!</p>
          <p>📞 <strong>Need Help?:</strong> Contact us anytime for assistance</p>
          <p>🔔 <strong>Stay Updated:</strong> Follow us for latest offers and new cake launches</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
          <p>CakesBuy - Making your celebrations sweeter!</p>
          <p>Call us: +91-XXXXXXXXXX | Email: order.cakesbuy@gmail.com</p>
        </div>
      </div>
    </div>
  `;

  const text = `
    Welcome to CakesBuy!
    
    Dear ${data.userName},
    
    Congratulations! Your account has been successfully created.
    
    Welcome to CakesBuy - Gurgaon's premier destination for 100% eggless cakes! 
    We're thrilled to have you join our sweet family.
    
    Your Account Details:
    - Name: ${data.userName}
    - Email: ${data.userEmail}
    - Phone: ${data.userPhone}
    
    What's Next?
    - Browse our delicious collection of 100% eggless cakes
    - Add your delivery addresses for quick checkout
    - Set up birthday and anniversary reminders for special discounts
    - Earn loyalty points with every order
    
    Why Choose CakesBuy?
    - 100% Eggless: Perfect for vegetarians and health-conscious customers
    - Same Day Delivery: Fresh cakes delivered in Gurgaon
    - Custom Orders: Personalized messages and designs
    - Loyalty Program: Earn points and get exclusive rewards
    - Easy Ordering: Simple online ordering process
    
    Start shopping now at: ${process.env.REPLIT_DEV_DOMAIN || 'https://your-domain.com'}
    
    First Order Tip: Orders above ₹500 get FREE delivery!
    
    CakesBuy - Making your celebrations sweeter!
    Contact: order.cakesbuy@gmail.com
  `;

  return await sendEmail(data.userEmail, subject, text, html);
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
  const subject = `${statusInfo.title} - Order ${order.orderNumber} | CakesBuy`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B4513; margin: 0; font-size: 28px;">🎂 CakesBuy</h1>
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
          <p>CakesBuy - Making your celebrations sweeter!</p>
          <p>Call us: +91-XXXXXXXXXX | Email: info@cakesbuy.com</p>
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
    
    CakesBuy - Making your celebrations sweeter!
  `;

  return await sendEmail(customerEmail, subject, text, html);
}