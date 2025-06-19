import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId, getAuthSessionId } from "@convex-dev/auth/server";

// ============================================================================
// CONVEX AUTH HELPERS (Following Official Documentation)
// ============================================================================

// Get current authenticated user ID using Convex Auth
export const getCurrentUserId = query({
  args: {},
  handler: async (ctx) => {
    return await getAuthUserId(ctx);
  },
});

// Get current session ID using Convex Auth
export const getCurrentSessionId = query({
  args: {},
  handler: async (ctx) => {
    return await getAuthSessionId(ctx);
  },
});

// Get current user document from users table
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db.get(userId);
  },
});

// ============================================================================
// USER PROFILE MANAGEMENT (using Convex Auth)
// ============================================================================

// Get current user's profile information
export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    // Get the user document from Convex Auth users table
    const user = await ctx.db.get(userId);
    if (!user) return null;
    
    // Get additional profile information
    const profile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .first();
    
    return {
      user,
      profile,
    };
  },
});

// Create or update user profile
export const upsertUserProfile = mutation({
  args: {
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    display_name: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.object({
      street: v.optional(v.string()),
      city: v.string(),
      state_province: v.string(),
      postal_code: v.optional(v.string()),
      country: v.string(),
    })),
    date_of_birth: v.optional(v.number()),
    gender: v.optional(v.union(
      v.literal("male"), 
      v.literal("female"), 
      v.literal("other"), 
      v.literal("prefer_not_to_say")
    )),
    language: v.optional(v.string()),
    timezone: v.optional(v.string()),
    currency: v.optional(v.string()),
    marketing_opt_in: v.optional(v.boolean()),
    push_notifications: v.optional(v.boolean()),
    email_notifications: v.optional(v.boolean()),
    sms_notifications: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to update profile");
    }

    // Check if profile exists
    const existingProfile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .first();

    const now = Date.now();
    const profileData = {
      ...args,
      user_id: userId,
      updated_at: now,
    };

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, profileData);
      return existingProfile._id;
    } else {
      return await ctx.db.insert("user_profiles", {
        ...profileData,
              roles: ["customer"],
      current_active_role: "customer" as const,
        account_status: "active" as const,
        verification_level: "email_verified" as const,
        login_count: 1,
        created_at: now,
      });
    }
  },
});

    // Switch user role (customer to organizer)
export const switchToOrganizerRole = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to switch role");
    }

    const profile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    const updatedRoles = profile.roles.includes("organizer") 
      ? profile.roles 
      : [...profile.roles, "organizer" as const];

    await ctx.db.patch(profile._id, {
      roles: updatedRoles,
      current_active_role: "organizer",
      is_organizer: true,
      organizer_since: profile.organizer_since || Date.now(),
      updated_at: Date.now(),
    });

    return profile._id;
  },
});

// Get organizer profile for current user
export const getOrganizerProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const userProfile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .first();
    
    if (!userProfile?.is_organizer) return null;
    
    return await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .first();
  },
});

// Track user login
export const trackUserLogin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    
    const profile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .first();
    
    if (profile) {
      await ctx.db.patch(profile._id, {
        last_login_at: Date.now(),
        login_count: (profile.login_count || 0) + 1,
        updated_at: Date.now(),
      });
    }
  },
});

// ============================================================================
// ORGANIZER PROFILE MANAGEMENT
// ============================================================================

export const createOrganizerProfile = mutation({
  args: {
    business_name: v.string(),
    display_name: v.string(),
    business_type: v.union(
      v.literal("individual"),
      v.literal("sole_proprietorship"), 
      v.literal("llc"),
      v.literal("corporation"),
      v.literal("nonprofit"),
      v.literal("partnership"),
      v.literal("government")
    ),
    business_registration_number: v.optional(v.string()),
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    business_address: v.object({
      street: v.optional(v.string()),
      city: v.string(),
      state_province: v.string(),
      postal_code: v.optional(v.string()),
      country: v.string(),
    }),
    business_phone: v.optional(v.string()),
    business_email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if organizer profile already exists
    const existingProfile = await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject as any))
      .first();

    if (existingProfile) {
      throw new Error("Organizer profile already exists");
    }

    return await ctx.db.insert("organizer_profiles", {
      user_id: identity.subject as any,
      business_name: args.business_name,
      display_name: args.display_name,
      business_type: args.business_type,
      business_registration_number: args.business_registration_number,
      bio: args.bio,
      website: args.website,
      business_address: args.business_address,
      business_phone: args.business_phone,
      business_email: args.business_email,
      verification_status: "pending",
      subscription_tier: "free",
      created_at: Date.now(),
    });
  },
});

export const updateOrganizerProfile = mutation({
  args: {
    business_name: v.optional(v.string()),
    display_name: v.optional(v.string()),
    business_type: v.optional(v.union(
      v.literal("individual"),
      v.literal("sole_proprietorship"), 
      v.literal("llc"),
      v.literal("corporation"),
      v.literal("nonprofit"),
      v.literal("partnership"),
      v.literal("government")
    )),
    business_registration_number: v.optional(v.string()),
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    business_phone: v.optional(v.string()),
    business_email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject as any))
      .first();

    if (!profile) {
      throw new Error("Organizer profile not found");
    }

    const updates: any = {
      updated_at: Date.now(),
    };

    if (args.business_name !== undefined) updates.business_name = args.business_name;
    if (args.display_name !== undefined) updates.display_name = args.display_name;
    if (args.business_type !== undefined) updates.business_type = args.business_type;
    if (args.business_registration_number !== undefined) updates.business_registration_number = args.business_registration_number;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.website !== undefined) updates.website = args.website;
    if (args.business_phone !== undefined) updates.business_phone = args.business_phone;
    if (args.business_email !== undefined) updates.business_email = args.business_email;

    await ctx.db.patch(profile._id, updates);
    return await ctx.db.get(profile._id);
  },
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getUserRole = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Check if user has organizer profile
    const organizerProfile = await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject as any))
      .first();

    if (organizerProfile) {
      return { role: "organizer", verification_status: organizerProfile.verification_status };
    }

    return { role: "user" }; // Basic authenticated user
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db.get(userId);
  },
});

export const getUserProfile = query({
  args: { user_id: v.id("users") },
  handler: async (ctx, args) => {
    // Get the basic user record
    const user = await ctx.db.get(args.user_id);
    if (!user) return null;

    // Get the user profile with additional information
    const profile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .first();

    return {
      user,
      profile,
      email: user.email,
      phone: profile?.phone,
    };
  },
});

