import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    user_id: v.string(),
    business_name: v.string(),
    contact_name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("vendors", {
      user_id: args.user_id,
      business_name: args.business_name,
      contact_name: args.contact_name,
      email: args.email,
      phone: args.phone,
      status: "pending",
      created_at: Date.now(),
    });
  },
});

export const getByUserId = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vendors")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .first();
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("vendors")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

export const updateStatus = mutation({
  args: {
    vendor_id: v.id("vendors"),
    status: v.union(
      v.literal("active"),
      v.literal("pending"),
      v.literal("suspended"),
      v.literal("inactive")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.vendor_id, {
      status: args.status,
      updated_at: Date.now(),
    });
  },
});

export const getByEvent = query({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) return null;
    
    return await ctx.db.get(event.vendor_id);
  },
}); 