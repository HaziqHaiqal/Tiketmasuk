import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// TICKET TRANSFERS
// ============================================================================

export const initiateTicketTransfer = mutation({
  args: {
    booking_id: v.id("bookings"),
    to_email: v.string(),
    transfer_reason: v.optional(v.string()),
    transfer_fee: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify booking belongs to user
    const booking = await ctx.db.get(args.booking_id);
    if (!booking || booking.customer_id !== identity.subject) {
      throw new Error("Booking not found or not authorized");
    }

    // Check if booking can be transferred (not already completed, etc.)
    if (booking.status !== "confirmed") {
      throw new Error("Booking cannot be transferred in current status");
    }

    // Find the recipient user by email
    const recipientUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.to_email))
      .first();

    if (!recipientUser) {
      throw new Error("Recipient user not found");
    }

    // Generate verification code
    const verificationCode = Math.random().toString(36).substring(2, 15);

    return await ctx.db.insert("ticket_transfers", {
      original_booking_id: args.booking_id,
      from_user_id: identity.subject as Id<"users">,
      to_user_id: recipientUser._id,
      to_email: args.to_email,
      transfer_reason: args.transfer_reason,
      transfer_fee: args.transfer_fee || 0,
      verification_code: verificationCode,
      status: "pending",
      expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      created_at: Date.now(),
    });
  },
});

export const acceptTicketTransfer = mutation({
  args: {
    transfer_id: v.id("ticket_transfers"),
    verification_code: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const transfer = await ctx.db.get(args.transfer_id);
    if (!transfer) {
      throw new Error("Transfer not found");
    }

    // Verify user is the recipient
    if (transfer.to_user_id !== identity.subject) {
      throw new Error("Not authorized to accept this transfer");
    }

    // Verify code and expiry
    if (transfer.verification_code !== args.verification_code) {
      throw new Error("Invalid verification code");
    }

    if (transfer.expires_at < Date.now()) {
      throw new Error("Transfer has expired");
    }

    if (transfer.status !== "pending") {
      throw new Error("Transfer is not pending");
    }

    // Update transfer status
    await ctx.db.patch(args.transfer_id, {
      status: "accepted",
      completed_at: Date.now(),
    });

    // Transfer the booking
    await ctx.db.patch(transfer.original_booking_id, {
      customer_id: transfer.to_user_id,
      updated_at: Date.now(),
    });

    // Mark transfer as completed
    await ctx.db.patch(args.transfer_id, {
      status: "completed",
    });

    return { success: true };
  },
});

