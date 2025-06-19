import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ============================================================================
// BASIC EVENT CRUD OPERATIONS
// ============================================================================

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    start_datetime: v.number(),
    organizer_id: v.id("organizer_profiles"),
    featured_image_storage_id: v.optional(v.id("_storage")),
    event_category: v.optional(v.union(
      v.literal("sports"), v.literal("music"), v.literal("food"),
      v.literal("travel"), v.literal("technology"), v.literal("arts"),
      v.literal("business"), v.literal("education"), v.literal("health"),
      v.literal("entertainment")
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be logged in to create events");
    }

    // Generate slug from title
    const slug = args.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Simple fraud analysis
    let fraudScore = 0;
    const riskFactors: ("new_organizer" | "vague_description" | "unrealistic_claims")[] = [];

    // Check description quality
    if (args.description.length < 100) {
      fraudScore += 20;
      riskFactors.push("vague_description");
    }

    // Check for suspicious terms
    const suspiciousTerms = ["guaranteed profit", "get rich quick", "no risk"];
    if (suspiciousTerms.some(term => 
      args.title.toLowerCase().includes(term) || 
      args.description.toLowerCase().includes(term)
    )) {
      fraudScore += 30;
      riskFactors.push("unrealistic_claims");
    }

    // Determine moderation status
    const moderationStatus = fraudScore <= 20 ? "approved" : "pending_review";
    const eventStatus = fraudScore <= 20 ? "approved" : "pending";

    const eventId = await ctx.db.insert("events", {
      title: args.title,
      slug: slug,
      description: args.description,
      start_datetime: args.start_datetime,
      timezone: "Asia/Kuala_Lumpur",
      location_type: "physical",
      organizer_id: args.organizer_id,
      featured_image_storage_id: args.featured_image_storage_id,
      event_category: args.event_category,
      is_free: false,
      visibility: "public",
      
      // Moderation fields
      status: eventStatus,
      moderation_status: moderationStatus,
      fraud_score: fraudScore,
      risk_factors: riskFactors,
      requires_manual_review: fraudScore > 20,
      submitted_for_review_at: Date.now(),
      
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    // Create moderation log
    if (fraudScore > 20) {
      await ctx.db.insert("admin_moderation_logs", {
        event_id: eventId,
        admin_id: identity.subject as any,
        admin_name: identity.name || "System",
        action: "submitted_for_review",
        previous_status: "draft",
        new_status: eventStatus,
        fraud_score_at_review: fraudScore,
        risk_factors_at_review: riskFactors.map(f => f as string),
        is_automated_decision: false,
        created_at: Date.now(),
      });
    }

    return eventId;
  },
});

export const getById = query({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.event_id);
  },
});

export const getUpcoming = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .filter((q) => q.gt(q.field("start_datetime"), now))
      .order("asc")
      .take(20);
  },
});

export const getByOrganizer = query({
  args: { organizer_id: v.id("organizer_profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizer_id", args.organizer_id))
      .order("desc")
      .collect();
  },
});

export const update = mutation({
  args: {
    event_id: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    start_datetime: v.optional(v.number()),
    featured_image_storage_id: v.optional(v.id("_storage")),
    event_category: v.optional(v.union(
      v.literal("sports"), v.literal("music"), v.literal("food"),
      v.literal("travel"), v.literal("technology"), v.literal("arts"),
      v.literal("business"), v.literal("education"), v.literal("health"),
      v.literal("entertainment")
    )),
  },
  handler: async (ctx, args) => {
    const { event_id, ...updates } = args;
    
    const updateData: any = {
      ...updates,
      updated_at: Date.now(),
    };

    // Update slug if title changed
    if (updates.title) {
      updateData.slug = updates.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    await ctx.db.patch(event_id, updateData);
    return await ctx.db.get(event_id);
  },
});

export const publish = mutation({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.event_id, {
      status: "published",
      published_at: Date.now(),
      updated_at: Date.now(),
    });
    return await ctx.db.get(args.event_id);
  },
});

export const unpublish = mutation({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.event_id, {
      status: "draft",
      updated_at: Date.now(),
    });
    return await ctx.db.get(args.event_id);
  },
});

export const cancel = mutation({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.event_id, {
      status: "cancelled",
      updated_at: Date.now(),
    });
    return await ctx.db.get(args.event_id);
  },
});

