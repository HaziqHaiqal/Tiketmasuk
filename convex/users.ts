import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================================================
// USER PROFILE MANAGEMENT (using Convex Auth)
// ============================================================================

// Get current user's profile information
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    // Return the user identity from Convex Auth
    return {
      id: identity.subject,
      email: identity.email,
      name: identity.name,
      image: identity.pictureUrl,
    };
  },
});

// ============================================================================
// ORGANIZER PROFILE MANAGEMENT
// ============================================================================

export const createOrganizerProfile = mutation({
  args: {
    contact_name: v.string(),
    business_name: v.string(),
    business_registration: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if organizer profile already exists
    const existingProfile = await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    if (existingProfile) {
      throw new Error("Organizer profile already exists");
    }

    return await ctx.db.insert("organizer_profiles", {
      user_id: identity.subject,
      contact_name: args.contact_name,
      business_name: args.business_name,
      business_registration: args.business_registration,
      phone: args.phone,
      website: args.website,
      description: args.description,
      status: "pending", // New organizers start as pending for admin approval
      created_at: Date.now(),
    });
  },
});

export const getOrganizerProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();
  },
});

export const updateOrganizerProfile = mutation({
  args: {
    contact_name: v.optional(v.string()),
    business_name: v.optional(v.string()),
    business_registration: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    if (!profile) {
      throw new Error("Organizer profile not found");
    }

    const updates: any = {
      updated_at: Date.now(),
    };

    if (args.contact_name !== undefined) updates.contact_name = args.contact_name;
    if (args.business_name !== undefined) updates.business_name = args.business_name;
    if (args.business_registration !== undefined) updates.business_registration = args.business_registration;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.website !== undefined) updates.website = args.website;
    if (args.description !== undefined) updates.description = args.description;

    await ctx.db.patch(profile._id, updates);
    return await ctx.db.get(profile._id);
  },
});

// ============================================================================
// CUSTOMER PROFILE MANAGEMENT
// ============================================================================

export const createCustomerProfile = mutation({
  args: {
    full_name: v.string(),
    phone: v.optional(v.string()),
    date_of_birth: v.optional(v.string()),
    gender: v.optional(v.string()),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    address: v.optional(v.string()),
    postcode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if customer profile already exists
    const existingProfile = await ctx.db
      .query("customer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    if (existingProfile) {
      throw new Error("Customer profile already exists");
    }

    return await ctx.db.insert("customer_profiles", {
      user_id: identity.subject,
      full_name: args.full_name,
      phone: args.phone,
      date_of_birth: args.date_of_birth,
      gender: args.gender,
      country: args.country,
      state: args.state,
      address: args.address,
      postcode: args.postcode,
      created_at: Date.now(),
    });
  },
});

export const getCustomerProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("customer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();
  },
});

export const updateCustomerProfile = mutation({
  args: {
    full_name: v.optional(v.string()),
    phone: v.optional(v.string()),
    date_of_birth: v.optional(v.string()),
    gender: v.optional(v.string()),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    address: v.optional(v.string()),
    postcode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("customer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    if (!profile) {
      throw new Error("Customer profile not found");
    }

    const updates: any = {
      updated_at: Date.now(),
    };

    if (args.full_name !== undefined) updates.full_name = args.full_name;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.date_of_birth !== undefined) updates.date_of_birth = args.date_of_birth;
    if (args.gender !== undefined) updates.gender = args.gender;
    if (args.country !== undefined) updates.country = args.country;
    if (args.state !== undefined) updates.state = args.state;
    if (args.address !== undefined) updates.address = args.address;
    if (args.postcode !== undefined) updates.postcode = args.postcode;

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
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    if (organizerProfile) {
      return { role: "organizer", status: organizerProfile.status };
    }

    // Check if user has customer profile
    const customerProfile = await ctx.db
      .query("customer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    if (customerProfile) {
      return { role: "customer" };
    }

    return { role: "user" }; // Basic authenticated user
  },
});

