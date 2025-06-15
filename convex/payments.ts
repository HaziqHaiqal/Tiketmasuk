import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============================================================================
// PAYMENT MANAGEMENT (Simplified like Sejamas)
// ============================================================================

// Generate payment ID
function generatePaymentId(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `PAY-${year}-${timestamp}`;
}

export const createPayment = mutation({
  args: {
    booking_id: v.id("bookings"),
    amount: v.number(),
    currency: v.string(),
    payment_method: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("payments", {
      ...args,
      id: generatePaymentId(),
      status: "pending",
      created_at: Date.now(),
    });
  },
});

export const updatePaymentStatus = mutation({
  args: {
    payment_id: v.id("payments"),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    transaction_reference: v.optional(v.string()),
    payment_response: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
      updated_at: Date.now(),
    };

    if (args.transaction_reference) updates.transaction_reference = args.transaction_reference;
    if (args.payment_response) updates.payment_response = args.payment_response;

    await ctx.db.patch(args.payment_id, updates);

    // Update booking status based on payment status
    const payment = await ctx.db.get(args.payment_id);
    if (payment) {
      if (args.status === "completed") {
        await ctx.db.patch(payment.booking_id, {
          status: "completed",
          updated_at: Date.now(),
        });
      } else if (args.status === "failed") {
        await ctx.db.patch(payment.booking_id, {
          status: "failed",
          updated_at: Date.now(),
        });
      }
    }
  },
});

export const getPaymentByBooking = query({
  args: { booking_id: v.id("bookings") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_booking", (q) => q.eq("booking_id", args.booking_id))
      .first();
  },
});

export const getPaymentById = query({
  args: { payment_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_payment_id", (q) => q.eq("id", args.payment_id))
      .first();
  },
});

export const getPaymentByTransactionReference = query({
  args: { transaction_reference: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_transaction_reference", (q) => q.eq("transaction_reference", args.transaction_reference))
      .first();
  },
});

export const getPaymentWithBookingByTransactionReference = query({
  args: { transaction_reference: v.string() },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_transaction_reference", (q) => q.eq("transaction_reference", args.transaction_reference))
      .first();

    if (!payment) return null;

    const booking = await ctx.db.get(payment.booking_id);
    if (!booking) return null;

    // Get customer profile
    const customerProfile = await ctx.db.get(booking.customer_profile_id);
    
    // Get organizer profile
    const organizerProfile = await ctx.db.get(booking.organizer_id);
    
    // Get event
    const event = await ctx.db.get(booking.event_id);

    return {
      payment,
      booking: {
        ...booking,
        customer_profile: customerProfile,
        organizer_profile: organizerProfile,
      },
      event,
    };
  },
});

export const getPaymentsByStatus = query({
  args: { 
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();
  },
});

export const createToyyibPayCheckoutSession = mutation({
  args: {
    eventId: v.id("events"),
    waitingListId: v.optional(v.id("waiting_list")),
    formData: v.object({
      buyerFullName: v.string(),
      buyerEmail: v.string(),
      buyerPhone: v.string(),
      buyerCountryCode: v.string(),
      ticketHolders: v.array(v.object({
        fullName: v.string(),
        email: v.string(),
        phone: v.string(),
        countryCode: v.string(),
        icPassport: v.string(),
        dateOfBirth: v.string(),
        gender: v.string(),
        country: v.string(),
        state: v.string(),
        address: v.string(),
        postcode: v.string(),
        ticketType: v.string(),
      })),
      specialRequests: v.string(),
      marketingEmails: v.boolean(),
      eventUpdates: v.boolean(),
    }),
    waiver: v.object({
      acceptTerms: v.boolean(),
      acceptPrivacy: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Validate waivers
    if (!args.waiver.acceptTerms || !args.waiver.acceptPrivacy) {
      throw new Error("Terms and conditions and privacy policy must be accepted");
    }

    // Validate required data
    if (!args.formData.buyerPhone || !args.formData.buyerEmail || !args.formData.buyerFullName) {
      throw new Error("Buyer information is incomplete");
    }

    if (!args.formData.ticketHolders || args.formData.ticketHolders.length === 0) {
      throw new Error("At least one ticket holder is required");
    }

    // Validate each ticket holder
    for (const holder of args.formData.ticketHolders) {
      if (!holder.fullName || !holder.email || !holder.phone || !holder.icPassport) {
        throw new Error("All ticket holder information is required");
      }
    }

    // Generate unique booking reference
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    const bookingReference = `TM${timestamp}${randomStr}`.toUpperCase();

    // Get event details
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Find the first available category and pricing tier
    const availableCategory = event.categories.find(cat => cat.is_active && cat.available_tickets > 0);
    if (!availableCategory) {
      throw new Error("No available tickets for this event");
    }

    const availablePricingTier = availableCategory.pricing_tiers.find(tier => tier.is_active);
    if (!availablePricingTier) {
      throw new Error("No available pricing tiers for this event");
    }

    // Calculate total price based on number of ticket holders
    const unitPrice = availablePricingTier.price; // Price in cents
    const quantity = args.formData.ticketHolders.length;
    const totalPrice = unitPrice * quantity;

    // Get customer profile using the user's identity subject
    const customerProfile = await ctx.db
      .query("customer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    if (!customerProfile) {
      throw new Error("Customer profile not found");
    }

    // Create booking with embedded booking details
    const bookingId = await ctx.db.insert("bookings", {
      organizer_id: event.organizer_id,
      event_id: args.eventId,
      customer_profile_id: customerProfile._id,
      booking_reference: bookingReference,
      booking_details: [{
        category_id: availableCategory.id,
        pricing_tier_id: availablePricingTier.id,
        quantity: quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
      }],
      subtotal: totalPrice,
      total_amount: totalPrice,
      currency: "MYR",
      special_requests: args.formData.specialRequests,
      metadata: JSON.stringify({
        ticketHolders: args.formData.ticketHolders,
        buyer_details: {
          name: args.formData.buyerFullName,
          email: args.formData.buyerEmail,
          phone: args.formData.buyerPhone,
        },
        waiver: args.waiver
      }),
      expires_at: Date.now() + (15 * 60 * 1000), // 15 minutes
      status: "pending",
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    // Return the booking data for client-side ToyyibPay integration
    return {
      bookingId,
      bookingReference,
      event,
      totalPrice,
      quantity,
      customerProfile,
    };
  },
}); 