import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const updateUser = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, { userId, name, email, phone }) => {
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (existingUser) {
      // Update existing user
      const updateData: any = { name, email };
      if (phone !== undefined) {
        updateData.phone = phone;
      }
      
      await ctx.db.patch(existingUser._id, updateData);
      return existingUser._id;
    }

    // Create new user
    const newUserData: any = { userId, name, email };
    if (phone !== undefined) {
      newUserData.phone = phone;
    }

    const newUserId = await ctx.db.insert("users", newUserData);
    return newUserId;
  },
});

export const updateUserPhone = mutation({
  args: {
    userId: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, { userId, phone }) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!existingUser) {
      throw new Error("User not found");
    }

    await ctx.db.patch(existingUser._id, {
      phone,
    });

    return existingUser._id;
  },
});

export const getUserById = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    return user;
  },
});