export const deleteEvent = mutation({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    // Check if there are any bookings for this event
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .collect();

    if (bookings.length > 0) {
      throw new Error("Cannot delete event with existing bookings");
    }

    await ctx.db.delete(args.event_id);
    return { success: true };
  },
});

// ============================================================================
// SEARCH AND FILTERING
// ============================================================================

export const search = query({
  args: {
    query: v.optional(v.string()),
    category: v.optional(v.string()),
    date_from: v.optional(v.number()),
    date_to: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    // Filter by search query
    if (args.query) {
      const searchTerm = args.query.toLowerCase();
      events = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by category
    if (args.category) {
      events = events.filter(event => event.event_category === args.category);
    }

    // Filter by date range
    if (args.date_from) {
      events = events.filter(event => event.start_datetime >= args.date_from!);
    }
    if (args.date_to) {
      events = events.filter(event => event.start_datetime <= args.date_to!);
    }

    return events;
  },
});

// ============================================================================
// ADMIN MODERATION FUNCTIONS
// ============================================================================

export const getPendingReview = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("events")
      .withIndex("by_moderation_status", (q) => q.eq("moderation_status", "pending_review"))
      .order("desc")
      .take(50);
  },
});

export const submitForReview = mutation({
  args: { 
    event_id: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.event_id, {
      status: "pending",
      moderation_status: "pending_review",
      submitted_for_review_at: Date.now(),
      updated_at: Date.now(),
    });

    // Create moderation log
    await ctx.db.insert("admin_moderation_logs", {
      event_id: args.event_id,
      admin_id: identity.subject as any,
      admin_name: identity.name || "System",
      action: "submitted_for_review",
      previous_status: "draft",
      new_status: "pending",
      is_automated_decision: false,
      created_at: Date.now(),
    });

    return { success: true };
  },
});

export const adminApprove = mutation({
  args: {
    event_id: v.id("events"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.event_id, {
      status: "approved",
      moderation_status: "approved",
      reviewed_at: Date.now(),
      reviewed_by: identity.subject as any,
      admin_notes: args.notes,
      updated_at: Date.now(),
    });

    // Create approval log
    await ctx.db.insert("admin_moderation_logs", {
      event_id: args.event_id,
      admin_id: identity.subject as any,
      admin_name: identity.name || "Admin",
      action: "approved",
      previous_status: "pending",
      new_status: "approved",
      admin_notes: args.notes,
      is_automated_decision: false,
      created_at: Date.now(),
    });

    return { success: true };
  },
});

export const adminReject = mutation({
  args: {
    event_id: v.id("events"),
    reason: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.event_id, {
      status: "rejected",
      moderation_status: "rejected",
      reviewed_at: Date.now(),
      reviewed_by: identity.subject as any,
      rejection_reason: args.reason,
      admin_notes: args.notes,
      updated_at: Date.now(),
    });

    // Create rejection log
    await ctx.db.insert("admin_moderation_logs", {
      event_id: args.event_id,
      admin_id: identity.subject as any,
      admin_name: identity.name || "Admin",
      action: "rejected",
      previous_status: "pending",
      new_status: "rejected",
      decision_reason: args.reason,
      admin_notes: args.notes,
      is_automated_decision: false,
      created_at: Date.now(),
    });

    return { success: true };
  },
});

// ============================================================================
// QUEUE INTEGRATION FUNCTIONS  
// ============================================================================

export const getAvailableTickets = query({
  args: { 
    event_id: v.id("events"),
    ticket_category_id: v.id("ticket_categories"),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.ticket_category_id);
    if (!category) return 0;

    // Count tickets sold from completed bookings
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

         let ticketsSold = 0;
     for (const booking of bookings) {
       for (const item of booking.ticket_items || []) {
         if (item.ticket_category_id === args.ticket_category_id) {
           ticketsSold += item.quantity;
         }
       }
     }

     // Count active reservations
     const reservations = await ctx.db
       .query("ticket_reservations")
       .withIndex("by_ticket_category", (q) => q.eq("ticket_category_id", args.ticket_category_id))
       .filter((q) => q.eq(q.field("status"), "active"))
       .collect();

     let reservedTickets = 0;
     for (const reservation of reservations) {
       if (reservation.expires_at > Date.now()) {
         reservedTickets += reservation.quantity;
       }
     }

     return Math.max(0, category.total_quantity - ticketsSold - reservedTickets);
  },
});

