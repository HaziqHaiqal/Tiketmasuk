import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    vendor_id: v.id("vendors"),
    name: v.string(),
    description: v.string(),
    location: v.string(),
    event_date: v.number(),
    price: v.number(),
    total_tickets: v.number(),
    image_storage_id: v.optional(v.id("_storage")),
    is_published: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("events", {
      vendor_id: args.vendor_id,
      name: args.name,
      description: args.description,
      location: args.location,
      event_date: args.event_date,
      price: args.price,
      total_tickets: args.total_tickets,
      available_tickets: args.total_tickets,
      image_storage_id: args.image_storage_id,
      is_published: args.is_published ?? false,
      created_at: Date.now(),
    });
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("is_published", true))
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.event_id);
  },
});

export const getByVendor = query({
  args: { vendor_id: v.id("vendors") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_vendor", (q) => q.eq("vendor_id", args.vendor_id))
      .order("desc")
      .collect();
  },
});

export const updateTicketAvailability = mutation({
  args: {
    event_id: v.id("events"),
    tickets_sold: v.number(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) throw new Error("Event not found");

    const newAvailableTickets = event.total_tickets - args.tickets_sold;

    await ctx.db.patch(args.event_id, {
      available_tickets: Math.max(0, newAvailableTickets),
      updated_at: Date.now(),
    });
  },
});

export const getEventAvailability = query({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) throw new Error("Event not found");

    // Count purchased tickets from booking_items
    const bookingItems = await ctx.db
      .query("booking_items")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .collect();

    // Count completed bookings only
    const purchasedCount = await Promise.all(
      bookingItems.map(async (item) => {
        const booking = await ctx.db.get(item.booking_id);
        return booking?.status === "completed" ? item.quantity : 0;
      })
    ).then(counts => counts.reduce((sum, count) => sum + count, 0));

    return {
      totalTickets: event.total_tickets,
      availableTickets: event.available_tickets,
      purchasedCount,
      reservedCount: 0, // For now, no reservations
    };
  },
});

export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) {
      return [];
    }

    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("is_published", true))
      .collect();

    // Simple text search in name, description, and location
    const searchTerm = args.searchTerm.toLowerCase();
    return events.filter(event => 
      !event.is_cancelled &&
      (event.name.toLowerCase().includes(searchTerm) ||
       event.description.toLowerCase().includes(searchTerm) ||
       event.location.toLowerCase().includes(searchTerm))
    );
  },
});

export const cancelEvent = mutation({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) throw new Error("Event not found");

    await ctx.db.patch(args.event_id, {
      is_cancelled: true,
      updated_at: Date.now(),
    });
  },
});

export const getUserEvents = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    // Get vendor for this user
    const vendor = await ctx.db
      .query("vendors")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .first();

    if (!vendor) {
      return [];
    }

    return await ctx.db
      .query("events")
      .withIndex("by_vendor", (q) => q.eq("vendor_id", vendor._id))
      .order("desc")
      .collect();
  },
});

export const get = query({
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("is_published", true))
      .collect();
    
    // Filter out cancelled events in JavaScript
    return events.filter(event => !event.is_cancelled);
  },
});

export const update = mutation({
  args: {
    event_id: v.id("events"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      location: v.optional(v.string()),
      event_date: v.optional(v.number()),
      price: v.optional(v.number()),
      total_tickets: v.optional(v.number()),
      image_storage_id: v.optional(v.id("_storage")),
      is_published: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) throw new Error("Event not found");

    await ctx.db.patch(args.event_id, {
      ...args.updates,
      updated_at: Date.now(),
    });
  },
}); 