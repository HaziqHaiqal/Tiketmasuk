import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Create a new product with variants
 */
export const createProduct = mutation({
  args: {
    organizer_id: v.id("organizer_profiles"),
    event_id: v.optional(v.id("events")),
    name: v.string(),
    description: v.string(),
    base_price: v.number(), // in cents
    category: v.string(),
    product_type: v.union(
      v.literal("event-essential"),
      v.literal("merchandise")
    ),
    variants: v.array(v.object({
      id: v.string(),
      name: v.string(),
      options: v.array(v.object({
        id: v.string(),
        label: v.string(),
        price_modifier: v.number(), // Remove optional
        quantity: v.number(),
        available_quantity: v.number(),
        is_available: v.boolean(),
      })),
      is_required: v.boolean(),
    })),
    default_quantity: v.number(),
    max_quantity_per_ticket: v.number(),
    image_storage_id: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // Validate event-essential products must have event_id
    if (args.product_type === "event-essential" && !args.event_id) {
      throw new Error("Event-essential products must be associated with an event");
    }

    return await ctx.db.insert("products", {
      ...args,
      is_active: true,
      created_at: Date.now(),
    });
  },
});

/**
 * Get all products for an organizer
 */
export const getByOrganizer = query({
  args: {
    organizer_id: v.id("organizer_profiles"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_organizer", (q) => q.eq("organizer_id", args.organizer_id))
      .collect();
  },
});

/**
 * Get event-essential products for an event
 */
export const getEventEssentialProducts = query({
  args: {
    event_id: v.id("events"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("product_type"), "event-essential"))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
  },
});

/**
 * Get optional merchandise products (for store)
 */
export const getOptionalMerchandise = query({
  args: {
    organizer_id: v.optional(v.id("organizer_profiles")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("products")
      .withIndex("by_type", (q) => q.eq("product_type", "merchandise"))
      .filter((q) => q.eq(q.field("is_active"), true));

    if (args.organizer_id) {
      query = query.filter((q) => q.eq(q.field("organizer_id"), args.organizer_id));
    }

    return await query.collect();
  },
});

/**
 * Get a single product by ID
 */
export const getById = query({
  args: {
    product_id: v.id("products"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.product_id);
  },
});

/**
 * Update product availability for a specific variant option
 */
export const updateVariantAvailability = mutation({
  args: {
    product_id: v.id("products"),
    variant_id: v.string(),
    option_id: v.string(),
    quantity_change: v.number(), // Positive to add, negative to subtract
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.product_id);
    if (!product) {
      throw new Error("Product not found");
    }

    const updatedVariants = product.variants.map(variant => {
      if (variant.id === args.variant_id) {
        const updatedOptions = variant.options.map(option => {
          if (option.id === args.option_id) {
            const newAvailableQuantity = option.available_quantity + args.quantity_change;
            return {
              ...option,
              available_quantity: Math.max(0, newAvailableQuantity),
              is_available: newAvailableQuantity > 0,
            };
          }
          return option;
        });
        return { ...variant, options: updatedOptions };
      }
      return variant;
    });

    await ctx.db.patch(args.product_id, {
      variants: updatedVariants,
      updated_at: Date.now(),
    });
  },
});

/**
 * Calculate total price for a product with selected variants
 */
export const calculateProductPrice = query({
  args: {
    product_id: v.id("products"),
    selected_variants: v.array(v.object({
      variant_id: v.string(),
      option_id: v.string(),
    })),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.product_id);
    if (!product) {
      throw new Error("Product not found");
    }

    let totalPrice = product.base_price;

    // Add price modifiers from selected variants
    for (const selection of args.selected_variants) {
      const variant = product.variants.find(v => v.id === selection.variant_id);
      if (variant) {
        const option = variant.options.find(o => o.id === selection.option_id);
        if (option?.price_modifier) {
          totalPrice += option.price_modifier;
        }
      }
    }

    return {
      unit_price: totalPrice,
      total_price: totalPrice * args.quantity,
      base_price: product.base_price,
      modifiers: args.selected_variants.map(selection => {
        const variant = product.variants.find(v => v.id === selection.variant_id);
        const option = variant?.options.find(o => o.id === selection.option_id);
        return {
          variant_name: variant?.name,
          option_label: option?.label,
          price_modifier: option?.price_modifier || 0,
        };
      }),
    };
  },
}); 