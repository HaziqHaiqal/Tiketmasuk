import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { DURATIONS } from "./constants";
import { internal } from "./_generated/api";

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
      .withIndex("by_position", (q) => q.eq("event_id", args.event_id))
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
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    quantity: v.number(), // Required quantity field
  },
  handler: async (ctx, args) => {
    // Check if user already in waiting list for this event
    const existing = await ctx.db
      .query("waiting_list")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("user_id"), args.user_id))
      .first();

    if (existing) {
      throw new Error("Already in waiting list for this event");
    }

    // Get current queue position
    const waitingCount = await ctx.db
      .query("waiting_list")
      .withIndex("by_event_status", (q) => 
        q.eq("event_id", args.event_id).eq("status", "waiting")
      )
      .collect();

    return await ctx.db.insert("waiting_list", {
      event_id: args.event_id,
      user_id: args.user_id,
      email: args.email,
      name: args.name,
      phone: args.phone,
      quantity: args.quantity,
      position: waitingCount.length + 1,
      status: "waiting",
      created_at: Date.now(),
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
    quantity: v.number(), // Number of tickets requested (required)
  },
  handler: async (ctx, args) => {
    const quantity = args.quantity;
    
    // Remove any expired offers for this user and event first
    const existingExpired = await ctx.db
      .query("waiting_list")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("user_id"), args.user_id))
      .filter((q) => q.eq(q.field("status"), "expired"))
      .collect();

    // Delete expired entries
    for (const expired of existingExpired) {
      await ctx.db.delete(expired._id);
    }

    // Check if user already has active offer or waiting for this event
    const existing = await ctx.db
      .query("waiting_list")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("user_id"), args.user_id))
      .filter((q) => q.or(
        q.eq(q.field("status"), "waiting"),
        q.eq(q.field("status"), "offered")
      ))
      .first();

    if (existing) {
      throw new Error("You already have an active request for this event");
    }

    // Get user details first
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check event and availability
    const event = await ctx.db.get(args.event_id);
    if (!event) {
      throw new Error("Event not found");
    }

    // Count purchased tickets from booking_items
    const bookingItems = await ctx.db
      .query("booking_items")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .collect();

    const purchasedCount = await Promise.all(
      bookingItems.map(async (item) => {
        const booking = await ctx.db.get(item.booking_id);
        return booking?.status === "completed" ? item.quantity : 0;
      })
    ).then(counts => counts.reduce((sum, count) => sum + count, 0));

    // Count tickets in active queue (waiting + offered)
    const activeQueue = await ctx.db
      .query("waiting_list")
      .withIndex("by_event_status", (q) => 
        q.eq("event_id", args.event_id)
      )
      .filter((q) => q.or(
        q.eq(q.field("status"), "waiting"),
        q.eq(q.field("status"), "offered")
      ))
      .collect();

    const ticketsInQueue = activeQueue.reduce((sum, entry) => sum + (entry.quantity || 1), 0);
    const totalTicketsSpoken = purchasedCount + ticketsInQueue;
    
    // Check if enough tickets available for this request
    if (totalTicketsSpoken + quantity > event.total_tickets) {
      throw new Error(`Only ${event.total_tickets - totalTicketsSpoken} tickets remaining`);
    }

    // Calculate position based on tickets, not users
    const currentWaitingTickets = activeQueue
      .filter(entry => entry.status === "waiting")
      .reduce((sum, entry) => sum + (entry.quantity || 1), 0);

    // If no queue and tickets available, offer immediately
    const shouldOfferImmediately = currentWaitingTickets === 0 && 
                                   (purchasedCount + quantity <= event.total_tickets);

    // Add to waiting list
    const waitingListId = await ctx.db.insert("waiting_list", {
      event_id: args.event_id,
      user_id: args.user_id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      quantity: quantity,
      position: currentWaitingTickets + 1, // Position based on ticket count
      status: shouldOfferImmediately ? "offered" : "waiting",
      offer_expires_at: shouldOfferImmediately ? Date.now() + DURATIONS.OFFER_EXPIRY : undefined,
      created_at: Date.now(),
    });

    // Schedule expiry if offered immediately
    if (shouldOfferImmediately) {
      await ctx.scheduler.runAfter(
        DURATIONS.OFFER_EXPIRY,
        internal.waitingList.expireOffer,
        {
          waiting_list_id: waitingListId,
          event_id: args.event_id,
        }
      );
    }

    return { success: true, waitingListId, quantity };
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
