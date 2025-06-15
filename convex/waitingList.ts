import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { DURATIONS } from "./constants";
import { internal } from "./_generated/api";
import type { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Helper function to group waiting list entries by event ID.
 * Used for batch processing expired offers by event.
 */
function groupByEvent(
  offers: Array<{ event_id: Id<"events">; _id: Id<"waiting_list"> }>
) {
  return offers.reduce(
    (acc, offer) => {
      const event_id = offer.event_id;
      if (!acc[event_id]) {
        acc[event_id] = [];
      }
      acc[event_id].push(offer);
      return acc;
    },
    {} as Record<Id<"events">, typeof offers>
  );
}

/**
 * Query to get a waiting list entry by ID.
 */
export const getById = query({
  args: {
    id: v.id("waiting_list"),
  },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/**
 * Query to get a user's current position in the waiting list for an event.
 * Returns null if user is not in queue, otherwise returns their entry with position.
 */
export const getQueuePosition = query({
  args: {
    event_id: v.id("events"),
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("waiting_list")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("user_id"), args.user_id))
      .first();
  },
});

/**
 * Mutation to process the waiting list queue and offer tickets to next eligible users.
 * Checks current availability considering purchased tickets and active offers.
 */
export const processQueue = internalMutation({
  args: {
    event_id: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) return;

    // Get next person in queue
    const nextInQueue = await ctx.db
      .query("waiting_list")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .order("asc")
      .first();

    if (!nextInQueue) return;

    // Update status to offered
    await ctx.db.patch(nextInQueue._id, {
      status: "offered",
      offer_expires_at: Date.now() + DURATIONS.OFFER_EXPIRY,
      updated_at: Date.now(),
    });

    // Schedule expiry
    await ctx.scheduler.runAfter(
      DURATIONS.OFFER_EXPIRY,
      internal.waitingList.expireOffer,
      {
        waiting_list_id: nextInQueue._id,
        event_id: args.event_id,
      }
    );
  },
});

/**
 * Internal mutation to expire a single offer and process queue for next person.
 * Called by scheduled job when offer timer expires.
 */
export const expireOffer = internalMutation({
  args: {
    waiting_list_id: v.id("waiting_list"),
    event_id: v.id("events"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.waiting_list_id);
    if (!entry || entry.status !== "offered") return;

    await ctx.db.patch(args.waiting_list_id, {
      status: "expired",
      updated_at: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.waitingList.cleanupExpiredOffers, {});
  },
});

/**
 * Periodic cleanup job that acts as a fail-safe for expired offers.
 * While individual offers should expire via scheduled jobs (expireOffer),
 * this ensures any offers that weren't properly expired (e.g. due to server issues)
 * are caught and cleaned up. Also helps maintain data consistency.
 *
 * Groups expired offers by event for efficient processing and updates queue
 * for each affected event after cleanup.
 */
export const cleanupExpiredOffers = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expiredOffers = await ctx.db
      .query("waiting_list")
      .withIndex("by_status", (q) => q.eq("status", "offered"))
      .filter((q) => q.lt(q.field("offer_expires_at"), now))
      .collect();

    const grouped = expiredOffers.reduce((acc: any, offer) => {
      const event_id = offer.event_id;
      if (!acc[event_id]) {
        acc[event_id] = [];
      }
      acc[event_id].push(offer);
      return acc;
    }, {});

    for (const entry of expiredOffers) {
      await ctx.db.patch(entry._id, {
        status: "expired",
        updated_at: now,
      });
    }

    for (const [event_id, offers] of Object.entries(grouped)) {
      await ctx.scheduler.runAfter(0, internal.waitingList.processQueue, {
        event_id: event_id as any,
      });
    }
  },
});

export const addToWaitingList = mutation({
  args: {
    event_id: v.id("events"),
    user_id: v.string(),
    category_id: v.string(),
    quantity: v.number(), // Required quantity field
  },
  handler: async (ctx, args) => {
    // Check if user already in waiting list for this category
    const existing = await ctx.db
      .query("waiting_list")
      .withIndex("by_event_user", (q) => 
        q.eq("event_id", args.event_id).eq("user_id", args.user_id)
      )
      .filter((q) => q.eq(q.field("category_id"), args.category_id))
      .first();

    if (existing) {
      throw new Error("Already in waiting list for this category");
    }

    // Get current queue position for this category
    const waitingCount = await ctx.db
      .query("waiting_list")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("category_id"), args.category_id))
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .collect();

    return await ctx.db.insert("waiting_list", {
      event_id: args.event_id,
      user_id: args.user_id,
      category_id: args.category_id,
      quantity: args.quantity,
      position: waitingCount.length + 1,
      status: "waiting",
      joined_at: Date.now(),
    });
  },
});

