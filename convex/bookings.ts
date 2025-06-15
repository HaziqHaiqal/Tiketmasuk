import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createBooking = mutation({
  args: {
    organizer_id: v.id("organizer_profiles"),
    event_id: v.id("events"),
    customer_profile_id: v.id("customer_profiles"),
    booking_reference: v.string(),
    booking_details: v.array(v.object({
      category_id: v.string(),
      pricing_tier_id: v.string(),
      quantity: v.number(),
      unit_price: v.number(),
      total_price: v.number(),
    })),
    subtotal: v.number(),
    discount_amount: v.optional(v.number()),
    service_fee: v.optional(v.number()),
    total_amount: v.number(),
    currency: v.string(),
    promo_code_id: v.optional(v.id("promo_codes")),
    promo_code_used: v.optional(v.string()),
    special_requests: v.optional(v.string()),
    booking_notes: v.optional(v.string()),
    metadata: v.optional(v.string()),
    expires_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bookings", {
      ...args,
      status: "pending",
      created_at: Date.now(),
    });
  },
});

export const updateBookingStatus = mutation({
  args: {
    booking_id: v.id("bookings"),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    confirmed_at: v.optional(v.number()),
    cancelled_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { booking_id, ...updates } = args;
    
    await ctx.db.patch(booking_id, {
      ...updates,
      updated_at: Date.now(),
    });
    
    return await ctx.db.get(booking_id);
  },
});

export const getBooking = query({
  args: { booking_id: v.id("bookings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.booking_id);
  },
});

export const getBookingsByCustomer = query({
  args: { customer_profile_id: v.id("customer_profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_customer", (q) => q.eq("customer_profile_id", args.customer_profile_id))
      .collect();
  },
});

export const getBookingsByEvent = query({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .collect();
  },
});

export const getBookingsByOrganizer = query({
  args: { organizer_id: v.id("organizer_profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_organizer", (q) => q.eq("organizer_id", args.organizer_id))
      .collect();
  },
});

export const getBookingByReference = query({
  args: { booking_reference: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_reference", (q) => q.eq("booking_reference", args.booking_reference))
      .first();
  },
});

// Get booking details with related data
export const getBookingDetails = query({
  args: { booking_id: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.booking_id);
    if (!booking) return null;

    // Get related data
    const [event, customerProfile, organizerProfile] = await Promise.all([
      ctx.db.get(booking.event_id),
      ctx.db.get(booking.customer_profile_id),
      ctx.db.get(booking.organizer_id),
    ]);

    // Get tickets for this booking
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_booking", (q) => q.eq("booking_id", args.booking_id))
      .collect();

    return {
      booking,
      event,
      customerProfile,
      organizerProfile,
      tickets,
    };
  },
});

// Calculate total tickets sold for a booking (from embedded booking_details)
export const getBookingTicketCount = query({
  args: { booking_id: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.booking_id);
    if (!booking) return 0;

    return booking.booking_details.reduce((total, detail) => total + detail.quantity, 0);
  },
}); 