import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    booking_reference: v.string(),
    user_id: v.string(),
    vendor_id: v.id("vendors"),
    total_amount: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bookings", {
      booking_reference: args.booking_reference,
      user_id: args.user_id,
      vendor_id: args.vendor_id,
      total_amount: args.total_amount,
      notes: args.notes,
      status: "pending",
      created_at: Date.now(),
    });
  },
});

export const getByReference = query({
  args: { booking_reference: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_reference", (q) => q.eq("booking_reference", args.booking_reference))
      .first();
  },
});

export const updateStatus = mutation({
  args: {
    booking_id: v.id("bookings"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.booking_id, {
      status: args.status,
      updated_at: Date.now(),
    });
  },
});

export const getByUser = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .order("desc")
      .collect();
  },
});

export const getByVendor = query({
  args: { vendor_id: v.id("vendors") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_vendor", (q) => q.eq("vendor_id", args.vendor_id))
      .order("desc")
      .collect();
  },
});

export const getBookingWithUser = query({
  args: { booking_reference: v.string() },
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_reference", (q) => q.eq("booking_reference", args.booking_reference))
      .first();

    if (!booking) return null;

    // Get user details
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", booking.user_id))
      .first();

    // Get vendor details
    const vendor = await ctx.db.get(booking.vendor_id);

    return {
      ...booking,
      user,
      vendor,
    };
  },
}); 