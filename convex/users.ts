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
// USER ROLE MANAGEMENT
// ============================================================================

// Get user roles
export const getUserRoles = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const userId = args.userId || await getAuthUserId(ctx);
    if (!userId) return [];
    
    const roles = await ctx.db
      .query("user_roles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();
    
    return roles; // Return the full role objects, not just the role strings
  },
});

// Check if user has specific role
export const hasRole = query({
  args: { 
    role: v.union(v.literal("customer"), v.literal("organizer"), v.literal("admin")),
    userId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    const userId = args.userId || await getAuthUserId(ctx);
    if (!userId) return false;
    
    const roleEntry = await ctx.db
      .query("user_roles")
      .withIndex("by_user_and_role", (q) => q.eq("userId", userId).eq("role", args.role))
      .first();
    
    return !!roleEntry;
  },
});

// ============================================================================
// USER PROFILE MANAGEMENT
// ============================================================================

// Get current user's complete profile information
export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    // Get the user document from Convex Auth users table
    const user = await ctx.db.get(userId);
    if (!user) return null;
    
    // Get user roles
    const roles = await ctx.db
      .query("user_roles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();
    
    // Get customer profile if exists
    const customerProfile = await ctx.db
      .query("customer_profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    // Get organizer profile if exists
    const organizerProfile = await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    return {
      user,
      roles: roles.map(r => r.role),
      customerProfile,
      organizerProfile,
    };
  },
});

// Get customer profile for current user
export const getCustomerProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db
      .query("customer_profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
  },
});

// Get organizer profile for current user
export const getOrganizerProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
  },
});

// Update customer profile
export const updateCustomerProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    gender: v.optional(v.union(
      v.literal("male"), 
      v.literal("female"), 
      v.literal("other"), 
      v.literal("prefer_not_to_say")
    )),
    language: v.optional(v.string()),
    timezone: v.optional(v.string()),
    currency: v.optional(v.string()),
    notifications: v.optional(v.object({
      email: v.boolean(),
      push: v.boolean(),
      sms: v.boolean(),
      marketing: v.boolean(),
    })),
    privacy: v.optional(v.object({
      profileVisibility: v.union(v.literal("public"), v.literal("private")),
      showEmail: v.boolean(),
      showPhone: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to update profile");
    }

    // Check if customer profile exists
    const existingProfile = await ctx.db
      .query("customer_profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!existingProfile) {
      throw new Error("Customer profile not found");
    }

    await ctx.db.patch(existingProfile._id, {
      ...args,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(existingProfile._id);
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

    // Check if user already has organizer role
    const existingOrganizerRole = await ctx.db
      .query("user_roles")
      .withIndex("by_user_and_role", (q) => q.eq("userId", userId).eq("role", "organizer"))
      .first();

    if (existingOrganizerRole) {
      throw new Error("User is already an organizer");
    }

    // Create organizer role
    await ctx.db.insert("user_roles", {
      userId: userId,
      role: "organizer",
      createdAt: Date.now(),
});

    // Create organizer profile (user will need to complete it)
    const organizerProfileId = await ctx.db.insert("organizer_profiles", {
      userId: userId,
      fullName: "",
      displayName: "",
      storeName: "",
      organizerType: "individual",
      phone: "",
      primaryLocation: "",
      language: "en",
      timezone: "Asia/Kuala_Lumpur",
      currency: "MYR",
      notifications: {
        email: true,
        push: true,
        sms: false,
        marketing: false,
      },
      privacy: {
        profileVisibility: "public",
        showEmail: false,
        showPhone: false,
      },
      isVerified: false,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return organizerProfileId;
  },
});

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

// Get all users with their profiles (admin only)
export const getAllUsersWithProfiles = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    // Check if user is admin
    const isAdmin = await ctx.db
      .query("user_roles")
      .withIndex("by_user_and_role", (q) => q.eq("userId", userId).eq("role", "admin"))
      .first();
    
    if (!isAdmin) {
      throw new Error("Admin access required");
    }
    
    // Get all users from Convex Auth users table
    const users = await ctx.db.query("users").collect();
    
    // Get profiles for each user
    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        const roles = await ctx.db
          .query("user_roles")
          .withIndex("by_user_id", (q) => q.eq("userId", user._id))
          .collect();
        
        const customerProfile = await ctx.db
          .query("customer_profiles")
          .withIndex("by_user_id", (q) => q.eq("userId", user._id))
          .first();
        
        const organizerProfile = await ctx.db
      .query("organizer_profiles")
          .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .first();

        return {
          user,
          roles: roles.map(r => r.role),
          customerProfile,
          organizerProfile,
        };
      })
    );
    
    return usersWithProfiles;
  },
});

// Update user status (admin only)
export const updateUserStatus = mutation({
  args: {
    targetUserId: v.id("users"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    // Check if user is admin
    const isAdmin = await ctx.db
      .query("user_roles")
      .withIndex("by_user_and_role", (q) => q.eq("userId", userId).eq("role", "admin"))
      .first();

    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    // Update customer profile if exists
    const customerProfile = await ctx.db
      .query("customer_profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.targetUserId))
      .first();
    
    if (customerProfile) {
      await ctx.db.patch(customerProfile._id, {
        isActive: args.isActive,
        updatedAt: Date.now(),
      });
    }

    // Update organizer profile if exists
    const organizerProfile = await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.targetUserId))
      .first();

    if (organizerProfile) {
      await ctx.db.patch(organizerProfile._id, {
        isActive: args.isActive,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Grant admin role (super admin only - manual operation)
export const grantAdminRole = mutation({
  args: {
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }
    
    // For security, this should be manually called by existing admin
    // Check if user already has admin role
    const existingAdminRole = await ctx.db
      .query("user_roles")
      .withIndex("by_user_and_role", (q) => q.eq("userId", args.targetUserId).eq("role", "admin"))
      .first();

    if (existingAdminRole) {
      throw new Error("User is already an admin");
    }
    
    // Create admin role
    await ctx.db.insert("user_roles", {
      userId: args.targetUserId,
      role: "admin",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