export const purchaseFromWaitingList = mutation({
  args: {
    event_id: v.id("events"),
    waiting_list_id: v.id("waiting_list"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.waiting_list_id);
    if (!entry || entry.status !== "offered") {
      throw new Error("Invalid waiting list entry");
    }

    await ctx.db.patch(args.waiting_list_id, {
      status: "purchased",
      updated_at: Date.now(),
    });
  },
});

export const joinWaitingList = mutation({
  args: {
    event_id: v.id("events"),
    user_id: v.string(),
    category_id: v.string(),
    quantity: v.number(),
    product_selections: v.optional(v.array(v.object({
      product_id: v.id("products"),
      quantity: v.number(),
      selected_variants: v.array(v.object({
        variant_id: v.string(),
        option_id: v.string(),
      })),
    }))),
  },
  handler: async (ctx, args) => {
    // Check if user is already in queue for this category
    const existingEntry = await ctx.db
      .query("waiting_list")
      .withIndex("by_event_user", (q) => 
        q.eq("event_id", args.event_id).eq("user_id", args.user_id)
      )
      .filter((q) => q.eq(q.field("category_id"), args.category_id))
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .first();

    if (existingEntry) {
      throw new Error("You are already in the waiting list for this category");
    }

    // Calculate position in queue
    const position = await calculateQueuePosition(ctx, {
      event_id: args.event_id,
      category_id: args.category_id,
    });

    return await ctx.db.insert("waiting_list", {
      event_id: args.event_id,
      user_id: args.user_id,
      category_id: args.category_id,
      quantity: args.quantity,
      status: "waiting",
      position: position + 1,
      joined_at: Date.now(),
      product_selections: args.product_selections,
    });
  },
});

