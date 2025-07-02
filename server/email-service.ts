import { MailService } from '@sendgrid/mail';

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
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
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