import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// PRODUCT MANAGEMENT
// ============================================================================

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    organizer_id: v.id("organizer_profiles"),
    category: v.union(
      v.literal("merchandise"),
      v.literal("add_on"),
      v.literal("upgrade"), 
      v.literal("service"),
      v.literal("digital"),
      v.literal("food_beverage")
    ),
    base_price: v.number(),
    currency: v.string(),
    pricing_type: v.union(v.literal("fixed"), v.literal("variable"), v.literal("donation")),
    has_variants: v.boolean(),
    track_inventory: v.boolean(),
          supported_fulfillment_types: v.array(v.union(
        v.literal("pickup"),
        v.literal("shipping")
      )),
    requires_shipping_address: v.optional(v.boolean()),
    product_scope: v.union(
      v.literal("store_only"),
      v.literal("event_bundled"),
      v.literal("both")
    ),
    stock_quantity: v.optional(v.number()),
    featured_image_storage_id: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", {
      ...args,
      is_active: true,
      created_at: Date.now(),
    });
  },
});

export const getById = query({
  args: { product_id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.product_id);
  },
});

export const getByOrganizer = query({
  args: { organizer_id: v.id("organizer_profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_organizer", (q) => q.eq("organizer_id", args.organizer_id))
      .collect();
  },
});

export const getByCategory = query({
  args: {
    category: v.union(
      v.literal("merchandise"),
      v.literal("add_on"),
      v.literal("upgrade"),
      v.literal("service"),
      v.literal("digital"),
      v.literal("food_beverage")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
  },
});

export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .withIndex("by_featured", (q) => q.eq("is_featured", true))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
  },
});

export const update = mutation({
  args: {
    product_id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    base_price: v.optional(v.number()),
    category: v.optional(v.union(
      v.literal("merchandise"),
      v.literal("add_on"),
      v.literal("upgrade"),
      v.literal("service"),
      v.literal("digital"),
      v.literal("food_beverage")
    )),
    stock_quantity: v.optional(v.number()),
    is_active: v.optional(v.boolean()),
    is_featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { product_id, ...updates } = args;

    await ctx.db.patch(product_id, {
      ...updates,
      updated_at: Date.now(),
    });

    return await ctx.db.get(product_id);
  },
});

export const updateStock = mutation({
  args: {
    product_id: v.id("products"),
    quantity_change: v.number(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.product_id);
    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.track_inventory) {
      return product; // No inventory tracking needed
    }

    const currentStock = product.stock_quantity || 0;
    const newStock = currentStock + args.quantity_change;

    await ctx.db.patch(args.product_id, {
      stock_quantity: Math.max(0, newStock),
      updated_at: Date.now(),
    });

    return await ctx.db.get(args.product_id);
  },
});

export const activate = mutation({
  args: { product_id: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.product_id, {
      is_active: true,
      updated_at: Date.now(),
    });

    return await ctx.db.get(args.product_id);
  },
});

export const deactivate = mutation({
  args: { product_id: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.product_id, {
      is_active: false,
      updated_at: Date.now(),
    });

    return await ctx.db.get(args.product_id);
  },
});

export const getAll = query({
  args: {
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.is_active !== undefined) {
      return await ctx.db
        .query("products")
        .withIndex("by_status", (q) => q.eq("is_active", args.is_active!))
        .collect();
    }
    
    return await ctx.db.query("products").collect();
  },
});

// ============================================================================
// MIGRATION & SEEDING MUTATIONS
// ============================================================================