export const processQueue = internalMutation({
  args: {
    event_id: v.id("events"),
    ticket_category_id: v.id("ticket_categories"),
  },
  handler: async (ctx, args) => {
         // Calculate available tickets directly since we can't call other functions from internalMutation
     const category = await ctx.db.get(args.ticket_category_id);
     if (!category) return { processed: 0 };

     // Count tickets sold from completed bookings
     const bookings = await ctx.db
       .query("bookings")
       .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
       .filter((q) => q.eq(q.field("status"), "confirmed"))
       .collect();

     let ticketsSold = 0;
     for (const booking of bookings) {
       for (const item of booking.ticket_items || []) {
         if (item.ticket_category_id === args.ticket_category_id) {
           ticketsSold += item.quantity;
         }
       }
     }

     const availableTickets = Math.max(0, category.total_quantity - ticketsSold);
     if (availableTickets <= 0) return { processed: 0 };

     // Get next person in queue
     const nextInQueue = await ctx.db
       .query("waiting_list")
       .withIndex("by_ticket_category", (q) => q.eq("ticket_category_id", args.ticket_category_id))
       .filter((q) => q.eq(q.field("status"), "waiting"))
       .order("asc")
       .first();

    if (!nextInQueue) return { processed: 0 };

    const offerQuantity = Math.min(nextInQueue.requested_quantity, availableTickets);

    // Update status to offered
    await ctx.db.patch(nextInQueue._id, {
      status: "offered",
      offered_at: Date.now(),
      offer_expires_at: Date.now() + (15 * 60 * 1000), // 15 minutes
      offered_quantity: offerQuantity,
      updated_at: Date.now(),
    });

    return { processed: 1, offered_quantity: offerQuantity };
  },
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getModerationStats = query({
  args: {},
  handler: async (ctx) => {
    const pendingCount = (await ctx.db
      .query("events")
      .withIndex("by_moderation_status", (q) => q.eq("moderation_status", "pending_review"))
      .collect()).length;

    const approvedCount = (await ctx.db
      .query("events")
      .withIndex("by_moderation_status", (q) => q.eq("moderation_status", "approved"))
      .collect()).length;

    const rejectedCount = (await ctx.db
      .query("events")
      .withIndex("by_moderation_status", (q) => q.eq("moderation_status", "rejected"))
      .collect()).length;

    return {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      total: pendingCount + approvedCount + rejectedCount,
    };
  },
});

export const getFeaturedEvents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .withIndex("by_featured", (q) => q.eq("is_featured", true))
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(6);
  },
});

// ============================================================================
// TICKET CATEGORIES
// ============================================================================

export const getTicketCategories = query({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ticket_categories")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .order("asc")
      .collect();
  },
});

export const createTicketCategory = mutation({
  args: {
    event_id: v.id("events"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    currency: v.string(),
    total_quantity: v.number(),
    max_quantity_per_order: v.optional(v.number()),
    sale_start_datetime: v.optional(v.number()),
    sale_end_datetime: v.optional(v.number()),
    sort_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be logged in to create ticket categories");
    }

    // Verify user owns this event or is organizer
    const event = await ctx.db.get(args.event_id);
    if (!event) {
      throw new Error("Event not found");
    }

    const organizer = await ctx.db.get(event.organizer_id);
    if (!organizer || organizer.user_id !== identity.subject) {
      throw new Error("Not authorized to create ticket categories for this event");
    }

    return await ctx.db.insert("ticket_categories", {
      ...args,
      is_active: true,
      sold_quantity: 0,
      reserved_quantity: 0,
      created_at: Date.now(),
    });
  },
});

