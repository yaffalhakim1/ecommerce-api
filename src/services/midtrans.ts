import axios from 'axios';
import crypto from 'crypto';
import { Snap } from 'midtrans-client';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || '';
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

const MIDTRANS_API_URL = MIDTRANS_IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1'
  : 'https://app.sandbox.midtrans.com/snap/v1';

const auth = Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64');

// Initialize official Midtrans client
const snap = new Snap({
  isProduction: MIDTRANS_IS_PRODUCTION,
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: MIDTRANS_CLIENT_KEY,
});

type MidtransItem = {
  id: string;
  price: number;
  quantity: number;
  name: string;
};

type MidtransTransactionDetails = {
  order_id: string;
  gross_amount: number;
};

type MidtransCustomerDetails = {
  first_name: string;
  email: string;
};

type MidtransPaymentRequest = {
  transaction_details: MidtransTransactionDetails;
  item_details: MidtransItem[];
  customer_details: MidtransCustomerDetails;
};

type MidtransPaymentResponse = {
  token: string;
  redirect_url: string;
};

export const createTransaction = async (
  orderId: string,
  grossAmount: number,
  items: MidtransItem[],
  customerDetails: MidtransCustomerDetails
): Promise<MidtransPaymentResponse> => {
  try {
    const payload: MidtransPaymentRequest = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(grossAmount),
      },
      item_details: items,
      customer_details: customerDetails,
    };

    const response = await axios.post(
      `${MIDTRANS_API_URL}/transactions`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Basic ${auth}`,
        },
      }
    );

    return {
      token: response.data.token,
      redirect_url: response.data.redirect_url,
    };
  } catch (error: any) {
    console.error('Midtrans error:', error.response?.data || error.message);
    throw new Error('Failed to create payment transaction');
  }
};

// Enhanced version with retry logic using official client
export const createTransactionWithRetry = async (
  orderId: string,
  grossAmount: number,
  items: MidtransItem[],
  customerDetails: MidtransCustomerDetails,
  maxRetries: number = 3
): Promise<MidtransPaymentResponse> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const payload: MidtransPaymentRequest = {
        transaction_details: {
          order_id: orderId,
          gross_amount: Math.round(grossAmount),
        },
        item_details: items,
        customer_details: customerDetails,
      };

      const response = await snap.createTransaction(payload);
      return {
        token: response.token,
        redirect_url: response.redirect_url,
      };
    } catch (error: any) {
      console.error(`Midtrans retry ${i + 1}/${maxRetries}:`, error.message);

      if (i === maxRetries - 1) {
        throw new Error(
          `Failed to create payment transaction after ${maxRetries} retries: ${error.message}`
        );
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.min(1000 * Math.pow(2, i), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Failed to create payment transaction');
};

export const verifySignature = (
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean => {
  const hash = crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`)
    .digest('hex');

  return hash === signatureKey;
};

export const getTransactionStatus = async (orderId: string): Promise<any> => {
  try {
    const response = await axios.get(
      `https://api.${
        MIDTRANS_IS_PRODUCTION ? '' : 'sandbox.'
      }midtrans.com/v2/${orderId}/status`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${auth}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Get status error:', error.response?.data || error.message);
    throw new Error('Failed to get transaction status');
  }
};

export default {
  createTransaction,
  verifySignature,
  getTransactionStatus,
};
