/**
 * ToyyibPay Integration Module
 * 
 * Provides a complete integration with ToyyibPay API for Malaysian payment processing.
 * 
 * @example
 * ```typescript
 * import { toyyibpayClient, ToyyibPaySetup } from '@/lib/toyyibpay';
 * 
 * // Create a payment bill
 * const bill = await toyyibpayClient.createBill({
 *   billName: 'Event Ticket',
 *   billDescription: 'Ticket for Concert 2024',
 *   billAmount: 50.00,
 *   billTo: 'John Doe',
 *   billEmail: 'john@example.com',
 *   billExternalReferenceNo: 'TICKET_123',
 *   billReturnUrl: 'https://example.com/success',
 *   billCallbackUrl: 'https://example.com/webhook',
 * });
 * ```
 */

// Main exports
export { toyyibpayClient } from './client';
export { ToyyibPayClient } from './client';
export { ToyyibPaySetup, getSetupInstructions, quickSetup } from './setup';

// Configuration exports
export { getToyyibPayConfig, validateConfig, TOYYIBPAY_API_URL } from './config';

// Type exports
export type {
  ToyyibPayBill,
  ToyyibPayBillResponse,
  ToyyibPayCategory,
  ToyyibPayCategoryResponse,
  ToyyibPayTransaction,
  ToyyibPayWebhookData,
  ToyyibPayConfig,
  PaymentStatus,
  CreateBillOptions,
} from './types';

// Default export for convenience
export { toyyibpayClient as default } from './client';