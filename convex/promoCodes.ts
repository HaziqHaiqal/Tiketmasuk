import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================================================
// PROMO CODE MANAGEMENT
// ============================================================================

export const createPromoCode = mutation({
  args: {
    organizer_id: v.id("organizer_profiles"),
    event_id: v.optional(v.id("events")),
    product_id: v.optional(v.id("products")),
    code: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    discount_type: v.union(
      v.literal("percentage"),
      v.literal("fixed_amount"),
      v.literal("free_shipping")
    ),
    discount_value: v.number(),
    minimum_purchase: v.optional(v.number()),
    usage_limit: v.optional(v.number()),
    usage_limit_per_user: v.optional(v.number()),
    valid_from: v.number(),
    valid_until: v.number(),
    applicable_categories: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Check if code already exists
    const existingCode = await ctx.db
      .query("promo_codes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (existingCode) {
      throw new Error("Promo code already exists");
    }

    return await ctx.db.insert("promo_codes", {
      ...args,
      code: args.code.toUpperCase(), // Always store codes in uppercase
      usage_count: 0,
      is_active: true,
      created_at: Date.now(),
    });
  },
});

export const validatePromoCode = query({
  args: {
    code: v.string(),
    user_id: v.string(),
    event_id: v.optional(v.id("events")),
    product_id: v.optional(v.id("products")),
    purchase_amount: v.number(), // in cents
    category_ids: v.optional(v.array(v.string())), // For event tickets
  },
  handler: async (ctx, args) => {
    const promoCode = await ctx.db
      .query("promo_codes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!promoCode) {
      return { valid: false, error: "Promo code not found" };
    }

    // Check if active
    if (!promoCode.is_active) {
      return { valid: false, error: "Promo code is inactive" };
    }

    // Check date validity
    const now = Date.now();
    if (now < promoCode.valid_from) {
      return { valid: false, error: "Promo code is not yet valid" };
    }
    if (now > promoCode.valid_until) {
      return { valid: false, error: "Promo code has expired" };
    }

    // Check minimum purchase
    if (promoCode.minimum_purchase && args.purchase_amount < promoCode.minimum_purchase) {
      return { 
        valid: false, 
        error: `Minimum purchase of RM${(promoCode.minimum_purchase / 100).toFixed(2)} required` 
      };
    }

    // Check usage limits
    if (promoCode.usage_limit && promoCode.usage_count >= promoCode.usage_limit) {
      return { valid: false, error: "Promo code usage limit reached" };
    }

    // Check per-user usage limit
    if (promoCode.usage_limit_per_user) {
      const userUsageCount = await ctx.db
        .query("promo_code_usage")
        .withIndex("by_promo_code", (q) => q.eq("promo_code_id", promoCode._id))
        .filter((q) => q.eq(q.field("user_id"), args.user_id))
        .collect();

      if (userUsageCount.length >= promoCode.usage_limit_per_user) {
        return { valid: false, error: "You have reached the usage limit for this promo code" };
      }
    }

    // Check event/product applicability
    if (promoCode.event_id && args.event_id && promoCode.event_id !== args.event_id) {
      return { valid: false, error: "Promo code not applicable to this event" };
    }

    if (promoCode.product_id && args.product_id && promoCode.product_id !== args.product_id) {
      return { valid: false, error: "Promo code not applicable to this product" };
    }

    // Check category applicability for event tickets
    if (promoCode.applicable_categories && args.category_ids) {
      const hasApplicableCategory = args.category_ids.some(categoryId => 
        promoCode.applicable_categories!.includes(categoryId)
      );
      if (!hasApplicableCategory) {
        return { valid: false, error: "Promo code not applicable to selected ticket categories" };
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoCode.discount_type === "percentage") {
      discountAmount = Math.round((args.purchase_amount * promoCode.discount_value) / 100);
    } else if (promoCode.discount_type === "fixed_amount") {
      discountAmount = Math.min(promoCode.discount_value, args.purchase_amount);
    }

    return {
      valid: true,
      promo_code: promoCode,
      discount_amount: discountAmount,
      final_amount: args.purchase_amount - discountAmount,
    };
  },
});

export const applyPromoCode = mutation({
  args: {
    promo_code_id: v.id("promo_codes"),
    user_id: v.string(),
    booking_id: v.optional(v.id("bookings")),
    discount_amount: v.number(),
  },
  handler: async (ctx, args) => {
    // Record usage
    await ctx.db.insert("promo_code_usage", {
      promo_code_id: args.promo_code_id,
      user_id: args.user_id,
      booking_id: args.booking_id,
      discount_amount: args.discount_amount,
      used_at: Date.now(),
    });

    // Increment usage count
    const promoCode = await ctx.db.get(args.promo_code_id);
    if (promoCode) {
      await ctx.db.patch(args.promo_code_id, {
        usage_count: promoCode.usage_count + 1,
        updated_at: Date.now(),
      });
    }
  },
});

export const getOrganizerPromoCodes = query({
  args: { organizer_id: v.id("organizer_profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("promo_codes")
      .withIndex("by_organizer", (q) => q.eq("organizer_id", args.organizer_id))
      .order("desc")
      .collect();
  },
});

export const getEventPromoCodes = query({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("promo_codes")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
  },
});

export const updatePromoCode = mutation({
  args: {
    promo_code_id: v.id("promo_codes"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      discount_value: v.optional(v.number()),
      minimum_purchase: v.optional(v.number()),
      usage_limit: v.optional(v.number()),
      usage_limit_per_user: v.optional(v.number()),
      valid_from: v.optional(v.number()),
      valid_until: v.optional(v.number()),
      is_active: v.optional(v.boolean()),
      applicable_categories: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.promo_code_id, {
      ...args.updates,
      updated_at: Date.now(),
    });
  },
});

export const deletePromoCode = mutation({
  args: { promo_code_id: v.id("promo_codes") },
  handler: async (ctx, args) => {
    // Check if promo code has been used
    const usage = await ctx.db
      .query("promo_code_usage")
      .withIndex("by_promo_code", (q) => q.eq("promo_code_id", args.promo_code_id))
      .first();

    if (usage) {
      // Don't delete if used, just deactivate
      await ctx.db.patch(args.promo_code_id, {
        is_active: false,
        updated_at: Date.now(),
      });
    } else {
      // Safe to delete if never used
      await ctx.db.delete(args.promo_code_id);
    }
  },
});

export const getPromoCodeUsage = query({
  args: { promo_code_id: v.id("promo_codes") },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("promo_code_usage")
      .withIndex("by_promo_code", (q) => q.eq("promo_code_id", args.promo_code_id))
      .collect();

    // Return usage data without user details for now
    return usage;
  },
}); 