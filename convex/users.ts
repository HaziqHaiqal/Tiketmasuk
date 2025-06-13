import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const store = mutation({
  args: {
    user_id: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
        phone: args.phone,
        updated_at: Date.now(),
      });
      return existingUser._id;
    } else {
      return await ctx.db.insert("users", {
        user_id: args.user_id,
        name: args.name,
        email: args.email,
        phone: args.phone,
        created_at: Date.now(),
      });
    }
  },
});

export const updatePhone = mutation({
  args: {
    user_id: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      phone: args.phone,
      updated_at: Date.now(),
    });
  },
});

export const get = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .unique();
  },
});

export const updateUser = mutation({
  args: {
    user_id: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      ...args.updates,
      updated_at: Date.now(),
    });
  },
});
