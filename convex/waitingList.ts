import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { DURATIONS } from "./constants";
import { ConvexError } from "convex/values";
import { WAITING_LIST_STATUS } from "./constants";

// =============================================================================
// QUEUE MANAGEMENT & WAITING LIST SYSTEM
// =============================================================================

// Join waiting list for a specific ticket category
export const joinQueue = mutation({
  args: {
    event_id: v.id("events"),
    ticket_category_id: v.id("ticket_categories"),
    requested_quantity: v.number(),
    email: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated to join queue");
    }

    // Check if user already in queue for this ticket category
    const existingEntry = await ctx.db
      .query("waiting_list")
      .withIndex("by_user", (q) => q.eq("user_id", identity.subject as any))
      .filter((q) => q.eq(q.field("event_id"), args.event_id))
      .filter((q) => q.eq(q.field("ticket_category_id"), args.ticket_category_id))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "waiting"),
          q.eq(q.field("status"), "offered")
        )
      )
      .first();

    if (existingEntry) {
      throw new Error("Already in queue for this ticket category");
    }

    // Calculate position in queue
    const entries = await ctx.db
      .query("waiting_list")
      .withIndex("by_ticket_category", (q) => q.eq("ticket_category_id", args.ticket_category_id))
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .collect();

    const position = entries.length + 1;

    // Add to waiting list
    const waitingListId = await ctx.db.insert("waiting_list", {
      event_id: args.event_id,
      user_id: identity.subject as any,
      ticket_category_id: args.ticket_category_id,
      position: position,
      requested_quantity: args.requested_quantity,
      email: args.email,
      phone: args.phone,
      status: "waiting",
      created_at: Date.now(),
    });

    return {
      waiting_list_id: waitingListId,
      position: position,
      message: "Successfully joined the queue",
    };
  },
});

// Get user's position in queue
export const getQueuePosition = query({
  args: {
    event_id: v.id("events"),
    ticket_category_id: v.id("ticket_categories"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const entry = await ctx.db
      .query("waiting_list")
      .withIndex("by_user", (q) => q.eq("user_id", identity.subject as any))
      .filter((q) => q.eq(q.field("event_id"), args.event_id))
      .filter((q) => q.eq(q.field("ticket_category_id"), args.ticket_category_id))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "waiting"),
          q.eq(q.field("status"), "offered")
        )
      )
      .first();

    if (!entry) {
      return null;
    }

    return {
      position: entry.position,
      status: entry.status,
      requested_quantity: entry.requested_quantity,
      created_at: entry.created_at,
      offer_expires_at: entry.offer_expires_at,
    };
  },
});

// Get specific queue entry for user, event, and ticket category
export const getUserQueueEntry = query({
  args: {
    event_id: v.id("events"),
    ticket_category_id: v.id("ticket_categories"),
    user_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("waiting_list")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .filter((q) => q.eq(q.field("event_id"), args.event_id))
      .filter((q) => q.eq(q.field("ticket_category_id"), args.ticket_category_id))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "waiting"),
          q.eq(q.field("status"), "offered"),
          q.eq(q.field("status"), "purchasing")
        )
      )
      .first();

    return entry;
  },
});

// Get all queue entries for user
export const getUserQueueEntries = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const entries = await ctx.db
      .query("waiting_list")
      .withIndex("by_user", (q) => q.eq("user_id", identity.subject as any))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "waiting"),
          q.eq(q.field("status"), "offered")
        )
      )
      .collect();

    return entries;
  },
});

// Admin function to process queue when tickets become available
export const processQueue = mutation({
  args: {
    ticket_category_id: v.id("ticket_categories"),
    available_quantity: v.number(),
  },
  handler: async (ctx, args) => {
    // Get queue entries for this ticket category in order
    const queueEntries = await ctx.db
      .query("waiting_list")
      .withIndex("by_ticket_category", (q) => q.eq("ticket_category_id", args.ticket_category_id))
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .order("asc")
      .collect();

    // Sort by position to maintain order
    queueEntries.sort((a, b) => a.position - b.position);

    let processed = 0;
    let remainingTickets = args.available_quantity;

    for (const entry of queueEntries) {
      if (remainingTickets >= entry.requested_quantity) {
        // Offer tickets to this user
        await ctx.db.patch(entry._id, {
          status: "offered",
          offered_at: Date.now(),
          offer_expires_at: Date.now() + DURATIONS.OFFER_EXPIRY,
          offered_quantity: entry.requested_quantity,
          updated_at: Date.now(),
        });

        remainingTickets -= entry.requested_quantity;
        processed++;
      } else {
        break; // Not enough tickets for this entry
      }
    }

    return { processed, remaining_tickets: remainingTickets };
  },
});

