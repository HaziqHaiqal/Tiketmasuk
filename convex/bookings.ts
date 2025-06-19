import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createBooking = mutation({
  args: {
    event_id: v.optional(v.id("events")),
    customer_id: v.id("users"),
    booking_number: v.string(),
    contact_info: v.object({
      first_name: v.string(),
      last_name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
    }),
    ticket_items: v.optional(v.array(v.object({
      ticket_category_id: v.id("ticket_categories"),
      quantity: v.number(),
      unit_price: v.number(),
      discount_amount: v.optional(v.number()),
      promo_code: v.optional(v.string()),
    }))),
    product_items: v.optional(v.array(v.object({
      product_id: v.id("products"),
      quantity: v.number(),
      unit_price: v.number(),
      discount_amount: v.optional(v.number()),
      promo_code: v.optional(v.string()),
      variant_selections: v.array(v.object({
        variant_id: v.string(),
        option_id: v.string(),
        option_label: v.string(),
        price_modifier: v.number(),
      })),
      fulfillment_method: v.union(
        v.literal("pickup"),
        v.literal("shipping")
      ),
      fulfillment_status: v.optional(v.union(
        v.literal("pending"),
        v.literal("preparing"),
        v.literal("ready_for_pickup"),
        v.literal("shipped"),
        v.literal("in_transit"),
        v.literal("delivered"),
        v.literal("completed")
      )),
      tracking_number: v.optional(v.string()),
    }))),
    booking_type: v.union(v.literal("event_tickets"), v.literal("products_only"), v.literal("event_with_products")),
    subtotal: v.number(),
    tax_amount: v.optional(v.number()),
    service_fee: v.optional(v.number()),
    processing_fee: v.optional(v.number()),
    discount_amount: v.optional(v.number()),
    total_amount: v.number(),
    currency: v.string(),
    special_requests: v.optional(v.string()),
    dietary_requirements: v.optional(v.string()),
    accessibility_needs: v.optional(v.string()),
    attendees: v.optional(v.array(v.object({
      first_name: v.string(),
      last_name: v.string(),
      email: v.optional(v.string()),
      ticket_category_id: v.id("ticket_categories"),
    }))),
    // BILLING & SHIPPING ADDRESSES (for product purchases)
    billing_address: v.optional(v.object({
      first_name: v.string(),
      last_name: v.string(),
      company: v.optional(v.string()),
      address_line_1: v.string(),
      address_line_2: v.optional(v.string()),
      city: v.string(),
      state_province: v.string(),
      postal_code: v.string(),
      country: v.string(),
      phone: v.optional(v.string()),
    })),
    shipping_address: v.optional(v.object({
      first_name: v.string(),
      last_name: v.string(),
      company: v.optional(v.string()),
      address_line_1: v.string(),
      address_line_2: v.optional(v.string()),
      city: v.string(),
      state_province: v.string(),
      postal_code: v.string(),
      country: v.string(),
      phone: v.optional(v.string()),
    })),
    same_as_billing: v.optional(v.boolean()),
    shipping_method: v.optional(v.union(
      v.literal("standard"),
      v.literal("express"),
      v.literal("overnight"),
      v.literal("pickup")
    )),
    shipping_cost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bookings", {
      ...args,
      status: "pending",
      payment_status: "pending",
      created_at: Date.now(),
    });
  },
});