export const seedProducts = mutation({
  args: {
    products: v.array(v.object({
      name: v.string(),
      description: v.string(),
      short_description: v.optional(v.string()),
      organizer_id: v.id("organizer_profiles"),
      category: v.union(
        v.literal("merchandise"), v.literal("add_on"), v.literal("upgrade"),
        v.literal("service"), v.literal("digital"), v.literal("food_beverage")
      ),
      subcategory: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      base_price: v.number(),
      currency: v.string(),
      pricing_type: v.union(v.literal("fixed"), v.literal("variable"), v.literal("donation")),
      has_variants: v.boolean(),
      variants: v.optional(v.array(v.object({
        variant_id: v.string(),
        name: v.string(),
        options: v.array(v.object({
          option_id: v.string(),
          label: v.string(),
          price_modifier: v.number(),
          sku: v.optional(v.string()),
          stock_quantity: v.optional(v.number()),
        })),
        required: v.boolean(),
      }))),
      track_inventory: v.boolean(),
      stock_quantity: v.optional(v.number()),
      low_stock_threshold: v.optional(v.number()),
      allow_backorders: v.optional(v.boolean()),
      is_active: v.boolean(),
      is_featured: v.optional(v.boolean()),
      product_scope: v.union(
        v.literal("store_only"), v.literal("event_bundled"), v.literal("both")
      ),
      available_events: v.optional(v.array(v.id("events"))),
          supported_fulfillment_types: v.array(v.union(
      v.literal("pickup"), v.literal("shipping")
    )),
      requires_shipping_address: v.optional(v.boolean()),
      shipping_options: v.optional(v.array(v.object({
        method: v.union(
          v.literal("standard"),
          v.literal("express"),
          v.literal("overnight")
        ),
        name: v.string(),
        price: v.number(),
        estimated_days: v.object({
          min: v.number(),
          max: v.number(),
        }),
        is_default: v.optional(v.boolean()),
      }))),
      pickup_locations: v.optional(v.array(v.object({
        location_id: v.string(),
        name: v.string(),
        address: v.object({
          address_line_1: v.string(),
          address_line_2: v.optional(v.string()),
          city: v.string(),
          state_province: v.string(),
          postal_code: v.string(),
          country: v.string(),
        }),
        pickup_hours: v.optional(v.object({
          monday: v.optional(v.string()),
          tuesday: v.optional(v.string()),
          wednesday: v.optional(v.string()),
          thursday: v.optional(v.string()),
          friday: v.optional(v.string()),
          saturday: v.optional(v.string()),
          sunday: v.optional(v.string()),
        })),
        instructions: v.optional(v.string()),
        is_default: v.optional(v.boolean()),
      }))),
      weight: v.optional(v.number()),
      dimensions: v.optional(v.object({
        length: v.number(),
        width: v.number(),
        height: v.number(),
        unit: v.string(),
      })),
      created_at: v.number(),
      updated_at: v.optional(v.number()),
    }))
  },
  handler: async (ctx, args) => {
    const productIds: Id<"products">[] = [];
    
    for (const product of args.products) {
      const productId = await ctx.db.insert("products", product);
      productIds.push(productId);
    }
    
    console.log(`✅ Successfully seeded ${productIds.length} products`);
    return productIds;
  },
});

export const getByScope = query({
  args: {
    scope: v.union(v.literal("store_only"), v.literal("event_bundled"), v.literal("both")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_scope", (q) => q.eq("product_scope", args.scope))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
  },
});

export const getBundledProducts = query({
  args: {
    event_id: v.optional(v.id("events")),
  },
  handler: async (ctx, args) => {
    // Get products that can be bundled with events
    const products = await ctx.db
      .query("products")
      .withIndex("by_scope", (q) => q.eq("product_scope", "event_bundled"))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    const bothScopeProducts = await ctx.db
      .query("products")
      .withIndex("by_scope", (q) => q.eq("product_scope", "both"))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    return [...products, ...bothScopeProducts];
  },
});

export const getStoreProducts = query({
  args: {
    organizer_id: v.id("organizer_profiles"),
  },
  handler: async (ctx, args) => {
    // Get products available in organizer's store
    const storeOnlyProducts = await ctx.db
      .query("products")
      .withIndex("by_organizer", (q) => q.eq("organizer_id", args.organizer_id))
      .filter((q) => 
        q.and(
          q.eq(q.field("is_active"), true),
          q.eq(q.field("product_scope"), "store_only")
        )
      )
      .collect();

    const bothScopeProducts = await ctx.db
      .query("products")
      .withIndex("by_organizer", (q) => q.eq("organizer_id", args.organizer_id))
      .filter((q) => 
        q.and(
          q.eq(q.field("is_active"), true),
          q.eq(q.field("product_scope"), "both")
        )
      )
      .collect();

    return [...storeOnlyProducts, ...bothScopeProducts];
  },
});

export const clearAllProducts = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🚨 CLEARING ALL PRODUCTS");
    
    const products = await ctx.db.query("products").collect();
    for (const product of products) {
      await ctx.db.delete(product._id);
    }
    
    console.log(`🗑️ Deleted ${products.length} products`);
    return { deletedProducts: products.length };
  },
});

