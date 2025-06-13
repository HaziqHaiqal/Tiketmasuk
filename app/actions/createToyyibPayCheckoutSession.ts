"use server";

import { toyyibpayClient } from "@/lib/toyyibpay/client";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import baseUrl from "@/lib/baseUrl";
import { auth } from "@clerk/nextjs/server";

interface TicketHolderData {
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  icPassport: string;
  dateOfBirth: string;
  gender: string;
  country: string;
  state: string;
  address: string;
  postcode: string;
  ticketType: string;
}

interface PurchaseFormData {
  // Buyer Details
  buyerFullName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerCountryCode: string;
  
  // Ticket Holders
  ticketHolders: TicketHolderData[];
  
  // Preferences
  specialRequests: string;
  marketingEmails: boolean;
  eventUpdates: boolean;
}

interface WaiverState {
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export type ToyyibPayCheckoutMetaData = {
  eventId: Id<"events">;
  userType: "authenticated";
  userId: string;
  waitingListId: Id<"waiting_list">;
  formData: PurchaseFormData;
  waiver: WaiverState;
  bookingReference: string;
};

// Generate unique booking reference
function generateBookingReference(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `TM${timestamp}${randomStr}`.toUpperCase();
}

export async function createToyyibPayCheckoutSession({
  eventId,
  userType,
  waitingListId,
  formData,
  waiver
}: {
  eventId: Id<"events">;
  userType: "authenticated";
  waitingListId?: Id<"waiting_list">;
  formData: PurchaseFormData;
  waiver: WaiverState;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  // Validate waivers
  if (!waiver.acceptTerms || !waiver.acceptPrivacy) {
    throw new Error("Terms and conditions and privacy policy must be accepted");
  }

  // Validate required data
  if (!formData.buyerPhone || !formData.buyerEmail || !formData.buyerFullName) {
    throw new Error("Buyer information is incomplete");
  }

  if (!formData.ticketHolders || formData.ticketHolders.length === 0) {
    throw new Error("At least one ticket holder is required");
  }

  // Validate each ticket holder
  for (const holder of formData.ticketHolders) {
    if (!holder.fullName || !holder.email || !holder.phone || !holder.icPassport) {
      throw new Error("All ticket holder information is required");
    }
  }

  const convex = getConvexClient();

  // Get event details
  const event = await convex.query(api.events.getById, { event_id: eventId });
  if (!event) throw new Error("Event not found");

  // Get waiting list entry for authenticated users
  const queuePosition = await convex.query(api.waitingList.getQueuePosition, {
    event_id: eventId,
    user_id: userId,
  });

  if (!queuePosition || queuePosition.status !== "offered") {
    throw new Error("No valid ticket offer found");
  }

  // Generate unique booking reference immediately
  const bookingReference = generateBookingReference();

  const metadata: ToyyibPayCheckoutMetaData = {
    eventId,
    userType,
    userId,
    waitingListId: queuePosition._id,
    formData,
    waiver,
    bookingReference
  };

  // Calculate total price based on number of ticket holders
  const totalAmount = event.price * formData.ticketHolders.length;

  // Generate unique external reference
  const externalReference = `TICKET_${eventId}_${userId}_${Date.now()}`;

  try {
    // Ensure bill name doesn't exceed 30 characters
    const ticketQuantity = formData.ticketHolders.length;
    const quantityText = ticketQuantity > 1 ? ` x${ticketQuantity}` : "";
    const maxEventNameLength = 30 - "Ticket: ".length - quantityText.length;
    const truncatedEventName = event.name.length > maxEventNameLength 
      ? event.name.substring(0, maxEventNameLength - 3) + "..." 
      : event.name;

    // First get the vendor from the event to create the booking
    const vendor = await convex.query(api.vendors.getByEvent, { event_id: eventId });
    if (!vendor) throw new Error("Event vendor not found");

    // Create booking record (not ticket) for tracking
    const bookingId = await convex.mutation(api.bookings.create, {
      booking_reference: bookingReference,
      user_id: userId,
      vendor_id: vendor._id,
      total_amount: totalAmount,
      notes: JSON.stringify(metadata)
    });

    // Format phone number for ToyyibPay (ensure it starts with +60)
    let formattedPhone = formData.buyerPhone;
    if (formData.buyerPhone && !formData.buyerPhone.startsWith('+')) {
      // Remove leading 0 if present, then add +60 (Malaysian format)
      const cleanPhone = formData.buyerPhone.startsWith('0') 
        ? formData.buyerPhone.substring(1) 
        : formData.buyerPhone;
      formattedPhone = `+60${cleanPhone}`;
    }
    
    // For development, use a placeholder HTTPS URL for callbacks since ToyyibPay might reject localhost
    const callbackBaseUrl = process.env.NODE_ENV === "development" 
      ? "https://tiketmasuk.vercel.app" // Use production URL for callbacks in dev
      : baseUrl;

    const billData = {
      billName: `Ticket: ${truncatedEventName}${quantityText}`,
      billDescription: `${ticketQuantity} ticket(s) for ${event.name} - Booking: ${bookingReference}`,
      billAmount: totalAmount,
      billTo: formData.buyerFullName,
      billEmail: formData.buyerEmail,
      billPhone: formattedPhone,
      billExternalReferenceNo: externalReference,
      billReturnUrl: `${baseUrl}/checkout/acknowledgement/{billcode}?status_id={status_id}&order_id={order_id}&transaction_id={transaction_id}&booking_ref=${bookingReference}`,
      billCallbackUrl: `${callbackBaseUrl}/api/webhooks/toyyibpay`,
      billContentEmail: `Your ticket(s) for ${event.name} - Booking Reference: ${bookingReference}`,
    };

    // Create ToyyibPay bill using the buyer's information
    const billResponse = await toyyibpayClient.createBill(billData);

    // Create payment record for this booking
    await convex.mutation(api.payments.create, {
      booking_id: bookingId,
      amount: totalAmount,
      currency: "MYR",
      payment_method: "toyyibpay",
      payment_provider: "ToyyibPay",
      bill_code: billResponse.billCode,
    });

    return { 
      billCode: billResponse.billCode, 
      paymentUrl: billResponse.billpaymentURL,
      bookingReference 
    };
  } catch (error) {
    // Re-throw the original error message if it's more specific
    if (error instanceof Error && error.message !== "Failed to create payment session") {
      throw error;
    }
    
    throw new Error("Failed to create payment session");
  }
} 