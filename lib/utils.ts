import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function useStorageUrl(storageId: Id<"_storage"> | undefined) {
  return useQuery(api.storage.getUrl, storageId ? { storageId } : "skip");
}

/**
 * Clear all checkout-related session storage data
 * Used when queue expires or user leaves checkout flow
 */
export function clearCheckoutSessionData() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('purchaseFormData');
    sessionStorage.removeItem('checkoutProgress');
    sessionStorage.removeItem('checkoutData');
    sessionStorage.removeItem('checkoutDetailsData');
  }
}

// PRICING & FEES
export const FEE_CONFIG = {
  SERVICE_FEE_PERCENTAGE: 5, // 5% service fee
  PROCESSING_FEE_FIXED: 100, // RM 1.00 processing fee for online payments
  MAX_SERVICE_FEE: 2000, // Max RM 20.00 service fee
  MIN_SERVICE_FEE: 0, // Min RM 0.00 (free for very small amounts)
  FREE_SERVICE_FEE_THRESHOLD: 500, // Under RM 5.00 gets free service fee
} as const;

/**
 * Calculate service fee based on subtotal
 * @param subtotal - The subtotal amount in cents
 * @returns Service fee in cents
 */
export function calculateServiceFee(subtotal: number): number {
  // No service fee for very small amounts
  if (subtotal < FEE_CONFIG.FREE_SERVICE_FEE_THRESHOLD) {
    return 0;
  }

  // Calculate percentage-based service fee
  const serviceFee = Math.floor((subtotal * FEE_CONFIG.SERVICE_FEE_PERCENTAGE) / 100);
  
  // Apply min/max caps
  return Math.max(
    FEE_CONFIG.MIN_SERVICE_FEE,
    Math.min(serviceFee, FEE_CONFIG.MAX_SERVICE_FEE)
  );
}

/**
 * Calculate processing fee (fixed fee for online payments)
 * @param paymentMethod - The payment method being used
 * @returns Processing fee in cents
 */
export function calculateProcessingFee(paymentMethod: string = "online"): number {
  if (paymentMethod === "cash" || paymentMethod === "bank_transfer") {
    return 0;
  }
  
  return FEE_CONFIG.PROCESSING_FEE_FIXED;
}

/**
 * Calculate total fees for a booking
 * @param subtotal - The subtotal amount in cents
 * @param paymentMethod - The payment method being used
 * @returns Object with breakdown of fees
 */
export function calculateFees(subtotal: number, paymentMethod: string = "online") {
  const serviceFee = calculateServiceFee(subtotal);
  const processingFee = calculateProcessingFee(paymentMethod);
  
  return {
    serviceFee,
    processingFee,
    totalFees: serviceFee + processingFee,
    total: subtotal + serviceFee + processingFee,
  };
}