export const getProductStats = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    
    const stats = {
      totalProducts: products.length,
      productsByCategory: {} as Record<string, number>,
      productsByScope: {} as Record<string, number>,
      productsWithVariants: products.filter(p => p.has_variants).length,
      featuredProducts: products.filter(p => p.is_featured).length,
    };
    
    // Count by category
    products.forEach(product => {
      stats.productsByCategory[product.category] = (stats.productsByCategory[product.category] || 0) + 1;
    });
    
    // Count by scope
    products.forEach(product => {
      stats.productsByScope[product.product_scope] = (stats.productsByScope[product.product_scope] || 0) + 1;
    });
    
    return stats;
  },
});

// ============================================================================
// SHIPPING & FULFILLMENT
// ============================================================================

// Update shipping configuration for a product
export const updateProductShipping = mutation({
  args: {
    product_id: v.id("products"),
    shipping_zones: v.optional(v.array(v.object({
      zone_name: v.string(),
      shipping_cost: v.number(),
      estimated_days: v.object({
        min: v.number(),
        max: v.number(),
      }),
    }))),
    pickup_locations: v.optional(v.array(v.object({
      location_id: v.string(),
      name: v.string(),
      address: v.object({
        address_line_1: v.string(),
        address_line_2: v.optional(v.string()),
        city: v.string(),
        state_province: v.string(),
        postal_code: v.string(),
        country: v.string(),
      }),
      pickup_hours: v.optional(v.object({
        monday: v.optional(v.string()),
        tuesday: v.optional(v.string()),
        wednesday: v.optional(v.string()),
        thursday: v.optional(v.string()),
        friday: v.optional(v.string()),
        saturday: v.optional(v.string()),
        sunday: v.optional(v.string()),
      })),
      instructions: v.optional(v.string()),
      is_default: v.optional(v.boolean()),
    }))),
  },
  handler: async (ctx, args) => {
    const { product_id, ...updates } = args;
    
    await ctx.db.patch(product_id, {
      ...updates,
      updated_at: Date.now(),
    });
    
    return await ctx.db.get(product_id);
  },
});

// Get shipping options for products in cart
export const getShippingOptionsForProducts = query({
  args: { 
    product_ids: v.array(v.id("products")),
    delivery_country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const products = await Promise.all(
      args.product_ids.map(id => ctx.db.get(id))
    );

    // Combine all unique shipping options from all products
    const allShippingOptions = new Map();
    const allPickupLocations = new Map();

    for (const product of products) {
      if (!product) continue;

      // Add shipping options
      if (product.shipping_zones) {
        for (const zone of product.shipping_zones) {
          const key = `shipping-${zone.zone_name}`;
          if (!allShippingOptions.has(key)) {
            allShippingOptions.set(key, {
              id: `shipping-${zone.zone_name}`,
              type: "shipping" as const,
              zone_name: zone.zone_name,
              name: `Shipping to ${zone.zone_name}`,
              price: zone.shipping_cost,
              estimatedDays: zone.estimated_days,
            });
          }
        }
      }

      // Add pickup locations
      if (product.pickup_locations) {
        for (const location of product.pickup_locations) {
          if (!allPickupLocations.has(location.location_id)) {
            allPickupLocations.set(location.location_id, {
              id: `pickup-${location.location_id}`,
              type: "pickup" as const,
              name: location.name,
              price: 0,
              pickupLocation: {
                name: location.name,
                address: `${location.address.address_line_1}, ${location.address.city}, ${location.address.state_province} ${location.address.postal_code}`,
                hours: location.pickup_hours ? Object.entries(location.pickup_hours)
                  .filter(([_, hours]) => hours)
                  .map(([day, hours]) => `${day}: ${hours}`)
                  .join(", ") : undefined,
                instructions: location.instructions,
              }
            });
          }
        }
      }
    }

    return [
      ...Array.from(allPickupLocations.values()),
      ...Array.from(allShippingOptions.values()),
    ];
  },
}); 