export const updateBookingStatus = mutation({
  args: {
    booking_id: v.id("bookings"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("refunded"),
      v.literal("no_show")
    ),
    payment_status: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded"),
      v.literal("partially_refunded")
    )),
    confirmed_at: v.optional(v.number()),
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

export const getBookingsByUser = query({
  args: { customer_id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_customer", (q) => q.eq("customer_id", args.customer_id))
      .collect();
  },
});

// Get user bookings with event data for proper categorization
export const getBookingsByUserWithEvents = query({
  args: { customer_id: v.id("users") },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_customer", (q) => q.eq("customer_id", args.customer_id))
      .collect();

    // Get event data for each booking
    const bookingsWithEvents = await Promise.all(
      bookings.map(async (booking) => {
        // Handle optional event_id
        const event = booking.event_id ? await ctx.db.get(booking.event_id) : null;
        return {
          ...booking,
          event,
        };
      })
    );

    return bookingsWithEvents;
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

export const getBookingByNumber = query({
  args: { booking_number: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_booking_number", (q) => q.eq("booking_number", args.booking_number))
      .first();
  },
});

// Get booking details with related data
export const getBookingDetails = query({
  args: { booking_id: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.booking_id);
    if (!booking) return null;

    // Get event details (handle optional event_id)
    const event = booking.event_id ? await ctx.db.get(booking.event_id) : null;

    return {
      booking,
      event,
    };
  },
});

// Calculate total tickets sold for a booking (from ticket_items)
export const getBookingTicketCount = query({
  args: { booking_id: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.booking_id);
    if (!booking || !booking.ticket_items) return 0;

    return booking.ticket_items.reduce((total, item) => total + item.quantity, 0);
  },
});

// Get booking with full event and ticket category details for ticket display
export const getBookingWithDetails = query({
  args: { booking_id: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.booking_id);
    if (!booking) return null;

    // Get event details (handle optional event_id)
    const event = booking.event_id ? await ctx.db.get(booking.event_id) : null;

    // Get organizer details (only if event exists)
    const organizer = event ? await ctx.db.get(event.organizer_id) : null;

    // Get ticket category details for each ticket item (handle optional ticket_items)
    let ticketItemsWithCategories: any[] = [];
    if (booking.ticket_items) {
      const ticketCategoriesPromises = booking.ticket_items.map(async (item) => {
        const category = await ctx.db.get(item.ticket_category_id);
        return {
          ...item,
          ticket_category: category,
        };
      });
      ticketItemsWithCategories = await Promise.all(ticketCategoriesPromises);
    }

    return {
      booking,
      event,
      organizer,
      ticket_items: ticketItemsWithCategories,
    };
  },
});

// Get booking by booking number with all details
export const getBookingWithDetailsByNumber = query({
  args: { booking_number: v.string() },
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_booking_number", (q) => q.eq("booking_number", args.booking_number))
      .first();
    
    if (!booking) return null;

    // Get event details (handle optional event_id)
    const event = booking.event_id ? await ctx.db.get(booking.event_id) : null;

    // Get organizer details (only if event exists)
    const organizer = event ? await ctx.db.get(event.organizer_id) : null;

    // Get ticket category details for each ticket item (handle optional ticket_items)
    let ticketItemsWithCategories: any[] = [];
    if (booking.ticket_items) {
      const ticketCategoriesPromises = booking.ticket_items.map(async (item) => {
        const category = await ctx.db.get(item.ticket_category_id);
        return {
          ...item,
          ticket_category: category,
        };
      });
      ticketItemsWithCategories = await Promise.all(ticketCategoriesPromises);
    }

    return {
      booking,
      event,
      organizer,
      ticket_items: ticketItemsWithCategories,
    };
  },
});

export const getByPaymentReference = query({
  args: { payment_reference: v.string() },
  handler: async (ctx, args) => {
    // Use booking_number to match payment reference since ToyyibPay uses booking number as reference
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_booking_number", (q) => q.eq("booking_number", args.payment_reference))
      .first();

    return booking;
  },
});

export const updatePaymentStatus = mutation({
  args: {
    booking_id: v.id("bookings"),
    payment_status: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed"), v.literal("refunded")),
    payment_details: v.optional(v.object({
      transaction_id: v.optional(v.string()),
      payment_method: v.optional(v.string()),
      payment_response: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { booking_id, payment_status, payment_details } = args;

    const updateData: any = {
      payment_status,
      updated_at: Date.now(),
    };

    if (payment_details) {
      updateData.payment_details = payment_details;
    }

    await ctx.db.patch(booking_id, updateData);

    return booking_id;
  },
}); 