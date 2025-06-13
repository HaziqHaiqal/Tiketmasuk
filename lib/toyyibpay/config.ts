import { ToyyibPayConfig } from './types';

/**
 * ToyyibPay Configuration
 * Handles environment variables and API URLs
 */

export const TOYYIBPAY_API_URL = process.env.TOYYIBPAY_SANDBOX === 'true' 
  ? 'https://dev.toyyibpay.com' 
  : 'https://toyyibpay.com';

export function getToyyibPayConfig(): ToyyibPayConfig {
  const secretKey = process.env.TOYYIBPAY_SECRET_KEY;
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE;
  const sandbox = process.env.TOYYIBPAY_SANDBOX === 'true';

  if (!secretKey) {
    throw new Error('TOYYIBPAY_SECRET_KEY is missing in environment variables. Please add it to your .env.local file.');
  }

  if (!categoryCode) {
    throw new Error('TOYYIBPAY_CATEGORY_CODE is missing in environment variables. Please add it to your .env.local file.');
  }

  return {
    secretKey,
    categoryCode,
    sandbox,
  };
}

export function validateConfig(): boolean {
  try {
    getToyyibPayConfig();
    return true;
  } catch {
    return false;
  }
}

export const TOYYIBPAY_ENDPOINTS = {
  createCategory: '/index.php/api/createCategory',
  createBill: '/index.php/api/createBill',
  getBillTransactions: '/index.php/api/getBillTransactions',
  inactiveBill: '/index.php/api/inactiveBill',
} as const; 