export const releaseTicket = mutation({
  args: {
    event_id: v.id("events"),
    waiting_list_id: v.id("waiting_list"),
  },
  handler: async (ctx, args) => {
    const waitingListEntry = await ctx.db.get(args.waiting_list_id);
    if (!waitingListEntry) {
      throw new Error("Waiting list entry not found");
    }

    // Update status to expired
    await ctx.db.patch(args.waiting_list_id, {
      status: "expired",
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

export const joinMultipleCategoriesQueue = mutation({
  args: {
    event_id: v.id("events"),
    user_id: v.string(),
    categories: v.array(v.object({
      category_id: v.string(),
      quantity: v.number(),
      product_selections: v.optional(v.array(v.object({
        product_id: v.id("products"),
        quantity: v.number(),
        selected_variants: v.array(v.object({
          variant_id: v.string(),
          option_id: v.string(),
        })),
      }))),
    })),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) {
      throw new Error("Event not found");
    }

    // Validate all categories first (fail-fast approach)
    for (const categoryRequest of args.categories) {
      const category = event.categories.find(cat => cat.id === categoryRequest.category_id);
      if (!category) {
        throw new Error(`Category ${categoryRequest.category_id} not found`);
      }

      // Check if user is already in queue for this category
      const existingEntry = await ctx.db
        .query("waiting_list")
        .withIndex("by_event_user", (q) => 
          q.eq("event_id", args.event_id).eq("user_id", args.user_id)
        )
        .filter((q) => q.eq(q.field("category_id"), categoryRequest.category_id))
        .filter((q) => q.eq(q.field("status"), "waiting"))
        .first();

      if (existingEntry) {
        throw new Error(`You are already in the waiting list for category: ${category.name}`);
      }
    }

    // Create queue entries for each category
    const queueEntries = [];
    for (const categoryRequest of args.categories) {
      const position = await calculateQueuePosition(ctx, {
        event_id: args.event_id,
        category_id: categoryRequest.category_id,
      });

      const entryId = await ctx.db.insert("waiting_list", {
        event_id: args.event_id,
        user_id: args.user_id,
        category_id: categoryRequest.category_id,
        quantity: categoryRequest.quantity,
        status: "waiting",
        position: position + 1,
        joined_at: Date.now(),
        product_selections: categoryRequest.product_selections,
      });

      queueEntries.push(entryId);
    }

    return queueEntries;
  },
});

// Get user's queue status for multiple categories
export const getUserQueueStatus = query({
  args: {
    event_id: v.id("events"),
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("waiting_list")
      .withIndex("by_event_user", (q) => 
        q.eq("event_id", args.event_id).eq("user_id", args.user_id)
      )
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .collect();
  },
});

// Helper function to calculate queue position
async function calculateQueuePosition(
  ctx: QueryCtx | MutationCtx,
  args: { event_id: string; category_id: string }
) {
  // Get all waiting entries for this category
  const waitingEntries = await ctx.db
    .query("waiting_list")
    .withIndex("by_event", (q: any) => q.eq("event_id", args.event_id))
    .filter((q: any) => q.eq(q.field("category_id"), args.category_id))
    .filter((q: any) => q.eq(q.field("status"), "waiting"))
    .collect();

  // Calculate total tickets ahead in queue
  let totalTicketsAhead = 0;
  for (const entry of waitingEntries) {
    totalTicketsAhead += entry.quantity;
  }

  return totalTicketsAhead;
}

// Helper function to recalculate queue positions
async function recalculateQueuePositions(
  ctx: MutationCtx,
  args: { event_id: string; category_id: string }
) {
  const waitingEntries = await ctx.db
    .query("waiting_list")
    .withIndex("by_event", (q: any) => q.eq("event_id", args.event_id))
    .filter((q: any) => q.eq(q.field("category_id"), args.category_id))
    .filter((q: any) => q.eq(q.field("status"), "waiting"))
    .order("asc")
    .collect();

  // Sort by joined_at to maintain FIFO order
  waitingEntries.sort((a: any, b: any) => a.joined_at - b.joined_at);

  let currentPosition = 1;
  for (const entry of waitingEntries) {
    await ctx.db.patch(entry._id, {
      position: currentPosition,
      updated_at: Date.now(),
    });
    currentPosition += entry.quantity;
  }
}

// Check availability for a category considering queue
export const checkCategoryAvailability = query({
  args: {
    event_id: v.id("events"),
    category_id: v.string(),
    requested_quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) return null;

    const category = event.categories.find(cat => cat.id === args.category_id);
    if (!category) return null;

    // Count tickets sold from completed bookings
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    let ticketsSold = 0;
    for (const booking of bookings) {
      for (const detail of booking.booking_details) {
        if (detail.category_id === args.category_id) {
          ticketsSold += detail.quantity;
        }
      }
    }

    // Count tickets in queue
    const queueEntries = await ctx.db
      .query("waiting_list")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("category_id"), args.category_id))
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .collect();

    let ticketsInQueue = 0;
    for (const entry of queueEntries) {
      ticketsInQueue += entry.quantity;
    }

    const totalCommitted = ticketsSold + ticketsInQueue;
    const availableForPurchase = category.total_tickets - totalCommitted;
    const canPurchaseDirectly = availableForPurchase >= args.requested_quantity;

    return {
      total_tickets: category.total_tickets,
      tickets_sold: ticketsSold,
      tickets_in_queue: ticketsInQueue,
      available_for_purchase: availableForPurchase,
      can_purchase_directly: canPurchaseDirectly,
      queue_position: canPurchaseDirectly ? 0 : await calculateQueuePosition(ctx, args) + 1,
    };
  },
});

// Process queue when tickets become available
export const processQueueForCategory = mutation({
  args: {
    event_id: v.id("events"),
    category_id: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) return { processed: 0 };

    const category = event.categories.find(cat => cat.id === args.category_id);
    if (!category) return { processed: 0 };

    // Count tickets sold from completed bookings
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    let ticketsSold = 0;
    for (const booking of bookings) {
      for (const detail of booking.booking_details) {
        if (detail.category_id === args.category_id) {
          ticketsSold += detail.quantity;
        }
      }
    }

    const availableTickets = category.total_tickets - ticketsSold;

    // Get queue entries in order
    const queueEntries = await ctx.db
      .query("waiting_list")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("category_id"), args.category_id))
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .order("asc")
      .collect();

    // Sort by position to maintain order
    queueEntries.sort((a, b) => a.position - b.position);

    let processed = 0;
    let remainingTickets = availableTickets;

    for (const entry of queueEntries) {
      if (remainingTickets >= entry.quantity) {
        // Offer tickets to this user
        await ctx.db.patch(entry._id, {
          status: "offered",
          offer_expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
          updated_at: Date.now(),
        });

        remainingTickets -= entry.quantity;
        processed++;
      } else {
        break; // Not enough tickets for this entry
      }
    }

    return { processed };
  },
});

export const leaveWaitingList = mutation({
  args: {
    waiting_list_id: v.id("waiting_list"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.waiting_list_id);
    if (!entry) {
      throw new Error("Waiting list entry not found");
    }

    await ctx.db.patch(args.waiting_list_id, {
      status: "cancelled",
      updated_at: Date.now(),
    });

    // Recalculate positions for remaining entries
    await recalculateQueuePositions(ctx, {
      event_id: entry.event_id,
      category_id: entry.category_id,
    });

    return { success: true };
  },
});

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
  args: {
    event_id: v.id("events"),
    category_id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("waiting_list")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("category_id"), args.category_id))
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .order("asc")
      .collect();
  },
});

export const updateWaitingListStatus = mutation({
  args: {
    waiting_list_id: v.id("waiting_list"),
    status: v.union(
      v.literal("waiting"),
      v.literal("offered"),
      v.literal("expired"),
      v.literal("purchased"),
      v.literal("cancelled")
    ),
    offer_expires_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.waiting_list_id, {
      status: args.status,
      offer_expires_at: args.offer_expires_at,
      updated_at: Date.now(),
    });

    return await ctx.db.get(args.waiting_list_id);
  },
});
