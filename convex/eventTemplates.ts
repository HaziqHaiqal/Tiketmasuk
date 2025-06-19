import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// EVENT TEMPLATES MANAGEMENT
// ============================================================================

export const create = mutation({
  args: {
    template_name: v.string(),
    description: v.optional(v.string()),
    template_data: v.object({}), // Serialized event data
    category: v.optional(v.string()),
    is_public: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get organizer profile
    const userProfile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject as Id<"users">))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const organizerProfile = await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject as Id<"users">))
      .first();

    if (!organizerProfile) {
      throw new Error("Organizer profile not found");
    }

    return await ctx.db.insert("event_templates", {
      organizer_id: organizerProfile._id,
      template_name: args.template_name,
      description: args.description,
      template_data: args.template_data,
      category: args.category,
      is_public: args.is_public,
      usage_count: 0,
      created_at: Date.now(),
    });
  },
});

export const getByOrganizer = query({
  args: {
    organizer_id: v.id("organizer_profiles"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("event_templates")
      .withIndex("by_organizer", (q) => q.eq("organizer_id", args.organizer_id))
      .collect();
  },
});

export const getPublicTemplates = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("event_templates")
      .withIndex("by_public", (q) => q.eq("is_public", true));

    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    return await query.collect();
  },
});

export const get = query({
  args: {
    template_id: v.id("event_templates"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.template_id);
  },
});

export const update = mutation({
  args: {
    template_id: v.id("event_templates"),
    template_name: v.optional(v.string()),
    description: v.optional(v.string()),
    template_data: v.optional(v.object({})),
    category: v.optional(v.string()),
    is_public: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const template = await ctx.db.get(args.template_id);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check ownership
    const organizerProfile = await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject as Id<"users">))
      .first();

    if (!organizerProfile || organizerProfile._id !== template.organizer_id) {
      throw new Error("Not authorized to update this template");
    }

    const { template_id, ...updates } = args;
    
    await ctx.db.patch(template_id, {
      ...updates,
      updated_at: Date.now(),
    });

    return await ctx.db.get(template_id);
  },
});

export const deleteTemplate = mutation({
  args: {
    template_id: v.id("event_templates"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const template = await ctx.db.get(args.template_id);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check ownership
    const organizerProfile = await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject as Id<"users">))
      .first();

    if (!organizerProfile || organizerProfile._id !== template.organizer_id) {
      throw new Error("Not authorized to delete this template");
    }

    await ctx.db.delete(args.template_id);
    return { success: true };
  },
});

export const incrementUsage = mutation({
  args: {
    template_id: v.id("event_templates"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.template_id);
    if (!template) {
      throw new Error("Template not found");
    }

    await ctx.db.patch(args.template_id, {
      usage_count: (template.usage_count || 0) + 1,
      updated_at: Date.now(),
    });

    return await ctx.db.get(args.template_id);
  },
});

// ============================================================================
// EVENT SERIES MANAGEMENT
// ============================================================================

export const createSeries = mutation({
  args: {
    series_name: v.string(),
    description: v.optional(v.string()),
    event_ids: v.array(v.id("events")),
    series_discount_percentage: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const organizerProfile = await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject as Id<"users">))
      .first();

    if (!organizerProfile) {
      throw new Error("Organizer profile not found");
    }

    return await ctx.db.insert("event_series", {
      series_name: args.series_name,
      organizer_id: organizerProfile._id,
      description: args.description,
      event_ids: args.event_ids,
      series_discount_percentage: args.series_discount_percentage,
      is_active: true,
      created_at: Date.now(),
    });
  },
});

export const getSeriesByOrganizer = query({
  args: {
    organizer_id: v.id("organizer_profiles"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("event_series")
      .withIndex("by_organizer", (q) => q.eq("organizer_id", args.organizer_id))
      .collect();
  },
});

export const getSeries = query({
  args: {
    series_id: v.id("event_series"),
  },
  handler: async (ctx, args) => {
    const series = await ctx.db.get(args.series_id);
    if (!series) return null;

    // Get events in the series
    const events = await Promise.all(
      series.event_ids.map(eventId => ctx.db.get(eventId))
    );

    return {
      ...series,
      events: events.filter(Boolean), // Remove any null events
    };
  },
});

export const updateSeries = mutation({
  args: {
    series_id: v.id("event_series"),
    series_name: v.optional(v.string()),
    description: v.optional(v.string()),
    event_ids: v.optional(v.array(v.id("events"))),
    series_discount_percentage: v.optional(v.number()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const series = await ctx.db.get(args.series_id);
    if (!series) {
      throw new Error("Series not found");
    }

    // Check ownership
    const organizerProfile = await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject as Id<"users">))
      .first();

    if (!organizerProfile || organizerProfile._id !== series.organizer_id) {
      throw new Error("Not authorized to update this series");
    }

    const { series_id, ...updates } = args;
    
    await ctx.db.patch(series_id, {
      ...updates,
      updated_at: Date.now(),
    });

    return await ctx.db.get(series_id);
  },
}); 