import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    booking_id: v.id("bookings"),
    booking_item_id: v.id("booking_items"),
    event_id: v.id("events"),
    ticket_number: v.string(),
    holder_name: v.string(),
    holder_email: v.string(),
    holder_phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tickets", {
      booking_id: args.booking_id,
      booking_item_id: args.booking_item_id,
      event_id: args.event_id,
      ticket_number: args.ticket_number,
      holder_name: args.holder_name,
      holder_email: args.holder_email,
      holder_phone: args.holder_phone,
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

export const checkIn = mutation({
  args: {
    ticket_number: v.string(),
    checked_in_by: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ticket_number", (q) => q.eq("ticket_number", args.ticket_number))
      .first();

    if (!ticket) throw new Error("Ticket not found");
    if (ticket.checked_in) throw new Error("Ticket already checked in");
    if (ticket.status !== "valid") throw new Error("Invalid ticket status");

    await ctx.db.patch(ticket._id, {
      status: "used",
      checked_in: true,
      checked_in_at: Date.now(),
      checked_in_by: args.checked_in_by,
      updated_at: Date.now(),
    });
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
  },
});

export const getTicketWithDetails = query({
  args: { ticket_id: v.id("tickets") },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticket_id);
    if (!ticket) return null;

    // Get event details
    const event = await ctx.db.get(ticket.event_id);

    // Get booking details
    const booking = await ctx.db.get(ticket.booking_id);

    // Get booking item details
    const bookingItem = await ctx.db.get(ticket.booking_item_id);

    return {
      ...ticket,
      event,
      booking,
      bookingItem,
    };
  },
});

export const getUserTickets = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    // Get all bookings for this user
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .collect();

    // Get all tickets for these bookings
    const allTickets = await Promise.all(
      bookings.map(async (booking) => {
        const tickets = await ctx.db
          .query("tickets")
          .withIndex("by_booking", (q) => q.eq("booking_id", booking._id))
          .collect();

        // Get event details for each ticket
        return await Promise.all(
          tickets.map(async (ticket) => {
            const event = await ctx.db.get(ticket.event_id);
            return {
              ...ticket,
              event,
              booking,
            };
          })
        );
      })
    );

    // Flatten the array of arrays
    return allTickets.flat();
  },
});

export const getUserTicketForEvent = query({
  args: { 
    event_id: v.id("events"),
    user_id: v.string()
  },
  handler: async (ctx, args) => {
    // Get all bookings for this user
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .collect();

    // Find tickets for this event from user's bookings
    for (const booking of bookings) {
      const tickets = await ctx.db
        .query("tickets")
        .withIndex("by_booking", (q) => q.eq("booking_id", booking._id))
        .filter((q) => q.eq(q.field("event_id"), args.event_id))
        .first();
      
      if (tickets) {
        return tickets;
      }
    }
    
    return null;
  },
}); 