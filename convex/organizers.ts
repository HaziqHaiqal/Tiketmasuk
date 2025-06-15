import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create organizer profile
export const createOrganizerProfile = mutation({
  args: {
    user_id: v.string(),
    display_name: v.string(),
    full_name: v.string(),
    email: v.string(),
    phone: v.string(),
    store_name: v.string(),
    store_description: v.optional(v.string()),
    organizer_type: v.union(
      v.literal("individual"),
      v.literal("group"),
      v.literal("organization"),
      v.literal("business")
    ),
    primary_location: v.string(),
    website: v.optional(v.string()),
    business_name: v.optional(v.string()),
    business_registration: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const organizerId = await ctx.db.insert("organizer_profiles", {
      ...args,
      verification_status: "unverified",
      status: "active",
      created_at: Date.now(),
    });
    
    return organizerId;
  },
});

// Get organizer profile by user ID
export const getOrganizerByUserId = query({
  args: { user_id: v.string() },
  handler: async (ctx, { user_id }) => {
    return await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", user_id))
      .first();
  },
});

// Get organizer profile by ID
export const getOrganizerById = query({
  args: { organizer_id: v.id("organizer_profiles") },
  handler: async (ctx, { organizer_id }) => {
    return await ctx.db.get(organizer_id);
  },
});

// Update organizer profile
export const updateOrganizerProfile = mutation({
  args: {
    organizer_id: v.id("organizer_profiles"),
    display_name: v.optional(v.string()),
    full_name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    store_name: v.optional(v.string()),
    store_description: v.optional(v.string()),
    organizer_type: v.optional(v.union(
      v.literal("individual"),
      v.literal("group"),
      v.literal("organization"),
      v.literal("business")
    )),
    primary_location: v.optional(v.string()),
    website: v.optional(v.string()),
    business_name: v.optional(v.string()),
    business_registration: v.optional(v.string()),
  },
  handler: async (ctx, { organizer_id, ...updates }) => {
    await ctx.db.patch(organizer_id, {
      ...updates,
      updated_at: Date.now(),
    });
  },
});

// Update organizer images
export const updateImages = mutation({
  args: {
    organizerId: v.id("organizer_profiles"),
    images: v.object({
      profileImage: v.optional(v.string()),
      storeLogo: v.optional(v.string()),
      storeBanner: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { organizerId, images }) => {
    const updates: any = {
      updated_at: Date.now(),
    };

    // Update storage IDs
    if (images.profileImage) {
      updates.profile_image_storage_id = images.profileImage;
    }
    if (images.storeLogo) {
      updates.store_logo_storage_id = images.storeLogo;
    }
    if (images.storeBanner) {
      updates.store_banner_storage_id = images.storeBanner;
    }

    await ctx.db.patch(organizerId, updates);
  },
});

// Delete organizer image
export const deleteImage = mutation({
  args: {
    organizerId: v.id("organizer_profiles"),
    imageType: v.union(
      v.literal("profileImage"),
      v.literal("storeLogo"),
      v.literal("storeBanner")
    ),
  },
  handler: async (ctx, { organizerId, imageType }) => {
    const organizer = await ctx.db.get(organizerId);
    if (!organizer) {
      throw new Error("Organizer not found");
    }

    const updates: any = {
      updated_at: Date.now(),
    };

    let storageIdToDelete: Id<"_storage"> | undefined;

    // Determine which image to delete
    switch (imageType) {
      case "profileImage":
        storageIdToDelete = organizer.profile_image_storage_id;
        updates.profile_image_storage_id = undefined;
        break;
      case "storeLogo":
        storageIdToDelete = organizer.store_logo_storage_id;
        updates.store_logo_storage_id = undefined;
        break;
      case "storeBanner":
        storageIdToDelete = organizer.store_banner_storage_id;
        updates.store_banner_storage_id = undefined;
        break;
    }

    // Delete from storage if exists
    if (storageIdToDelete) {
      await ctx.storage.delete(storageIdToDelete);
    }

    // Update database
    await ctx.db.patch(organizerId, updates);
  },
});

// Get organizer with image URLs
export const getOrganizerWithImages = query({
  args: { organizer_id: v.id("organizer_profiles") },
  handler: async (ctx, { organizer_id }) => {
    const organizer = await ctx.db.get(organizer_id);
    if (!organizer) {
      return null;
    }

    // Get image URLs
    const profileImageUrl = organizer.profile_image_storage_id
      ? await ctx.storage.getUrl(organizer.profile_image_storage_id)
      : undefined;
    
    const storeLogoUrl = organizer.store_logo_storage_id
      ? await ctx.storage.getUrl(organizer.store_logo_storage_id)
      : undefined;
    
    const storeBannerUrl = organizer.store_banner_storage_id
      ? await ctx.storage.getUrl(organizer.store_banner_storage_id)
      : undefined;

    return {
      ...organizer,
      profileImageUrl,
      storeLogoUrl,
      storeBannerUrl,
    };
  },
});

// List all organizers (for admin)
export const listOrganizers = query({
  args: {
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("banned")
    )),
    verification_status: v.optional(v.union(
      v.literal("unverified"),
      v.literal("pending"),
      v.literal("verified"),
      v.literal("premium")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, verification_status, limit = 50 }) => {
    if (status) {
      return await ctx.db
        .query("organizer_profiles")
        .withIndex("by_status", (q) => q.eq("status", status))
        .take(limit);
    } else if (verification_status) {
      return await ctx.db
        .query("organizer_profiles")
        .withIndex("by_verification_status", (q) => 
          q.eq("verification_status", verification_status)
        )
        .take(limit);
    } else {
      return await ctx.db
        .query("organizer_profiles")
        .take(limit);
    }
  },
});

// Update organizer status (for admin)
export const updateOrganizerStatus = mutation({
  args: {
    organizer_id: v.id("organizer_profiles"),
    status: v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("banned")
    ),
    verification_status: v.optional(v.union(
      v.literal("unverified"),
      v.literal("pending"),
      v.literal("verified"),
      v.literal("premium")
    )),
  },
  handler: async (ctx, { organizer_id, status, verification_status }) => {
    const updates: any = {
      status,
      updated_at: Date.now(),
    };

    if (verification_status) {
      updates.verification_status = verification_status;
    }

    await ctx.db.patch(organizer_id, updates);
  },
});

// Update organizer statistics
export const updateStats = mutation({
  args: {
    organizer_id: v.id("organizer_profiles"),
    stats: v.object({
      total_events: v.optional(v.number()),
      total_tickets_sold: v.optional(v.number()),
      total_revenue: v.optional(v.number()),
      average_rating: v.optional(v.number()),
      total_reviews: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { organizer_id, stats }) => {
    const organizer = await ctx.db.get(organizer_id);
    if (!organizer) {
      throw new Error("Organizer not found");
    }

    const currentStats = organizer.stats || {};
    const updatedStats = { ...currentStats, ...stats };

    await ctx.db.patch(organizer_id, {
      stats: updatedStats,
      updated_at: Date.now(),
    });
  },
}); 