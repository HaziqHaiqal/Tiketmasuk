import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// EVENT FOLLOWERS
// ============================================================================

export const followEvent = mutation({
  args: {
    event_id: v.id("events"),
    notification_preferences: v.optional(v.object({
      event_updates: v.optional(v.boolean()),
      price_changes: v.optional(v.boolean()),
      availability_alerts: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if already following
    const existing = await ctx.db
      .query("event_followers")
      .withIndex("by_event_and_user", (q) => 
        q.eq("event_id", args.event_id).eq("user_id", identity.subject as Id<"users">)
      )
      .first();

    if (existing) {
      throw new Error("Already following this event");
    }

    return await ctx.db.insert("event_followers", {
      event_id: args.event_id,
      user_id: identity.subject as Id<"users">,
      notification_preferences: args.notification_preferences || {
        event_updates: true,
        price_changes: true,
        availability_alerts: true,
      },
      created_at: Date.now(),
    });
  },
});

export const unfollowEvent = mutation({
  args: {
    event_id: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const following = await ctx.db
      .query("event_followers")
      .withIndex("by_event_and_user", (q) => 
        q.eq("event_id", args.event_id).eq("user_id", identity.subject as Id<"users">)
      )
      .first();

    if (!following) {
      throw new Error("Not following this event");
    }

    await ctx.db.delete(following._id);
    return { success: true };
  },
});

export const getEventFollowers = query({
  args: {
    event_id: v.id("events"),
  },
  handler: async (ctx, args) => {
    const followers = await ctx.db
      .query("event_followers")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .collect();

    return followers.length;
  },
});

export const getUserFollowedEvents = query({
  args: {
    user_id: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = args.user_id || (identity?.subject as Id<"users">);
    
    if (!userId) {
      throw new Error("User ID required");
    }

    const followedEvents = await ctx.db
      .query("event_followers")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .collect();

    // Get event details
    const events = await Promise.all(
      followedEvents.map(async (follow) => {
        const event = await ctx.db.get(follow.event_id);
        return event ? { ...event, followedAt: follow.created_at } : null;
      })
    );

    return events.filter(Boolean);
  },
});

export const isFollowingEvent = query({
  args: {
    event_id: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const following = await ctx.db
      .query("event_followers")
      .withIndex("by_event_and_user", (q) => 
        q.eq("event_id", args.event_id).eq("user_id", identity.subject as Id<"users">)
      )
      .first();

    return !!following;
  },
});

// ============================================================================
// EVENT SHARES
// ============================================================================

export const shareEvent = mutation({
  args: {
    event_id: v.id("events"),
    platform: v.union(
      v.literal("facebook"),
      v.literal("twitter"), 
      v.literal("whatsapp"),
      v.literal("telegram"),
      v.literal("email"),
      v.literal("copy_link")
    ),
    referrer_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    return await ctx.db.insert("event_shares", {
      event_id: args.event_id,
      user_id: identity?.subject as Id<"users"> || undefined,
      platform: args.platform,
      referrer_url: args.referrer_url,
      shared_at: Date.now(),
    });
  },
});

export const getEventShares = query({
  args: {
    event_id: v.id("events"),
  },
  handler: async (ctx, args) => {
    const shares = await ctx.db
      .query("event_shares")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .collect();

    // Group by platform
    const sharesByPlatform = shares.reduce((acc, share) => {
      acc[share.platform] = (acc[share.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalShares: shares.length,
      sharesByPlatform,
      recentShares: shares
        .sort((a, b) => b.shared_at - a.shared_at)
        .slice(0, 10),
    };
  },
});

// ============================================================================
// USER EVENT INTERACTIONS
// ============================================================================

export const recordInteraction = mutation({
  args: {
    event_id: v.id("events"),
    interaction_type: v.union(
      v.literal("viewed"),
      v.literal("liked"),
      v.literal("shared"),
      v.literal("bookmarked"),
      v.literal("attended"),
      v.literal("reviewed")
    ),
    metadata: v.optional(v.object({})),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("user_event_interactions", {
      user_id: identity.subject as Id<"users">,
      event_id: args.event_id,
      interaction_type: args.interaction_type,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
  },
});

export const getUserInteractions = query({
  args: {
    user_id: v.optional(v.id("users")),
    interaction_type: v.optional(v.union(
      v.literal("viewed"),
      v.literal("liked"),
      v.literal("shared"),
      v.literal("bookmarked"),
      v.literal("attended"),
      v.literal("reviewed")
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = args.user_id || (identity?.subject as Id<"users">);
    
    if (!userId) {
      throw new Error("User ID required");
    }

    let query = ctx.db
      .query("user_event_interactions")
      .withIndex("by_user", (q) => q.eq("user_id", userId));

    if (args.interaction_type) {
      query = query.filter((q) => q.eq(q.field("interaction_type"), args.interaction_type));
    }

    return await query.collect();
  },
});

export const getEventInteractions = query({
  args: {
    event_id: v.id("events"),
  },
  handler: async (ctx, args) => {
    const interactions = await ctx.db
      .query("user_event_interactions")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .collect();

    // Group by interaction type
    const interactionsByType = interactions.reduce((acc, interaction) => {
      acc[interaction.interaction_type] = (acc[interaction.interaction_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalInteractions: interactions.length,
      interactionsByType,
      uniqueUsers: new Set(interactions.map(i => i.user_id)).size,
    };
  },
});

export const getUserEventHistory = query({
  args: {
    user_id: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = args.user_id || (identity?.subject as Id<"users">);
    
    if (!userId) {
      throw new Error("User ID required");
    }

    // Get all user interactions
    const interactions = await ctx.db
      .query("user_event_interactions")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .collect();

    // Get event details for each interaction
    const eventDetails = new Map();
    for (const interaction of interactions) {
      if (!eventDetails.has(interaction.event_id)) {
        const event = await ctx.db.get(interaction.event_id);
        if (event) {
          eventDetails.set(interaction.event_id, event);
        }
      }
    }

    // Group interactions by event
    const eventHistory = Array.from(eventDetails.values()).map(event => {
      const eventInteractions = interactions.filter(i => i.event_id === event._id);
      return {
        event,
        interactions: eventInteractions.sort((a, b) => b.timestamp - a.timestamp),
        lastInteraction: Math.max(...eventInteractions.map(i => i.timestamp)),
        interactionTypes: [...new Set(eventInteractions.map(i => i.interaction_type))],
      };
    });

    return eventHistory.sort((a, b) => b.lastInteraction - a.lastInteraction);
  },
}); 