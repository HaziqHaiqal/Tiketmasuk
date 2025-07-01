import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// ORGANIZER PROFILE MANAGEMENT
// ============================================================================

export const createProfile = mutation({
  args: {
    fullName: v.string(),
    displayName: v.string(),
    storeName: v.string(),
    storeDescription: v.optional(v.string()),
    organizerType: v.union(v.literal("individual"), v.literal("business")),
    phone: v.string(),
    website: v.optional(v.string()),
    primaryLocation: v.string(),
    businessName: v.optional(v.string()),
    businessRegistration: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated to create organizer profile");
    }

    return await ctx.db.insert("organizer_profiles", {
      userId: identity.subject as any,
      fullName: args.fullName,
      displayName: args.displayName,
      storeName: args.storeName,
      storeDescription: args.storeDescription,
      organizerType: args.organizerType,
      phone: args.phone,
      website: args.website,
      primaryLocation: args.primaryLocation,
      businessName: args.businessName,
      businessRegistration: args.businessRegistration,
      notifications: {
        email: true,
        push: true,
        sms: false,
        marketing: true,
      },
      privacy: {
        profileVisibility: "public",
        showEmail: false,
        showPhone: true,
      },
      isVerified: false,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId as any))
      .first();
  },
});

export const updateProfile = mutation({
  args: {
    profileId: v.id("organizer_profiles"),
    fullName: v.optional(v.string()),
    displayName: v.optional(v.string()),
    storeName: v.optional(v.string()),
    storeDescription: v.optional(v.string()),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    primaryLocation: v.optional(v.string()),
    businessName: v.optional(v.string()),
    businessRegistration: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { profileId, ...updates } = args;
    
    await ctx.db.patch(profileId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(profileId);
  },
});

// Note: Image storage functionality removed - not in current schema

export const getProfile = query({
  args: { organizerId: v.id("organizer_profiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.organizerId);
  },
});

export const getByStatus = query({
  args: {
    status: v.boolean()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizer_profiles")
      .filter((q) => q.eq(q.field("isVerified"), args.status))
      .collect();
  },
});

export const approveProfile = mutation({
  args: { profileId: v.id("organizer_profiles") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profileId, {
      isVerified: true,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.profileId);
  },
});

export const rejectProfile = mutation({
  args: { 
    profileId: v.id("organizer_profiles"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profileId, {
      isVerified: false,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.profileId);
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("organizer_profiles").collect();
  },
});

export const updateNotifications = mutation({
  args: {
    profileId: v.id("organizer_profiles"),
    notifications: v.object({
      email: v.boolean(),
      push: v.boolean(),
      sms: v.boolean(),
      marketing: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const { profileId, notifications } = args;
    
    await ctx.db.patch(profileId, {
      notifications,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(profileId);
  },
});

export const updatePrivacy = mutation({
  args: {
    profileId: v.id("organizer_profiles"),
    privacy: v.object({
      profileVisibility: v.union(v.literal("public"), v.literal("private")),
      showEmail: v.boolean(),
      showPhone: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const { profileId, privacy } = args;
    
    await ctx.db.patch(profileId, {
      privacy,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(profileId);
  },
});

// Note: Image deletion functionality removed - not in current schema

// Query to get all verified organizers for public listing
export const getVerifiedOrganizers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("organizer_profiles")
      .filter((q) => q.eq(q.field("isVerified"), true))
      .collect();
  },
});

// Get organizer profile with live event counts and images
export const getProfileWithStats = query({
  args: { organizerId: v.id("organizer_profiles") },
  handler: async (ctx, args) => {
    const organizer = await ctx.db.get(args.organizerId);
    if (!organizer) return null;

    // Get live event count
    const events = await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizer_id", args.organizerId))
      .collect();

    const now = Date.now();
    const upcomingEvents = events.filter(event => event.start_datetime > now);
    const pastEvents = events.filter(event => event.start_datetime <= now);

    return {
      ...organizer,
      // Live stats
      liveTotalEvents: events.length,
      liveUpcomingEvents: upcomingEvents.length,
      livePastEvents: pastEvents.length,
    };
  },
});

// Get all verified organizers with live event counts
export const getVerifiedOrganizersWithStats = query({
  args: {},
  handler: async (ctx) => {
    const organizers = await ctx.db
      .query("organizer_profiles")
      .filter((q) => q.eq(q.field("isVerified"), true))
      .collect();

    // Get event counts for all organizers in parallel
    const organizersWithStats = await Promise.all(
      organizers.map(async (organizer) => {
        const events = await ctx.db
          .query("events")
          .withIndex("by_organizer", (q) => q.eq("organizer_id", organizer._id))
          .collect();

        return {
          ...organizer,
          liveTotalEvents: events.length,
        };
      })
    );

    return organizersWithStats;
  },
}); 