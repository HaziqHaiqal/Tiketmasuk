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
  waitingListId: Id<"waitingList">;
  formData: PurchaseFormData;
  waiver: WaiverState;
};

export async function createToyyibPayCheckoutSession({
  eventId,
  userType,
  waitingListId,
  formData,
  waiver
}: {
  eventId: Id<"events">;
  userType: "authenticated";
  waitingListId?: Id<"waitingList">;
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
  const event = await convex.query(api.events.getById, { eventId });
  if (!event) throw new Error("Event not found");

  // Get waiting list entry for authenticated users
  const queuePosition = await convex.query(api.waitingList.getQueuePosition, {
    eventId,
    userId,
  });

  if (!queuePosition || queuePosition.status !== "offered") {
    throw new Error("No valid ticket offer found");
  }

  const metadata: ToyyibPayCheckoutMetaData = {
    eventId,
    userType,
    userId,
    waitingListId: queuePosition._id,
    formData,
    waiver
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

    // Create ToyyibPay bill using the buyer's information
    const billResponse = await toyyibpayClient.createBill({
      billName: `Ticket: ${truncatedEventName}${quantityText}`,
      billDescription: `${ticketQuantity} ticket(s) for ${event.name}`,
      billAmount: totalAmount,
      billTo: formData.buyerFullName,
      billEmail: formData.buyerEmail,
      billPhone: `${formData.buyerCountryCode}${formData.buyerPhone}`,
      billExternalReferenceNo: externalReference,
      billReturnUrl: `${baseUrl}/checkout/success?billCode={billcode}&status_id={status_id}&order_id={order_id}`,
      billCallbackUrl: `${baseUrl}/api/webhooks/toyyibpay`,
      billContentEmail: `Your ticket(s) for ${event.name}`,
    });

    // Store the bill code and metadata in session or database for later verification
    await convex.mutation(api.tickets.createPendingTicket, {
      eventId,
      userId,
      waitingListId: queuePosition._id,
      billCode: billResponse.billCode,
      externalReference,
      amount: totalAmount,
      metadata: JSON.stringify(metadata)
    });

    return { 
      billCode: billResponse.billCode, 
      paymentUrl: billResponse.billpaymentURL 
    };
  } catch (error) {
    console.error("Error creating ToyyibPay bill:", error);
    throw new Error("Failed to create payment session");
  }
} 