export const updateTicketCategory = mutation({
  args: {
    category_id: v.id("ticket_categories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    total_quantity: v.optional(v.number()),
    max_quantity_per_order: v.optional(v.number()),
    sale_start_datetime: v.optional(v.number()),
    sale_end_datetime: v.optional(v.number()),
    is_active: v.optional(v.boolean()),
    sort_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { category_id, ...updates } = args;
    
    await ctx.db.patch(category_id, {
      ...updates,
      updated_at: Date.now(),
    });
    
    return await ctx.db.get(category_id);
  },
});

// ============================================================================
// MIGRATION & SEEDING MUTATIONS
// ============================================================================

export const updateEventDatesToFuture = mutation({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();
    const now = Date.now();
    
    console.log("=== UPDATING EVENT DATES TO FUTURE ===");
    
    // Update each event to be in the future
    const updates = [
      { title: "KL Marathon 2024", newDate: new Date("2025-08-15T06:00:00Z").getTime() },
      { title: "Tech Summit Malaysia 2024", newDate: new Date("2025-07-25T09:00:00Z").getTime() },
      { title: "Malaysia Food Festival 2024", newDate: new Date("2025-09-20T10:00:00Z").getTime() },
      { title: "Coldplay World Tour - KL", newDate: new Date("2025-10-15T11:00:00Z").getTime() },
      { title: "Arsenal vs Liverpool - Premier League", newDate: new Date("2025-11-08T12:30:00Z").getTime() }
    ];
    
    let updatedCount = 0;
    for (const event of events) {
      const updateInfo = updates.find(u => u.title === event.title);
      if (updateInfo) {
        await ctx.db.patch(event._id, {
          start_datetime: updateInfo.newDate,
          updated_at: now
        });
        console.log(`✅ Updated ${event.title} to ${new Date(updateInfo.newDate).toLocaleString()}`);
        updatedCount++;
      }
    }
    
    console.log(`✅ Updated ${updatedCount} events to future dates`);
    
    return { success: true, updatedCount };
  },
});

export const seedOrganizer = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if organizer already exists
    const existingOrganizers = await ctx.db.query("organizer_profiles").collect();
    if (existingOrganizers.length > 0) {
      console.log("✅ Organizer already exists");
      return existingOrganizers[0]._id;
    }
    
    // Create a system user first
    const userId = await ctx.db.insert("users", {
      email: "woodyz.dev@gmail.com",
      name: "System User",
    });
    
    console.log(`✅ Created system user with ID: ${userId}`);
    
    // Create organizer profile
    const organizerId = await ctx.db.insert("organizer_profiles", {
      user_id: userId,
      business_name: "Event Management Co",
      display_name: "Event Management Co",
      business_type: "corporation",
      business_address: {
        street: "123 Main Street",
        city: "Kuala Lumpur",
        state_province: "Federal Territory of Kuala Lumpur",
        country: "Malaysia",
        postal_code: "50088"
      },
      verification_status: "verified",
      subscription_tier: "pro",
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    
    console.log(`✅ Created organizer with ID: ${organizerId}`);
    
    // Update all existing events to use this organizer ID
    const events = await ctx.db.query("events").collect();
    let updatedCount = 0;
    
    for (const event of events) {
      await ctx.db.patch(event._id, {
        organizer_id: organizerId
      });
      updatedCount++;
    }
    
    console.log(`✅ Updated ${updatedCount} events with new organizer ID`);
    
    return organizerId;
  },
});

export const seedEvents = mutation({
  args: {
    events: v.array(v.object({
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      organizer_id: v.id("organizer_profiles"),
      start_datetime: v.number(),
      end_datetime: v.optional(v.number()),
      timezone: v.string(),
      location_type: v.union(v.literal("physical"), v.literal("online"), v.literal("hybrid")),
      featured_image_storage_id: v.optional(v.id("_storage")),
      event_category: v.optional(v.union(
        v.literal("sports"), v.literal("music"), v.literal("food"),
        v.literal("travel"), v.literal("technology"), v.literal("arts"),
        v.literal("business"), v.literal("education"), v.literal("health"),
        v.literal("entertainment")
      )),
      tags: v.optional(v.array(v.string())),
      status: v.union(
        v.literal("draft"), v.literal("pending"), v.literal("approved"),
        v.literal("rejected"), v.literal("published"), v.literal("cancelled"),
        v.literal("postponed"), v.literal("sold_out"), v.literal("completed")
      ),
      moderation_status: v.union(
        v.literal("not_submitted"), v.literal("pending_review"),
        v.literal("approved"), v.literal("rejected"), v.literal("requires_changes")
      ),
      visibility: v.union(v.literal("public"), v.literal("private"), v.literal("unlisted")),
      is_free: v.boolean(),
      currency: v.optional(v.string()),
      pricing_type: v.optional(v.union(v.literal("free"), v.literal("paid"), v.literal("donation"))),
      max_attendees: v.optional(v.number()),
      current_attendees: v.optional(v.number()),
      is_featured: v.optional(v.boolean()),
      fraud_score: v.optional(v.number()),
      risk_factors: v.optional(v.array(v.union(
        v.literal("new_organizer"), v.literal("high_ticket_price"), v.literal("vague_description"),
        v.literal("suspicious_images"), v.literal("duplicate_content"), v.literal("misleading_title"),
        v.literal("no_refund_policy"), v.literal("unrealistic_claims")
      ))),
      requires_manual_review: v.optional(v.boolean()),
      view_count: v.optional(v.number()),
      like_count: v.optional(v.number()),
      share_count: v.optional(v.number()),
      created_at: v.number(),
      updated_at: v.optional(v.number()),
      published_at: v.optional(v.number()),
    }))
  },
  handler: async (ctx, args) => {
    const eventIds: { originalIndex: number; eventId: Id<"events"> }[] = [];
    
    for (let i = 0; i < args.events.length; i++) {
      const event = args.events[i];
      const eventId = await ctx.db.insert("events", event);
      eventIds.push({ originalIndex: i, eventId });
    }
    
    console.log(`✅ Successfully seeded ${eventIds.length} events`);
    return eventIds;
  },
});

