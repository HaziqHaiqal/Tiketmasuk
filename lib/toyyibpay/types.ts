/**
 * ToyyibPay API Types and Interfaces
 * Based on https://toyyibpay.com/apireference/
 */

export interface ToyyibPayBill {
  userSecretKey: string;
  categoryCode: string;
  billName: string;
  billDescription: string;
  billPriceSetting: number;
  billPayorInfo: number;
  billAmount: number;
  billReturnUrl: string;
  billCallbackUrl: string;
  billExternalReferenceNo: string;
  billTo: string;
  billEmail: string;
  billPhone: string;
  billSplitPayment: number;
  billSplitPaymentArgs: string;
  billPaymentChannel: string;
  billContentEmail: string;
  billChargeToCustomer: number;
}

export interface ToyyibPayBillResponse {
  billCode: string;
  billpaymentURL: string;
}

export interface ToyyibPayCategory {
  catname: string;
  catdescription: string;
  userSecretKey: string;
}

export interface ToyyibPayCategoryResponse {
  CategoryCode: string;
}

export interface ToyyibPayTransaction {
  billCode: string;
  billpaymentStatus: string;
  billpaymentAmount: string;
  billpaymentInvoiceNo: string;
  billpaymentDate: string;
  billExternalReferenceNo: string;
}

export interface ToyyibPayWebhookData {
  billcode: string;
  status_id: string;
  order_id: string;
  msg: string;
  transaction_id: string;
}

export interface ToyyibPayConfig {
  secretKey: string;
  categoryCode: string;
  sandbox: boolean;
}

export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'expired';

export interface CreateBillOptions {
  billName: string;
  billDescription: string;
  billAmount: number;
  billTo: string;
  billEmail: string;
  billPhone?: string;
  billExternalReferenceNo: string;
  billReturnUrl: string;
  billCallbackUrl: string;
  billContentEmail?: string;
} 