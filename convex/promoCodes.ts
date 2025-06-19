import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// PROMO CODE MANAGEMENT
// ============================================================================

export const create = mutation({
  args: {
    code: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    organizer_id: v.id("organizer_profiles"),
    event_id: v.optional(v.id("events")),
    ticket_category_ids: v.optional(v.array(v.id("ticket_categories"))),
    discount_type: v.union(v.literal("percentage"), v.literal("fixed_amount"), v.literal("free")),
    discount_value: v.number(),
    max_discount_amount: v.optional(v.number()),
    max_uses: v.optional(v.number()),
    max_uses_per_user: v.optional(v.number()),
    valid_from: v.number(),
    valid_until: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if code already exists
    const existingCode = await ctx.db
      .query("promo_codes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (existingCode) {
      throw new Error("Promo code already exists");
    }

    return await ctx.db.insert("promo_codes", {
      ...args,
      current_uses: 0,
      is_active: true,
      created_at: Date.now(),
    });
  },
});

export const getById = query({
  args: { promo_code_id: v.id("promo_codes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.promo_code_id);
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("promo_codes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
  },
});

export const getByOrganizer = query({
  args: { organizer_id: v.id("organizer_profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("promo_codes")
      .withIndex("by_organizer", (q) => q.eq("organizer_id", args.organizer_id))
      .collect();
  },
});

export const getByEvent = query({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("promo_codes")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .collect();
  },
});

export const validatePromoCode = query({
  args: {
    code: v.string(),
    event_id: v.optional(v.id("events")),
    ticket_category_ids: v.optional(v.array(v.id("ticket_categories"))),
    purchase_amount: v.number(),
  },
  handler: async (ctx, args) => {
    const promoCode = await ctx.db
      .query("promo_codes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!promoCode) {
      return { valid: false, error: "Promo code not found" };
    }

    if (!promoCode.is_active) {
      return { valid: false, error: "Promo code is inactive" };
    }

    const now = Date.now();
    if (now < promoCode.valid_from) {
      return { valid: false, error: "Promo code is not yet valid" };
    }

    if (now > promoCode.valid_until) {
      return { valid: false, error: "Promo code has expired" };
    }

    // Check usage limits
    if (promoCode.max_uses && (promoCode.current_uses || 0) >= promoCode.max_uses) {
      return { valid: false, error: "Promo code usage limit reached" };
    }

    // Check event applicability
    if (promoCode.event_id && args.event_id && promoCode.event_id !== args.event_id) {
      return { valid: false, error: "Promo code not valid for this event" };
    }

    // Check ticket category applicability
    if (promoCode.ticket_category_ids && args.ticket_category_ids) {
      const hasValidCategory = args.ticket_category_ids.some(categoryId =>
        promoCode.ticket_category_ids!.includes(categoryId)
      );
      if (!hasValidCategory) {
        return { valid: false, error: "Promo code not valid for selected ticket categories" };
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoCode.discount_type === "percentage") {
      discountAmount = Math.floor((args.purchase_amount * promoCode.discount_value) / 100);
      if (promoCode.max_discount_amount) {
        discountAmount = Math.min(discountAmount, promoCode.max_discount_amount);
      }
    } else if (promoCode.discount_type === "fixed_amount") {
      discountAmount = Math.min(promoCode.discount_value, args.purchase_amount);
    } else if (promoCode.discount_type === "free") {
      discountAmount = args.purchase_amount;
    }

    return {
      valid: true,
      discount_amount: discountAmount,
      discount_type: promoCode.discount_type,
      discount_value: promoCode.discount_value,
      promo_code_id: promoCode._id,
    };
  },
});

export const usePromoCode = mutation({
  args: {
    promo_code_id: v.id("promo_codes"),
    user_id: v.id("users"),
    purchase_amount: v.number(),
  },
  handler: async (ctx, args) => {
    const promoCode = await ctx.db.get(args.promo_code_id);
    if (!promoCode) {
      throw new Error("Promo code not found");
    }

    // Increment usage count
    await ctx.db.patch(args.promo_code_id, {
      current_uses: (promoCode.current_uses || 0) + 1,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

export const update = mutation({
  args: {
    promo_code_id: v.id("promo_codes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    discount_value: v.optional(v.number()),
    max_discount_amount: v.optional(v.number()),
    max_uses: v.optional(v.number()),
    max_uses_per_user: v.optional(v.number()),
    valid_from: v.optional(v.number()),
    valid_until: v.optional(v.number()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { promo_code_id, ...updates } = args;

    await ctx.db.patch(promo_code_id, {
      ...updates,
      updated_at: Date.now(),
    });

    return await ctx.db.get(promo_code_id);
  },
});

export const activate = mutation({
  args: { promo_code_id: v.id("promo_codes") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.promo_code_id, {
      is_active: true,
      updated_at: Date.now(),
    });

    return await ctx.db.get(args.promo_code_id);
  },
});

export const deactivate = mutation({
  args: { promo_code_id: v.id("promo_codes") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.promo_code_id, {
      is_active: false,
      updated_at: Date.now(),
    });

    return await ctx.db.get(args.promo_code_id);
  },
});

export const remove = mutation({
  args: { promo_code_id: v.id("promo_codes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.promo_code_id);
    return { success: true };
  },
});

export const getActivePromoCodes = query({
  args: {
    organizer_id: v.optional(v.id("organizer_profiles")),
    event_id: v.optional(v.id("events")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let promoCodes;

    if (args.organizer_id) {
      promoCodes = await ctx.db
        .query("promo_codes")
        .withIndex("by_organizer", (q) => q.eq("organizer_id", args.organizer_id!))
        .collect();
    } else if (args.event_id) {
      promoCodes = await ctx.db
        .query("promo_codes")
        .withIndex("by_event", (q) => q.eq("event_id", args.event_id!))
        .collect();
    } else {
      promoCodes = await ctx.db.query("promo_codes").collect();
    }

    return promoCodes.filter(code => 
      code.is_active && 
      code.valid_from <= now && 
      code.valid_until >= now &&
      (!code.max_uses || (code.current_uses || 0) < code.max_uses)
    );
  },
}); 