export const seedTicketCategories = mutation({
  args: {
    ticketCategories: v.array(v.object({
      event_id: v.id("events"), // Direct event ID reference
      name: v.string(),
      description: v.optional(v.string()),
      price: v.number(),
      currency: v.string(),
      total_quantity: v.number(),
      sold_quantity: v.optional(v.number()),
      reserved_quantity: v.optional(v.number()),
      queue_enabled: v.optional(v.boolean()),
      min_quantity_per_order: v.optional(v.number()),
      max_quantity_per_order: v.optional(v.number()),
      max_quantity_per_user: v.optional(v.number()),
      sale_start_datetime: v.optional(v.number()),
      sale_end_datetime: v.optional(v.number()),
      is_active: v.boolean(),
      is_hidden: v.optional(v.boolean()),
      requires_promo_code: v.optional(v.boolean()),
      includes_products: v.optional(v.boolean()),
      bundled_products: v.optional(v.array(v.object({
        product_id: v.id("products"), // Use actual product ID
        quantity: v.number(),
        is_required: v.boolean(),
        included_in_price: v.boolean(),
      }))),
      requires_approval: v.optional(v.boolean()),
      sort_order: v.optional(v.number()),
      created_at: v.number(),
      updated_at: v.optional(v.number()),
    }))
  },
  handler: async (ctx, args) => {
    const ticketCategoryIds: Id<"ticket_categories">[] = [];
    
    for (const category of args.ticketCategories) {
      const ticketCategoryId = await ctx.db.insert("ticket_categories", category);
      ticketCategoryIds.push(ticketCategoryId);
    }
    
    console.log(`✅ Successfully seeded ${ticketCategoryIds.length} ticket categories`);
    return ticketCategoryIds;
  },
});

export const clearAllEvents = mutation({
  args: {},
  handler: async (ctx) => {
    // Warning: This will delete ALL events and ticket categories
    console.log("🚨 CLEARING ALL EVENTS AND TICKET CATEGORIES");
    
    // Delete all ticket categories first (due to foreign key constraints)
    const ticketCategories = await ctx.db.query("ticket_categories").collect();
    for (const category of ticketCategories) {
      await ctx.db.delete(category._id);
    }
    
    // Delete all events
    const events = await ctx.db.query("events").collect();
    for (const event of events) {
      await ctx.db.delete(event._id);
    }
    
    console.log(`🗑️ Deleted ${events.length} events and ${ticketCategories.length} ticket categories`);
    return { deletedEvents: events.length, deletedTicketCategories: ticketCategories.length };
  },
});

// Helper mutation to get event statistics
export const getEventStats = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();
    const ticketCategories = await ctx.db.query("ticket_categories").collect();
    
    const stats = {
      totalEvents: events.length,
      totalTicketCategories: ticketCategories.length,
      eventsByCategory: {} as Record<string, number>,
      eventsByStatus: {} as Record<string, number>,
      ticketCategoriesWithProducts: ticketCategories.filter(tc => tc.includes_products).length,
    };
    
    // Count by category
    events.forEach(event => {
      const category = event.event_category || 'uncategorized';
      stats.eventsByCategory[category] = (stats.eventsByCategory[category] || 0) + 1;
    });
    
    // Count by status
    events.forEach(event => {
      stats.eventsByStatus[event.status] = (stats.eventsByStatus[event.status] || 0) + 1;
    });
    
    return stats;
  },
});