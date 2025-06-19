import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// PUSH NOTIFICATION TOKENS
// ============================================================================

export const registerPushToken = mutation({
  args: {
    token: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android"), v.literal("web")),
    device_info: v.optional(v.object({
      device_id: v.optional(v.string()),
      app_version: v.optional(v.string()),
      os_version: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if token already exists for this user
    const existingToken = await ctx.db
      .query("push_notification_tokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (existingToken) {
      // Update existing token
      await ctx.db.patch(existingToken._id, {
        is_active: true,
        last_used: Date.now(),
        device_info: args.device_info,
      });
      return existingToken._id;
    }

    // Create new token
    return await ctx.db.insert("push_notification_tokens", {
      user_id: identity.subject as Id<"users">,
      token: args.token,
      platform: args.platform,
      device_info: args.device_info,
      is_active: true,
      last_used: Date.now(),
      created_at: Date.now(),
    });
  },
});

export const updatePushToken = mutation({
  args: {
    token_id: v.id("push_notification_tokens"),
    is_active: v.optional(v.boolean()),
    device_info: v.optional(v.object({
      device_id: v.optional(v.string()),
      app_version: v.optional(v.string()),
      os_version: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const token = await ctx.db.get(args.token_id);
    if (!token || token.user_id !== identity.subject) {
      throw new Error("Token not found or not authorized");
    }

    const { token_id, ...updates } = args;
    
    await ctx.db.patch(token_id, {
      ...updates,
      last_used: Date.now(),
    });

    return await ctx.db.get(token_id);
  },
});

export const getUserPushTokens = query({
  args: {
    user_id: v.optional(v.id("users")),
    platform: v.optional(v.union(v.literal("ios"), v.literal("android"), v.literal("web"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = args.user_id || (identity?.subject as Id<"users">);
    
    if (!userId) {
      throw new Error("User ID required");
    }

    let query = ctx.db
      .query("push_notification_tokens")
      .withIndex("by_user", (q) => q.eq("user_id", userId));

    if (args.platform) {
      query = query.filter((q) => q.eq(q.field("platform"), args.platform));
    }

    return await query
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
  },
});

export const deactivatePushToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const token = await ctx.db
      .query("push_notification_tokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (token) {
      await ctx.db.patch(token._id, {
        is_active: false,
      });
    }

    return { success: true };
  },
});

// ============================================================================
// OFFLINE TICKET CACHE
// ============================================================================

export const cacheTicketForOffline = mutation({
  args: {
    booking_id: v.id("bookings"),
    ticket_data: v.object({
      qr_code: v.string(),
      event_details: v.object({}),
      venue_info: v.object({}),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify booking belongs to user
    const booking = await ctx.db.get(args.booking_id);
    if (!booking || booking.customer_id !== identity.subject) {
      throw new Error("Booking not found or not authorized");
    }

    // Check if cache already exists
    const existingCache = await ctx.db
      .query("offline_ticket_cache")
      .withIndex("by_booking", (q) => q.eq("booking_id", args.booking_id))
      .first();

    const cacheData = {
      booking_id: args.booking_id,
      user_id: identity.subject as Id<"users">,
      ticket_data: args.ticket_data,
      download_count: existingCache ? (existingCache.download_count || 0) + 1 : 1,
      last_synced: Date.now(),
      cache_expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
      created_at: existingCache?.created_at || Date.now(),
    };

    if (existingCache) {
      await ctx.db.patch(existingCache._id, cacheData);
      return existingCache._id;
    } else {
      return await ctx.db.insert("offline_ticket_cache", cacheData);
    }
  },
});

export const getOfflineTicketCache = query({
  args: {
    booking_id: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify booking belongs to user
    const booking = await ctx.db.get(args.booking_id);
    if (!booking || booking.customer_id !== identity.subject) {
      throw new Error("Booking not found or not authorized");
    }

    const cache = await ctx.db
      .query("offline_ticket_cache")
      .withIndex("by_booking", (q) => q.eq("booking_id", args.booking_id))
      .first();

    if (!cache || cache.cache_expires_at < Date.now()) {
      return null;
    }

    return cache;
  },
});

export const getUserOfflineTickets = query({
  args: {
    user_id: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = args.user_id || (identity?.subject as Id<"users">);
    
    if (!userId) {
      throw new Error("User ID required");
    }

    const caches = await ctx.db
      .query("offline_ticket_cache")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .filter((q) => q.gt(q.field("cache_expires_at"), Date.now()))
      .collect();

    // Get booking details for each cache
    const ticketsWithBookings = await Promise.all(
      caches.map(async (cache) => {
        const booking = await ctx.db.get(cache.booking_id);
        return booking ? { ...cache, booking } : null;
      })
    );

    return ticketsWithBookings.filter(Boolean);
  },
});

export const updateOfflineTicketSync = mutation({
  args: {
    cache_id: v.id("offline_ticket_cache"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const cache = await ctx.db.get(args.cache_id);
    if (!cache || cache.user_id !== identity.subject) {
      throw new Error("Cache not found or not authorized");
    }

    await ctx.db.patch(args.cache_id, {
      last_synced: Date.now(),
    });

    return await ctx.db.get(args.cache_id);
  },
});

export const cleanupExpiredCaches = mutation({
  args: {},
  handler: async (ctx) => {
    const expiredCaches = await ctx.db
      .query("offline_ticket_cache")
      .withIndex("by_expires_at", (q) => q.lt("cache_expires_at", Date.now()))
      .collect();

    for (const cache of expiredCaches) {
      await ctx.db.delete(cache._id);
    }

    return { deletedCount: expiredCaches.length };
  },
});

// ============================================================================
// MOBILE APP ANALYTICS
// ============================================================================

export const trackMobileAppUsage = mutation({
  args: {
    platform: v.union(v.literal("ios"), v.literal("android")),
    app_version: v.string(),
    event_type: v.union(
      v.literal("page_view"),
      v.literal("event_view"),
      v.literal("ticket_add_to_cart"),
      v.literal("booking_started"),
      v.literal("booking_completed"),
      v.literal("search_performed")
    ),
    metadata: v.optional(v.object({})),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // Track usage even for anonymous users
    return await ctx.db.insert("analytics_events", {
      event_type: args.event_type,
      user_id: identity?.subject as Id<"users"> || undefined,
      properties: {
        device_type: "mobile",
        user_agent: `${args.platform}/${args.app_version}`,
        ...args.metadata,
      },
      timestamp: Date.now(),
    });
  },
});

export const getMobileAppStats = query({
  args: {
    start_date: v.optional(v.number()),
    end_date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // TODO: Add admin check here

    let query = ctx.db
      .query("analytics_events")
      .filter((q) => q.eq(q.field("properties.device_type"), "mobile"));

    if (args.start_date) {
      query = query.filter((q) => q.gte(q.field("timestamp"), args.start_date!));
    }

    if (args.end_date) {
      query = query.filter((q) => q.lte(q.field("timestamp"), args.end_date!));
    }

    const events = await query.collect();

    // Aggregate statistics
    const stats = {
      totalEvents: events.length,
      eventsByType: {} as Record<string, number>,
      eventsByPlatform: {} as Record<string, number>,
      uniqueUsers: new Set(events.map(e => e.user_id).filter(Boolean)).size,
    };

    events.forEach(event => {
      // By event type
      stats.eventsByType[event.event_type] = (stats.eventsByType[event.event_type] || 0) + 1;

      // By platform (extracted from user_agent)
      const userAgent = event.properties?.user_agent as string;
      if (userAgent) {
        const platform = userAgent.split('/')[0];
        if (platform) {
          stats.eventsByPlatform[platform] = (stats.eventsByPlatform[platform] || 0) + 1;
        }
      }
    });

    return stats;
  },
}); 