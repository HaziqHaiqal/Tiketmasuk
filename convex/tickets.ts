import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { WAITING_LIST_STATUS } from "./constants";

export const getUserTicketForEvent = query({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
  },
  handler: async (ctx, { eventId, userId }) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventId", eventId)
      )
      .first();

    return ticket;
  },
});

export const getTicketWithDetails = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, { ticketId }) => {
    const ticket = await ctx.db.get(ticketId);
    if (!ticket) return null;

    const event = await ctx.db.get(ticket.eventId);

    return {
      ...ticket,
      event,
    };
  },
});

export const getValidTicketsForEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .filter((q) =>
        q.or(q.eq(q.field("status"), "valid"), q.eq(q.field("status"), "used"))
      )
      .collect();
  },
});

export const createPendingTicket = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
    waitingListId: v.id("waitingList"),
    billCode: v.string(),
    externalReference: v.string(),
    amount: v.number(),
    metadata: v.string(),
  },
  handler: async (ctx, args) => {
    const ticketId = await ctx.db.insert("tickets", {
      eventId: args.eventId,
      userId: args.userId,
      purchasedAt: Date.now(),
      status: "pending",
      billCode: args.billCode,
      externalReference: args.externalReference,
      amount: args.amount,
      metadata: args.metadata,
    });

    return ticketId;
  },
});

export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    status: v.union(
      v.literal("pending"),
      v.literal("valid"),
      v.literal("used"),
      v.literal("refunded"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, { ticketId, status }) => {
    await ctx.db.patch(ticketId, { status });
  },
});

export const getTicketByBillCode = query({
  args: { billCode: v.string() },
  handler: async (ctx, { billCode }) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_bill_code", (q) => q.eq("billCode", billCode))
      .first();
  },
});

export const completePendingTicketPurchase = mutation({
  args: {
    ticketId: v.id("tickets"),
    paymentIntentId: v.string(),
    waitingListId: v.id("waitingList"),
  },
  handler: async (ctx, { ticketId, paymentIntentId, waitingListId }) => {
    // Update ticket status to valid
    await ctx.db.patch(ticketId, {
      status: "valid",
      paymentIntentId,
    });

    // Update waiting list status to purchased
    await ctx.db.patch(waitingListId, {
      status: WAITING_LIST_STATUS.PURCHASED,
    });

    return { success: true };
  },
});