// Accept queue offer and proceed to purchase
export const acceptOffer = mutation({
  args: {
    waiting_list_id: v.id("waiting_list"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.waiting_list_id);
    if (!entry) {
      throw new Error("Queue entry not found");
    }

    if (entry.status !== "offered") {
      throw new Error("No offer available");
    }

    if (entry.offer_expires_at && entry.offer_expires_at < Date.now()) {
      await ctx.db.patch(args.waiting_list_id, {
        status: "expired",
        updated_at: Date.now(),
      });
      throw new Error("Offer has expired");
    }

    // Mark as purchasing
    await ctx.db.patch(args.waiting_list_id, {
      status: "purchasing",
      purchase_started_at: Date.now(),
      purchase_timeout_at: Date.now() + (15 * 60 * 1000),
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

// Complete purchase from queue
export const completePurchase = mutation({
  args: {
    waiting_list_id: v.id("waiting_list"),
    booking_id: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.waiting_list_id, {
      status: "converted",
      purchase_session_id: args.booking_id,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

// Leave waiting list
export const leaveWaitingList = mutation({
  args: {
    waiting_list_id: v.id("waiting_list"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.waiting_list_id, {
      status: "cancelled",
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

// Internal function to clean up expired offers
export const cleanupExpiredOffers = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    
    const expiredOffers = await ctx.db
      .query("waiting_list")
      .withIndex("by_expiry", (q) => q.lt("offer_expires_at", now))
      .filter((q) => q.eq(q.field("status"), "offered"))
      .collect();

    for (const offer of expiredOffers) {
      await ctx.db.patch(offer._id, {
        status: "expired",
        updated_at: now,
      });
    }

    return { expired_count: expiredOffers.length };
  },
});

// Admin queries
export const getWaitingListByEvent = query({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("waiting_list")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .order("asc")
      .collect();
  },
});

export const getWaitingListByCategory = query({
  args: { event_id: v.id("events"), ticket_category_id: v.id("ticket_categories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("waiting_list")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("ticket_category_id"), args.ticket_category_id))
      .order("asc")
      .collect();
  },
});

// Get waiting list entry by ID
export const getWaitingListEntry = query({
  args: { waiting_list_id: v.id("waiting_list") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.waiting_list_id);
  },
});

// ============================================================================
// TICKET RELEASE FUNCTIONALITY
// ============================================================================

export const releaseTicket = mutation({
  args: {
    event_id: v.id("events"),
    waiting_list_id: v.id("waiting_list"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Must be authenticated to release tickets");
    }
    
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email!))
      .first();
    
    if (!user) {
      throw new ConvexError("User not found");
    }
    
    const userId = user._id;
    if (!userId) {
      throw new ConvexError("Must be authenticated to release tickets");
    }

    // Get the waiting list entry
    const waitingListEntry = await ctx.db.get(args.waiting_list_id);
    if (!waitingListEntry) {
      throw new ConvexError("Waiting list entry not found");
    }

    // Verify the user owns this waiting list entry
    if (waitingListEntry.user_id !== userId) {
      throw new ConvexError("Not authorized to release this ticket");
    }

    // Verify this is an offered ticket that can be released
    if (waitingListEntry.status !== WAITING_LIST_STATUS.OFFERED) {
      throw new ConvexError("Can only release offered tickets");
    }

    // Update the status to declined
    await ctx.db.patch(args.waiting_list_id, {
      status: WAITING_LIST_STATUS.DECLINED,
      updated_at: Date.now(),
    });

    // Get the ticket category to increment available quantity
    const ticketCategory = await ctx.db.get(waitingListEntry.ticket_category_id);
    if (ticketCategory) {
      // Decrease reserved quantity since this offer is being released
      await ctx.db.patch(waitingListEntry.ticket_category_id, {
        reserved_quantity: Math.max(0, (ticketCategory.reserved_quantity || 0) - waitingListEntry.requested_quantity),
        updated_at: Date.now(),
      });
    }

    // Find the next person in queue for this category
    const nextInQueue = await ctx.db
      .query("waiting_list")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("ticket_category_id"), waitingListEntry.ticket_category_id))
      .filter((q) => q.eq(q.field("status"), WAITING_LIST_STATUS.WAITING))
      .order("asc")
      .first();

    if (nextInQueue && ticketCategory) {
      // Check if we have enough available tickets for the next person
      const availableQuantity = ticketCategory.total_quantity - 
        (ticketCategory.sold_quantity || 0) - 
        (ticketCategory.reserved_quantity || 0);

      if (availableQuantity >= nextInQueue.requested_quantity) {
        // Offer tickets to the next person
        await ctx.db.patch(nextInQueue._id, {
          status: WAITING_LIST_STATUS.OFFERED,
          offer_expires_at: Date.now() + (15 * 60 * 1000), // 15 minutes
          updated_at: Date.now(),
        });

        // Reserve the tickets
        await ctx.db.patch(waitingListEntry.ticket_category_id, {
          reserved_quantity: (ticketCategory.reserved_quantity || 0) + nextInQueue.requested_quantity,
          updated_at: Date.now(),
        });
      }
    }

    return await ctx.db.get(args.waiting_list_id);
  },
}); 