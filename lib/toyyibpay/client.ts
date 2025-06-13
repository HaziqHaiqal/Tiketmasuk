import { 
  ToyyibPayBill, 
  ToyyibPayBillResponse, 
  CreateBillOptions,
  ToyyibPayTransaction
} from './types';
import { getToyyibPayConfig, TOYYIBPAY_API_URL, TOYYIBPAY_ENDPOINTS } from './config';

/**
 * ToyyibPay Client
 * Main client for payment operations
 */
export class ToyyibPayClient {
  private config;

  constructor() {
    this.config = getToyyibPayConfig();
  }

  /**
   * Create a payment bill
   */
  async createBill(options: CreateBillOptions): Promise<ToyyibPayBillResponse> {
    // Validate inputs
    if (!options.billName || options.billName.length > 30) {
      throw new Error(`Bill name must be 1-30 characters. Current: ${options.billName?.length || 0}`);
    }

    // Clean phone number - remove all non-digits except leading +
    const cleanPhone = (options.billPhone || '').replace(/[^\d+]/g, '');

    const bill: ToyyibPayBill = {
      userSecretKey: this.config.secretKey,
      categoryCode: this.config.categoryCode,
      billName: options.billName,
      billDescription: options.billDescription,
      billPriceSetting: 1, // Fixed amount
      billPayorInfo: 1, // Require payer information
      billAmount: options.billAmount,
      billReturnUrl: options.billReturnUrl,
      billCallbackUrl: options.billCallbackUrl,
      billExternalReferenceNo: options.billExternalReferenceNo,
      billTo: options.billTo,
      billEmail: options.billEmail,
      billPhone: cleanPhone,
      billSplitPayment: 0, // No split payment
      billSplitPaymentArgs: '',
      billPaymentChannel: '0', // FPX only (can be changed to '2' for both FPX & Credit Card)
      billContentEmail: options.billContentEmail || '',
      billChargeToCustomer: 1, // Charge processing fee to customer
    };

    try {
      const response = await fetch(`${TOYYIBPAY_API_URL}${TOYYIBPAY_ENDPOINTS.createBill}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(bill as any).toString(),
      });

      if (!response.ok) {
        throw new Error(`ToyyibPay API error: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log('ToyyibPay API raw response:', responseText);
      
      // Check for common error responses
      if (responseText.includes('disallowed characters')) {
        throw new Error('Invalid characters in request data. Please check URLs and input fields.');
      }
      
      if (responseText.includes('[KEY-DID-NOT-EXIST') || responseText.includes('USER-IS-NOT-ACTIVE')) {
        throw new Error('Invalid ToyyibPay API credentials. Please verify TOYYIBPAY_SECRET_KEY and TOYYIBPAY_CATEGORY_CODE.');
      }
      
      // Try to parse response
      let result;
      try {
        result = JSON.parse(responseText);
        
        if (result && result.status === 'error') {
          console.error('ToyyibPay API error:', result);
          throw new Error(`ToyyibPay API error: ${result.msg}`);
        }
      } catch (parseError) {
        // If not JSON, check if it's a direct bill code
        if (responseText && responseText.length > 0 && !responseText.includes('<') && !responseText.includes('error')) {
          result = [{ BillCode: responseText.trim() }];
        } else {
          console.error('Invalid response from ToyyibPay API:', responseText);
          throw new Error('Invalid response from ToyyibPay API. Please check your API credentials and configuration.');
        }
      }

      if (result && result[0] && result[0].BillCode) {
        const billCode = result[0].BillCode;
        const paymentUrl = `${TOYYIBPAY_API_URL}/${billCode}`;
        
        console.log('Successfully created bill:', billCode);
        
        return {
          billCode,
          billpaymentURL: paymentUrl,
        };
      } else {
        console.error('No bill code in response:', result);
        throw new Error('Failed to create bill: No bill code returned');
      }
    } catch (error) {
      console.error('Error creating ToyyibPay bill:', error);
      throw error;
    }
  }

  /**
   * Get bill transaction details
   */
  async getBillTransactions(billCode: string): Promise<ToyyibPayTransaction[]> {
    try {
      const response = await fetch(`${TOYYIBPAY_API_URL}${TOYYIBPAY_ENDPOINTS.getBillTransactions}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          userSecretKey: this.config.secretKey,
          billCode: billCode,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`ToyyibPay API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting ToyyibPay bill transactions:', error);
      throw error;
    }
  }

  /**
   * Deactivate a bill
   */
  async inactiveBill(billCode: string): Promise<{ status: string; result: string }> {
    try {
      const response = await fetch(`${TOYYIBPAY_API_URL}${TOYYIBPAY_ENDPOINTS.inactiveBill}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secretKey: this.config.secretKey,
          billCode: billCode,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`ToyyibPay API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deactivating ToyyibPay bill:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const toyyibpayClient = new ToyyibPayClient(); 