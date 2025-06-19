import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// ORGANIZER PROFILE MANAGEMENT
// ============================================================================

export const createProfile = mutation({
  args: {
    business_name: v.string(),
    business_type: v.union(
      v.literal("individual"),
      v.literal("sole_proprietorship"), 
      v.literal("llc"),
      v.literal("corporation"),
      v.literal("nonprofit"),
      v.literal("partnership"),
      v.literal("government")
    ),
    display_name: v.string(),
    business_address: v.object({
      street: v.optional(v.string()),
      city: v.string(),
      state_province: v.string(),
      postal_code: v.optional(v.string()),
      country: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated to create organizer profile");
    }

    return await ctx.db.insert("organizer_profiles", {
      user_id: identity.subject as any,
      business_name: args.business_name,
      business_type: args.business_type,
      display_name: args.display_name,
      business_address: args.business_address,
      verification_status: "pending",
      subscription_tier: "free",
      created_at: Date.now(),
    });
  },
});

export const getByUserId = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id as any))
      .first();
  },
});

export const updateProfile = mutation({
  args: {
    profile_id: v.id("organizer_profiles"),
    business_name: v.optional(v.string()),
    display_name: v.optional(v.string()),
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    business_phone: v.optional(v.string()),
    business_email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { profile_id, ...updates } = args;
    
    await ctx.db.patch(profile_id, {
      ...updates,
      updated_at: Date.now(),
    });

    return await ctx.db.get(profile_id);
  },
});

export const updateImages = mutation({
  args: {
    profile_id: v.id("organizer_profiles"),
    logo_storage_id: v.optional(v.id("_storage")),
    banner_storage_id: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { profile_id, ...imageUpdates } = args;
    const organizer = await ctx.db.get(profile_id);
    
    if (!organizer) {
      throw new Error("Organizer profile not found");
    }

    // Clean up old images if replacing
    let storageIdToDelete: Id<"_storage"> | undefined;
    
    if (imageUpdates.logo_storage_id && organizer.logo_storage_id) {
      storageIdToDelete = organizer.logo_storage_id;
    }
    
    if (imageUpdates.banner_storage_id && organizer.banner_storage_id) {
      storageIdToDelete = organizer.banner_storage_id;
    }

    // Update the profile
    await ctx.db.patch(profile_id, {
      ...imageUpdates,
      updated_at: Date.now(),
    });

    // Delete old image if needed
    if (storageIdToDelete) {
      await ctx.storage.delete(storageIdToDelete);
    }

    return await ctx.db.get(profile_id);
  },
});

export const getProfileWithImages = query({
  args: { organizer_id: v.id("organizer_profiles") },
  handler: async (ctx, args) => {
    const organizer = await ctx.db.get(args.organizer_id);
    if (!organizer) return null;

    // Get image URLs
    const logoUrl = organizer.logo_storage_id
      ? await ctx.storage.getUrl(organizer.logo_storage_id)
      : null;

    const bannerUrl = organizer.banner_storage_id
      ? await ctx.storage.getUrl(organizer.banner_storage_id)
      : null;

    return {
      ...organizer,
      logo_url: logoUrl,
      banner_url: bannerUrl,
    };
  },
});

export const getByStatus = query({
  args: {
    status: v.union(v.literal("pending"), v.literal("verified"), v.literal("rejected"))
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizer_profiles")
      .withIndex("by_status", (q) => q.eq("verification_status", args.status))
      .collect();
  },
});

export const approveProfile = mutation({
  args: { profile_id: v.id("organizer_profiles") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profile_id, {
      verification_status: "verified",
      updated_at: Date.now(),
    });

    return await ctx.db.get(args.profile_id);
  },
});

export const rejectProfile = mutation({
  args: { 
    profile_id: v.id("organizer_profiles"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profile_id, {
      verification_status: "rejected",
      updated_at: Date.now(),
    });

    return await ctx.db.get(args.profile_id);
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("organizer_profiles").collect();
  },
});

export const updateSubscription = mutation({
  args: {
    profile_id: v.id("organizer_profiles"),
    subscription_tier: v.union(
      v.literal("free"),
      v.literal("basic"), 
      v.literal("pro"),
      v.literal("enterprise")
    ),
    subscription_expires_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { profile_id, ...updates } = args;
    
    await ctx.db.patch(profile_id, {
      ...updates,
      updated_at: Date.now(),
    });

    return await ctx.db.get(profile_id);
  },
});

export const updateMetrics = mutation({
  args: {
    organizer_id: v.id("organizer_profiles"),
    total_events_hosted: v.optional(v.number()),
    total_tickets_sold: v.optional(v.number()),
    total_revenue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { organizer_id, ...metrics } = args;
    
    await ctx.db.patch(organizer_id, {
      ...metrics,
      updated_at: Date.now(),
    });

    return await ctx.db.get(organizer_id);
  },
});

export const deleteImage = mutation({
  args: {
    profile_id: v.id("organizer_profiles"),
    image_type: v.union(v.literal("logo"), v.literal("banner")),
  },
  handler: async (ctx, args) => {
    const organizer = await ctx.db.get(args.profile_id);
    if (!organizer) {
      throw new Error("Organizer profile not found");
    }

    let storageIdToDelete: Id<"_storage"> | undefined;
    const updates: Record<string, any> = { updated_at: Date.now() };

    if (args.image_type === "logo" && organizer.logo_storage_id) {
      storageIdToDelete = organizer.logo_storage_id;
      updates.logo_storage_id = undefined;
    } else if (args.image_type === "banner" && organizer.banner_storage_id) {
      storageIdToDelete = organizer.banner_storage_id;
      updates.banner_storage_id = undefined;
    }

    if (storageIdToDelete) {
      // Delete from storage
      await ctx.storage.delete(storageIdToDelete);
      
      // Update profile to remove storage reference
      await ctx.db.patch(args.profile_id, updates);
    }

    return await ctx.db.get(args.profile_id);
  },
});

// Query to get all verified organizers for public listing
export const getVerifiedOrganizers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("organizer_profiles")
      .withIndex("by_status", (q) => q.eq("verification_status", "verified"))
      .collect();
  },
}); 