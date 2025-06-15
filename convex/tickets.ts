import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    booking_id: v.id("bookings"),
    event_id: v.id("events"),
    ticket_number: v.string(),
    category_id: v.string(),
    category_name: v.string(),
    pricing_tier_id: v.string(),
    pricing_tier_name: v.string(),
    holder_name: v.string(),
    holder_email: v.string(),
    holder_phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tickets", {
      ...args,
      status: "issued",
      checked_in: false,
      issued_at: Date.now(),
    });
  },
});

export const getByBooking = query({
  args: { booking_id: v.id("bookings") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_booking", (q) => q.eq("booking_id", args.booking_id))
      .collect();
  },
});

export const getByEvent = query({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .collect();
  },
});

export const getByTicketNumber = query({
  args: { ticket_number: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_ticket_number", (q) => q.eq("ticket_number", args.ticket_number))
      .first();
  },
});

export const getByHolderEmail = query({
  args: { holder_email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_holder_email", (q) => q.eq("holder_email", args.holder_email))
      .collect();
  },
});

export const updateStatus = mutation({
  args: {
    ticket_id: v.id("tickets"),
    status: v.union(
      v.literal("issued"),
      v.literal("valid"),
      v.literal("used"),
      v.literal("refunded"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticket_id, {
      status: args.status,
      updated_at: Date.now(),
    });

    return await ctx.db.get(args.ticket_id);
  },
});

export const checkIn = mutation({
  args: {
    ticket_id: v.id("tickets"),
    checked_in_by: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticket_id);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (ticket.checked_in) {
      throw new Error("Ticket already checked in");
    }

    if (ticket.status !== "valid") {
      throw new Error("Ticket is not valid for check-in");
    }

    await ctx.db.patch(args.ticket_id, {
      checked_in: true,
      checked_in_at: Date.now(),
      checked_in_by: args.checked_in_by,
      status: "used",
      updated_at: Date.now(),
    });

    return await ctx.db.get(args.ticket_id);
  },
});

export const getTicketDetails = query({
  args: { ticket_id: v.id("tickets") },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticket_id);
    if (!ticket) return null;

    // Get booking details
    const booking = await ctx.db.get(ticket.booking_id);
    if (!booking) return null;

    // Get event details
    const event = await ctx.db.get(ticket.event_id);

    // Get customer profile
    const customerProfile = await ctx.db.get(booking.customer_profile_id);

    return {
      ticketDetails: ticket,
      booking,
      event,
      customerProfile,
    };
  },
});

export const generateQRCode = mutation({
  args: {
    ticket_id: v.id("tickets"),
    qr_code: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticket_id, {
      qr_code: args.qr_code,
      updated_at: Date.now(),
    });

    return await ctx.db.get(args.ticket_id);
  },
});

export const validateTicket = query({
  args: { ticket_number: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ticket_number", (q) => q.eq("ticket_number", args.ticket_number))
      .first();

    if (!ticket) {
      return { valid: false, message: "Ticket not found" };
    }

    if (ticket.status === "cancelled" || ticket.status === "refunded") {
      return { valid: false, message: "Ticket has been cancelled or refunded" };
    }

    if (ticket.checked_in) {
      return { valid: false, message: "Ticket has already been used" };
    }

    if (ticket.status !== "valid") {
      return { valid: false, message: "Ticket is not valid" };
    }

    return { valid: true, ticket };
  },
});

export const getUserTickets = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    // Get customer profile for the user
    const customerProfile = await ctx.db
      .query("customer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .first();

    if (!customerProfile) {
      return [];
    }

    // Get all bookings for this customer
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_customer", (q) => q.eq("customer_profile_id", customerProfile._id))
      .collect();

    // Get all tickets for these bookings
    const allTickets = [];
    for (const booking of bookings) {
      const tickets = await ctx.db
        .query("tickets")
        .withIndex("by_booking", (q) => q.eq("booking_id", booking._id))
        .collect();

      // Add event details to each ticket
      for (const ticket of tickets) {
        const event = await ctx.db.get(ticket.event_id);
        allTickets.push({
          ...ticket,
          event,
        });
      }
    }

    return allTickets;
  },
});

export const getUserTicketForEvent = query({
  args: { 
    event_id: v.id("events"),
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    // Get customer profile for the user
    const customerProfile = await ctx.db
      .query("customer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .first();

    if (!customerProfile) {
      return null;
    }

    // Get bookings for this customer and event
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_customer", (q) => q.eq("customer_profile_id", customerProfile._id))
      .filter((q) => q.eq(q.field("event_id"), args.event_id))
      .collect();

    if (bookings.length === 0) {
      return null;
    }

    // Get the first ticket from the first booking
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_booking", (q) => q.eq("booking_id", bookings[0]._id))
      .first();

    return ticket;
  },
});