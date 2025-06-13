import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    vendor_id: v.id("vendors"),
    event_id: v.optional(v.id("events")),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    quantity: v.number(),
    category: v.string(),
    type: v.union(
      v.literal("physical"),
      v.literal("digital"),
      v.literal("ticket"),
      v.literal("service")
    ),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", {
      vendor_id: args.vendor_id,
      event_id: args.event_id,
      name: args.name,
      description: args.description,
      price: args.price,
      quantity: args.quantity,
      available_quantity: args.quantity,
      category: args.category,
      type: args.type,
      is_active: args.is_active ?? true,
      created_at: Date.now(),
    });
  },
});

export const getByVendor = query({
  args: { vendor_id: v.id("vendors") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_vendor", (q) => q.eq("vendor_id", args.vendor_id))
      .collect();
  },
});

export const getByEvent = query({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
  },
});

export const updateAvailability = mutation({
  args: {
    product_id: v.id("products"),
    quantity_sold: v.number(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.product_id);
    if (!product) throw new Error("Product not found");

    const newAvailable = product.available_quantity - args.quantity_sold;

    await ctx.db.patch(args.product_id, {
      available_quantity: Math.max(0, newAvailable),
      updated_at: Date.now(),
    });
  },
}); 