export const cancelTicketTransfer = mutation({
  args: {
    transfer_id: v.id("ticket_transfers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const transfer = await ctx.db.get(args.transfer_id);
    if (!transfer) {
      throw new Error("Transfer not found");
    }

    // Only sender or recipient can cancel
    if (transfer.from_user_id !== identity.subject && transfer.to_user_id !== identity.subject) {
      throw new Error("Not authorized to cancel this transfer");
    }

    if (transfer.status !== "pending") {
      throw new Error("Transfer cannot be cancelled");
    }

    await ctx.db.patch(args.transfer_id, {
      status: "cancelled",
      completed_at: Date.now(),
    });

    return { success: true };
  },
});

export const getTransfersByUser = query({
  args: {
    user_id: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = args.user_id || (identity?.subject as Id<"users">);
    
    if (!userId) {
      throw new Error("User ID required");
    }

    // Get transfers sent by user
    const sentTransfers = await ctx.db
      .query("ticket_transfers")
      .withIndex("by_from_user", (q) => q.eq("from_user_id", userId))
      .collect();

    // Get transfers received by user
    const receivedTransfers = await ctx.db
      .query("ticket_transfers")
      .withIndex("by_to_user", (q) => q.eq("to_user_id", userId))
      .collect();

    return {
      sent: sentTransfers,
      received: receivedTransfers,
    };
  },
});

// ============================================================================
// GROUP BOOKINGS
// ============================================================================

export const createGroupBooking = mutation({
  args: {
    event_id: v.id("events"),
    group_name: v.string(),
    min_tickets: v.number(),
    max_tickets: v.optional(v.number()),
    discount_percentage: v.number(),
    expires_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Generate invite code
    const inviteCode = Math.random().toString(36).substring(2, 12).toUpperCase();

    return await ctx.db.insert("group_bookings", {
      event_id: args.event_id,
      group_leader_id: identity.subject as Id<"users">,
      group_name: args.group_name,
      min_tickets: args.min_tickets,
      max_tickets: args.max_tickets,
      discount_percentage: args.discount_percentage,
      current_bookings: 0,
      member_booking_ids: [],
      invite_code: inviteCode,
      status: "active",
      expires_at: args.expires_at || (Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days default
      created_at: Date.now(),
    });
  },
});

export const joinGroupBooking = mutation({
  args: {
    invite_code: v.string(),
    booking_id: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find group booking by invite code
    const groupBooking = await ctx.db
      .query("group_bookings")
      .withIndex("by_invite_code", (q) => q.eq("invite_code", args.invite_code))
      .first();

    if (!groupBooking) {
      throw new Error("Group booking not found");
    }

    if (groupBooking.status !== "active") {
      throw new Error("Group booking is not active");
    }

    if (groupBooking.expires_at && groupBooking.expires_at < Date.now()) {
      throw new Error("Group booking has expired");
    }

    // Verify booking belongs to user and is for the same event
    const booking = await ctx.db.get(args.booking_id);
    if (!booking || booking.customer_id !== identity.subject) {
      throw new Error("Booking not found or not authorized");
    }

    if (booking.event_id !== groupBooking.event_id) {
      throw new Error("Booking is not for the same event");
    }

    // Check if already in group
    if (groupBooking.member_booking_ids.includes(args.booking_id)) {
      throw new Error("Booking is already in this group");
    }

    // Check max tickets limit
    if (groupBooking.max_tickets && (groupBooking.current_bookings || 0) >= groupBooking.max_tickets) {
      throw new Error("Group booking has reached maximum capacity");
    }

    // Add booking to group
    const updatedMemberBookings = [...groupBooking.member_booking_ids, args.booking_id];
    
    await ctx.db.patch(groupBooking._id, {
      member_booking_ids: updatedMemberBookings,
      current_bookings: (groupBooking.current_bookings || 0) + 1,
      updated_at: Date.now(),
    });

    return { success: true, groupBooking };
  },
});

export const getGroupBooking = query({
  args: {
    group_id: v.optional(v.id("group_bookings")),
    invite_code: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let groupBooking;

    if (args.group_id) {
      groupBooking = await ctx.db.get(args.group_id);
    } else if (args.invite_code) {
      groupBooking = await ctx.db
        .query("group_bookings")
        .withIndex("by_invite_code", (q) => q.eq("invite_code", args.invite_code!))
        .first();
    } else {
      throw new Error("Either group_id or invite_code is required");
    }

    if (!groupBooking) {
      return null;
    }

    // Get event details
    const event = await ctx.db.get(groupBooking.event_id);

          // Get group leader details directly by ID
      const leaderProfile = await ctx.db.get(groupBooking.group_leader_id);

    // Get member bookings
    const memberBookings = await Promise.all(
      groupBooking.member_booking_ids.map(bookingId => ctx.db.get(bookingId))
    );

    return {
      ...groupBooking,
      event,
      leaderProfile,
      memberBookings: memberBookings.filter(Boolean),
    };
  },
});

export const updateGroupBooking = mutation({
  args: {
    group_id: v.id("group_bookings"),
    group_name: v.optional(v.string()),
    min_tickets: v.optional(v.number()),
    max_tickets: v.optional(v.number()),
    discount_percentage: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("expired")
    )),
    expires_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const groupBooking = await ctx.db.get(args.group_id);
    if (!groupBooking) {
      throw new Error("Group booking not found");
    }

    // Only group leader can update
    if (groupBooking.group_leader_id !== identity.subject) {
      throw new Error("Not authorized to update this group booking");
    }

    const { group_id, ...updates } = args;
    
    await ctx.db.patch(group_id, {
      ...updates,
      updated_at: Date.now(),
    });

    return await ctx.db.get(group_id);
  },
});

export const getGroupBookingsByEvent = query({
  args: {
    event_id: v.id("events"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("group_bookings")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .collect();
  },
});

export const getUserGroupBookings = query({
  args: {
    user_id: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = args.user_id || (identity?.subject as Id<"users">);
    
    if (!userId) {
      throw new Error("User ID required");
    }

    // Get groups where user is leader
    const leaderGroups = await ctx.db
      .query("group_bookings")
      .withIndex("by_group_leader", (q) => q.eq("group_leader_id", userId))
      .collect();

    // Get groups where user is a member (need to check member_booking_ids)
    const allGroups = await ctx.db.query("group_bookings").collect();
    
    // Get user's bookings
    const userBookings = await ctx.db
      .query("bookings")
      .withIndex("by_customer", (q) => q.eq("customer_id", userId))
      .collect();

    const userBookingIds = new Set(userBookings.map(b => b._id));

    const memberGroups = allGroups.filter(group => 
      group.member_booking_ids.some(bookingId => userBookingIds.has(bookingId))
    );

    return {
      asLeader: leaderGroups,
      asMember: memberGroups,
    };
  },
});

export const getGroupBookingDetails = query({
  args: { groupBookingId: v.id("group_bookings") },
  handler: async (ctx, args) => {
    const groupBooking = await ctx.db.get(args.groupBookingId);
    if (!groupBooking) return null;

    // Get group leader info directly by ID
    const groupLeader = await ctx.db.get(groupBooking.group_leader_id);

    return {
      ...groupBooking,
      group_leader: groupLeader ? {
        _id: groupLeader._id,
        name: groupLeader.name || "Unknown",
        email: groupLeader.email || "Unknown",
      } : null,
    };
  },
}); 