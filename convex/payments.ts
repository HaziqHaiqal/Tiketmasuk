import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    booking_id: v.id("bookings"),
    amount: v.number(),
    currency: v.string(),
    payment_method: v.string(),
    payment_provider: v.string(),
    bill_code: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("payments", {
      booking_id: args.booking_id,
      amount: args.amount,
      currency: args.currency,
      status: "pending",
      payment_method: args.payment_method,
      payment_provider: args.payment_provider,
      bill_code: args.bill_code,
      created_at: Date.now(),
    });
  },
});

export const updatePaymentStatus = mutation({
  args: {
    bill_code: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("expired"),
      v.literal("refunded")
    ),
    transaction_reference: v.optional(v.string()),
    provider_response: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_bill_code", (q) => q.eq("bill_code", args.bill_code))
      .first();

    if (!payment) {
      throw new Error("Payment not found");
    }

    // Update payment status
    await ctx.db.patch(payment._id, {
      status: args.status,
      transaction_reference: args.transaction_reference,
      provider_response: args.provider_response,
      updated_at: Date.now(),
    });

    // Also update booking status based on payment status
    const booking = await ctx.db.get(payment.booking_id);
    if (booking) {
      let bookingStatus = booking.status;
      
      if (args.status === "completed") {
        bookingStatus = "completed";
      } else if (args.status === "failed" || args.status === "expired") {
        bookingStatus = "cancelled";
      }
      
      await ctx.db.patch(payment.booking_id, {
        status: bookingStatus,
        updated_at: Date.now(),
      });
    }

    return payment;
  },
});

export const getPaymentByBillCode = query({
  args: { bill_code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_bill_code", (q) => q.eq("bill_code", args.bill_code))
      .first();
  },
});

export const getPaymentByBookingId = query({
  args: { booking_id: v.id("bookings") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_booking", (q) => q.eq("booking_id", args.booking_id))
      .first();
  },
});

export const getPaymentWithBookingByBillCode = query({
  args: { bill_code: v.string() },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_bill_code", (q) => q.eq("bill_code", args.bill_code))
      .first();

    if (!payment) return null;

    const booking = await ctx.db.get(payment.booking_id);
    if (!booking) return null;

    // Get user details
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", booking.user_id))
      .first();

    // Get vendor details
    const vendor = await ctx.db.get(booking.vendor_id);

    return {
      payment,
      booking: {
        ...booking,
        user,
        vendor,
      },
    };
  },
});

export const getPaymentWithBookingAndEventByBillCode = query({
  args: { bill_code: v.string() },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_bill_code", (q) => q.eq("bill_code", args.bill_code))
      .first();

    if (!payment) return null;

    const booking = await ctx.db.get(payment.booking_id);
    if (!booking) return null;

    // Get user details
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", booking.user_id))
      .first();

    // Get vendor details
    const vendor = await ctx.db.get(booking.vendor_id);

    // Get booking items to find the event
    const bookingItems = await ctx.db
      .query("booking_items")
      .withIndex("by_booking", (q) => q.eq("booking_id", booking._id))
      .collect();

    // Get the first event from booking items
    const eventId = bookingItems[0]?.event_id;
    const event = eventId ? await ctx.db.get(eventId) : null;

    // Get ticket holder details from tickets table (if any tickets were created)
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_booking", (q) => q.eq("booking_id", booking._id))
      .collect();

    return {
      payment,
      booking: {
        ...booking,
        user,
        vendor,
      },
      event,
      bookingItems,
      tickets,
    };
  },
}); 