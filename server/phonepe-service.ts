import axios from 'axios';
import crypto from 'crypto';
import { storage } from './storage';

// PhonePe Configuration
const PHONEPE_CONFIG = {
  // Test environment - Use demo mode if no credentials provided
  MERCHANT_ID: process.env.PHONEPE_MERCHANT_ID || 'DEMO_MERCHANT',
  SALT_KEY: process.env.PHONEPE_SALT_KEY || 'demo-salt-key',
  KEY_INDEX: process.env.PHONEPE_KEY_INDEX || '1',
  BASE_URL: process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  DEMO_MODE: !process.env.PHONEPE_MERCHANT_ID || process.env.PHONEPE_MERCHANT_ID === 'DEMO_MERCHANT',
};

// Generate unique transaction ID
function generateTransactionId(): string {
  return `T${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate checksum for verification
function generateChecksum(payload: string, endpoint: string): string {
  const string = payload + endpoint + PHONEPE_CONFIG.SALT_KEY;
  const sha256 = crypto.createHash('sha256').update(string).digest('hex');
  return sha256 + '###' + PHONEPE_CONFIG.KEY_INDEX;
}

// Verify checksum from PhonePe response
function verifyChecksum(payload: string, checksum: string, endpoint: string): boolean {
  const string = payload + endpoint + PHONEPE_CONFIG.SALT_KEY;
  const sha256 = crypto.createHash('sha256').update(string).digest('hex');
  const expectedChecksum = sha256 + '###' + PHONEPE_CONFIG.KEY_INDEX;
  return expectedChecksum === checksum;
}

export interface PhonePePaymentRequest {
  orderId: number;
  amount: number;
  userId?: number;
  userPhone: string;
  userName: string;
  userEmail?: string;
  redirectUrl: string;
  callbackUrl: string;
}

export interface PhonePePaymentResponse {
  success: boolean;
  code: string;
  message: string;
  data?: {
    merchantId: string;
    merchantTransactionId: string;
    instrumentResponse: {
      type: string;
      redirectInfo: {
        url: string;
        method: string;
      };
    };
  };
}

export interface PhonePeStatusResponse {
  success: boolean;
  code: string;
  message: string;
  data?: {
    merchantId: string;
    merchantTransactionId: string;
    transactionId: string;
    amount: number;
    state: string;
    responseCode: string;
    paymentInstrument: {
      type: string;
      utr?: string;
      maskedAccountNumber?: string;
      maskedMobileNumber?: string;
      bankId?: string;
      pgTransactionId?: string;
      pgAuthorizationCode?: string;
      arn?: string;
    };
  };
}

// Initiate PhonePe payment
export async function initiatePhonePePayment(request: PhonePePaymentRequest): Promise<PhonePePaymentResponse> {
  try {
    const merchantTransactionId = generateTransactionId();
    
    // Demo mode for testing without real PhonePe credentials
    if (PHONEPE_CONFIG.DEMO_MODE) {
      console.log('🧪 PhonePe Demo Mode: Simulating payment gateway');
      
      // Save demo transaction to database
      await storage.createPhonePeTransaction({
        orderId: request.orderId,
        merchantTransactionId: merchantTransactionId,
        amount: request.amount.toString(),
        status: 'demo_initiated',
        redirectUrl: request.redirectUrl,
        callbackUrl: request.callbackUrl,
      });

      // Create demo payment URL
      const demoPaymentUrl = `${request.redirectUrl.split('/payment')[0]}/payment/phonepe/demo?merchantTransactionId=${merchantTransactionId}&amount=${request.amount}`;
      
      return {
        success: true,
        code: 'PAYMENT_INITIATED',
        message: 'Demo payment initiated successfully',
        data: {
          merchantId: PHONEPE_CONFIG.MERCHANT_ID,
          merchantTransactionId: merchantTransactionId,
          instrumentResponse: {
            type: 'PAY_PAGE',
            redirectInfo: {
              url: demoPaymentUrl,
              method: 'GET'
            }
          }
        }
      };
    }
    
    // Payment payload
    const paymentData = {
      merchantId: PHONEPE_CONFIG.MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: request.userId ? `USER_${request.userId}` : `GUEST_${Date.now()}`,
      amount: Math.round(request.amount * 100), // Convert to paise
      redirectUrl: request.redirectUrl,
      redirectMode: 'POST',
      callbackUrl: request.callbackUrl,
      mobileNumber: request.userPhone,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    // Convert to base64
    const payload = JSON.stringify(paymentData);
    const payloadMain = Buffer.from(payload).toString('base64');

    // Generate checksum
    const checksum = generateChecksum(payloadMain, '/pg/v1/pay');

    // Save transaction to database
    await storage.createPhonePeTransaction({
      orderId: request.orderId,
      merchantTransactionId: merchantTransactionId,
      amount: request.amount.toString(),
      status: 'pending',
      redirectUrl: request.redirectUrl,
      callbackUrl: request.callbackUrl,
    });

    // API request options
    const options = {
      method: 'POST',
      url: `${PHONEPE_CONFIG.BASE_URL}/pg/v1/pay`,
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
      },
      data: {
        request: payloadMain
      }
    };

    // Make API call
    console.log('PhonePe API request:', options);
    const response = await axios.request(options);
    console.log('PhonePe API response:', response.data);
    
    if (response.data && response.data.success) {
      // Update transaction with checkout request ID
      await storage.updatePhonePeTransaction(merchantTransactionId, {
        checkoutRequestId: response.data.data.merchantTransactionId,
        status: 'initiated'
      });

      return {
        success: true,
        code: response.data.code,
        message: response.data.message,
        data: {
          ...response.data.data,
          merchantTransactionId: merchantTransactionId
        }
      };
    } else {
      await storage.updatePhonePeTransaction(merchantTransactionId, {
        status: 'failed',
        responseCode: response.data.code,
        responseMessage: response.data.message
      });

      return {
        success: false,
        code: response.data.code,
        message: response.data.message || 'Payment initiation failed'
      };
    }

  } catch (error: any) {
    console.error('PhonePe payment initiation error:', error);
    
    // Return a proper error response instead of throwing
    return {
      success: false,
      code: 'PAYMENT_ERROR',
      message: error.response?.data?.message || error.message || 'Failed to initiate PhonePe payment'
    };
  }
}

// Check payment status
export async function checkPhonePePaymentStatus(merchantTransactionId: string): Promise<PhonePeStatusResponse> {
  try {
    // Demo mode status check
    if (PHONEPE_CONFIG.DEMO_MODE) {
      const transaction = await storage.getPhonePeTransactionByMerchantId(merchantTransactionId);
      
      if (!transaction) {
        return {
          success: false,
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found'
        };
      }

      const demoState = transaction.status === 'success' ? 'COMPLETED' : 
                       transaction.status === 'failed' ? 'FAILED' : 'PENDING';

      return {
        success: true,
        code: 'PAYMENT_STATUS',
        message: 'Demo payment status retrieved',
        data: {
          merchantId: PHONEPE_CONFIG.MERCHANT_ID,
          merchantTransactionId: merchantTransactionId,
          transactionId: transaction.phonepeTransactionId || 'DEMO_TXN_' + Date.now(),
          amount: parseFloat(transaction.amount) * 100,
          state: demoState,
          responseCode: transaction.responseCode || 'DEMO_SUCCESS',
          paymentInstrument: {
            type: 'UPI',
            utr: 'DEMO_UTR_' + Date.now()
          }
        }
      };
    }
    // Generate checksum for status check
    const statusEndpoint = `/pg/v1/status/${PHONEPE_CONFIG.MERCHANT_ID}/${merchantTransactionId}`;
    const string = statusEndpoint + PHONEPE_CONFIG.SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + PHONEPE_CONFIG.KEY_INDEX;

    // API request options
    const options = {
      method: 'GET',
      url: `${PHONEPE_CONFIG.BASE_URL}${statusEndpoint}`,
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': PHONEPE_CONFIG.MERCHANT_ID
      }
    };

    // Make API call
    const response = await axios.request(options);
    
    // Update transaction status in database
    const transaction = await storage.getPhonePeTransactionByMerchantId(merchantTransactionId);
    if (transaction) {
      await storage.updatePhonePeTransaction(merchantTransactionId, {
        phonepeTransactionId: response.data.data?.transactionId,
        status: response.data.data?.state === 'COMPLETED' ? 'success' : 
                response.data.data?.state === 'FAILED' ? 'failed' : 'pending',
        responseCode: response.data.data?.responseCode,
        responseMessage: response.data.message,
        paymentMethod: response.data.data?.paymentInstrument?.type,
        paymentInstrument: response.data.data?.paymentInstrument
      });

      // Update order payment status if payment is successful
      if (response.data.data?.state === 'COMPLETED') {
        await storage.updateOrderPaymentStatus(transaction.orderId, 'paid', 'phonepe');
      } else if (response.data.data?.state === 'FAILED') {
        await storage.updateOrderPaymentStatus(transaction.orderId, 'failed', 'phonepe');
      }
    }

    return {
      success: response.data.success,
      code: response.data.code,
      message: response.data.message,
      data: response.data.data
    };

  } catch (error) {
    console.error('PhonePe status check error:', error);
    throw new Error('Failed to check PhonePe payment status');
  }
}

// Handle PhonePe callback
export async function handlePhonePeCallback(merchantTransactionId: string, checksum?: string): Promise<PhonePeStatusResponse> {
  try {
    // First check the payment status
    const statusResponse = await checkPhonePePaymentStatus(merchantTransactionId);
    
    // Additional verification can be added here if needed
    if (checksum) {
      // Verify the callback checksum if provided
      const isValid = verifyChecksum(merchantTransactionId, checksum, '/pg/v1/status');
      if (!isValid) {
        console.warn('Invalid checksum in PhonePe callback');
      }
    }

    return statusResponse;
  } catch (error) {
    console.error('PhonePe callback handling error:', error);
    throw new Error('Failed to handle PhonePe callback');
  }
}

// Get transaction by merchant transaction ID
export async function getPhonePeTransaction(merchantTransactionId: string) {
  return await storage.getPhonePeTransactionByMerchantId(merchantTransactionId);
}

// Get all transactions for an order
export async function getPhonePeTransactionsByOrderId(orderId: number) {
  return await storage.getPhonePeTransactionsByOrderId(orderId);
}