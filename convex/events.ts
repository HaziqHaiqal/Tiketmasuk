import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { createCategory } from "./eventHelpers";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    location: v.string(),
    event_date: v.number(),
    organizer_id: v.id("organizer_profiles"),
    image_storage_id: v.optional(v.id("_storage")),
    categories: v.array(v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
      total_tickets: v.number(),
      available_tickets: v.number(),
      is_active: v.boolean(),
      pricing_tiers: v.array(v.object({
        id: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        price: v.number(),
        availability_type: v.union(
          v.literal("time_based"),
          v.literal("quantity_based"),
          v.literal("unlimited")
        ),
        sale_start_date: v.optional(v.number()),
        sale_end_date: v.optional(v.number()),
        max_tickets: v.optional(v.number()),
        tickets_sold: v.optional(v.number()),
        is_active: v.boolean(),
        sort_order: v.number(),
      })),
      sort_order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("events", {
      ...args,
      is_published: false,
      created_at: Date.now(),
    });
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("is_published", true))
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.event_id);
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

export const getPublished = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("is_published", true))
      .order("desc")
      .collect();
  },
});

export const getUpcoming = query({
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("is_published", true))
      .filter((q) => q.gt(q.field("event_date"), now))
      .order("asc")
      .collect();
  },
});

export const searchEvents = query({
  args: {
    query: v.optional(v.string()),
    location: v.optional(v.string()),
    date_from: v.optional(v.number()),
    date_to: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("is_published", true))
      .collect();

    // Filter by search query
    if (args.query) {
      const searchTerm = args.query.toLowerCase();
      events = events.filter(event => 
        event.name.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm) ||
        event.location.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by location
    if (args.location) {
      events = events.filter(event => 
        event.location.toLowerCase().includes(args.location!.toLowerCase())
      );
    }

    // Filter by date range
    if (args.date_from) {
      events = events.filter(event => event.event_date >= args.date_from!);
    }
    if (args.date_to) {
      events = events.filter(event => event.event_date <= args.date_to!);
    }

    return events;
  },
});

export const getEventWithDetails = query({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) return null;

    // Get organizer profile
    const organizerProfile = await ctx.db.get(event.organizer_id);

    // Get products for this event
    const products = await ctx.db
      .query("products")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .collect();

    // Get promo codes for this event
    const promoCodes = await ctx.db
      .query("promo_codes")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    return {
      event,
      organizer_profile: organizerProfile,
      products,
      promo_codes: promoCodes,
    };
  },
});

// Get tickets sold for a specific category (from bookings)
export const getCategorySoldTickets = query({
  args: {
    event_id: v.id("events"),
    category_id: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all completed bookings for this event
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    // Sum up tickets for this category from booking_details
    let totalSold = 0;
    for (const booking of bookings) {
      for (const detail of booking.booking_details) {
        if (detail.category_id === args.category_id) {
          totalSold += detail.quantity;
        }
      }
    }

    return totalSold;
  },
});

// Get total tickets sold for an event (from bookings)
export const getEventSoldTickets = query({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    // Get all completed bookings for this event
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    // Sum up all tickets from booking_details
    let totalSold = 0;
    for (const booking of bookings) {
      for (const detail of booking.booking_details) {
        totalSold += detail.quantity;
      }
    }

    return totalSold;
  },
});

export const updateEvent = mutation({
  args: {
    event_id: v.id("events"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      location: v.optional(v.string()),
      event_date: v.optional(v.number()),
      image_storage_id: v.optional(v.id("_storage")),
      is_published: v.optional(v.boolean()),
      categories: v.optional(v.array(v.object({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        total_tickets: v.number(),
        available_tickets: v.number(),
        is_active: v.boolean(),
        pricing_tiers: v.array(v.object({
          id: v.string(),
          name: v.string(),
          description: v.optional(v.string()),
          price: v.number(),
          availability_type: v.union(
            v.literal("time_based"),
            v.literal("quantity_based"),
            v.literal("unlimited")
          ),
          sale_start_date: v.optional(v.number()),
          sale_end_date: v.optional(v.number()),
          max_tickets: v.optional(v.number()),
          tickets_sold: v.optional(v.number()),
          is_active: v.boolean(),
          sort_order: v.number(),
        })),
        sort_order: v.number(),
      }))),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.event_id, {
      ...args.updates,
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

export const publishEvent = mutation({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.event_id, {
      is_published: true,
      updated_at: Date.now(),
    });

    return await ctx.db.get(args.event_id);
  },
});

export const unpublishEvent = mutation({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.event_id, {
      is_published: false,
      updated_at: Date.now(),
    });

    return await ctx.db.get(args.event_id);
  },
});

// Create organizer profile (simplified - no pending status)
export const createOrganizerProfile = mutation({
  args: {
    user_id: v.string(),
    contact_name: v.string(),
    business_name: v.string(),
    business_registration: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("organizer_profiles", {
      ...args,
      status: "pending",
      created_at: Date.now(),
    });
  },
});

export const updateCategoryAvailability = mutation({
  args: {
    event_id: v.id("events"),
    category_id: v.string(),
    available_tickets: v.number(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) return;

    const updatedCategories = event.categories.map(category => {
      if (category.id === args.category_id) {
        return { ...category, available_tickets: args.available_tickets };
      }
      return category;
    });

    await ctx.db.patch(args.event_id, {
      categories: updatedCategories,
      updated_at: Date.now(),
    });
  },
});

/**
 * Get available categories for an event
 */
export const getEventCategories = query({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) return [];

    const now = Date.now();
    return event.categories
      .filter(category => category.is_active)
      .map(category => ({
        ...category,
        pricing_tiers: category.pricing_tiers
          .filter(tier => {
            if (!tier.is_active) return false;
            
            // Check time-based availability
            if (tier.availability_type === "time_based") {
              if (tier.sale_start_date && now < tier.sale_start_date) return false;
              if (tier.sale_end_date && now > tier.sale_end_date) return false;
            }
            
            // Check quantity-based availability
            if (tier.availability_type === "quantity_based") {
              if (tier.max_tickets && tier.tickets_sold && tier.tickets_sold >= tier.max_tickets) return false;
            }
            
            return true;
          })
          .sort((a, b) => a.sort_order - b.sort_order)
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
  },
});

/**
 * Get the best available pricing tier for a category (cheapest available)
 */
export const getBestPricingTier = query({
  args: {
    event_id: v.id("events"),
    category_id: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) return null;

    const category = event.categories.find(cat => cat.id === args.category_id);
    if (!category) return null;

    const now = Date.now();
    const availableTiers = category.pricing_tiers
      .filter(tier => {
        if (!tier.is_active) return false;
        
        // Check time-based availability
        if (tier.availability_type === "time_based") {
          if (tier.sale_start_date && now < tier.sale_start_date) return false;
          if (tier.sale_end_date && now > tier.sale_end_date) return false;
        }
        
        // Check quantity-based availability
        if (tier.availability_type === "quantity_based") {
          if (tier.max_tickets && tier.tickets_sold && tier.tickets_sold >= tier.max_tickets) return false;
        }
        
        return true;
      })
      .sort((a, b) => a.sort_order - b.sort_order);

    return availableTiers[0] || null;
  },
});

/**
 * Get category availability info
 */
export const getCategoryAvailability = query({
  args: {
    event_id: v.id("events"),
    category_id: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) return null;

    const category = event.categories.find(cat => cat.id === args.category_id);
    if (!category) return null;

    // Count purchased tickets for this category from bookings
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    let purchasedCount = 0;
    for (const booking of bookings) {
      for (const detail of booking.booking_details) {
        if (detail.category_id === args.category_id) {
          purchasedCount += detail.quantity;
        }
      }
    }

    return {
      total_tickets: category.total_tickets,
      available_tickets: category.available_tickets,
      purchased_count: purchasedCount,
    };
  },
});

/**
 * Get overall event availability (sum of all categories)
 */
export const getEventAvailability = query({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) return null;

    // Calculate totals across all categories
    const totalTickets = event.categories.reduce((sum, cat) => sum + cat.total_tickets, 0);
    const availableTickets = event.categories.reduce((sum, cat) => sum + cat.available_tickets, 0);

    // Count all purchased tickets from bookings
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    let purchasedCount = 0;
    for (const booking of bookings) {
      for (const detail of booking.booking_details) {
        purchasedCount += detail.quantity;
      }
    }

    return {
      totalTickets,
      availableTickets,
      purchasedCount,
      reservedCount: 0,
    };
  },
});

export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) {
      return [];
    }

    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("is_published", true))
      .collect();

    // Simple text search in name, description, and location
    const searchTerm = args.searchTerm.toLowerCase();
    return events.filter(event => 
      !event.is_cancelled &&
      (event.name.toLowerCase().includes(searchTerm) ||
       event.description.toLowerCase().includes(searchTerm) ||
       event.location.toLowerCase().includes(searchTerm))
    );
  },
});

export const cancelEvent = mutation({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) return;

    await ctx.db.patch(args.event_id, {
      is_cancelled: true,
      updated_at: Date.now(),
    });
  },
});

export const getUserEvents = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    // Get organizer profile for this user
    const organizerProfile = await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .first();

    if (!organizerProfile) {
      return [];
    }

    return await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizer_id", organizerProfile._id))
      .order("desc")
      .collect();
  },
});

export const get = query({
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("is_published", true))
      .collect();
    
    // Filter out cancelled events in JavaScript
    return events.filter(event => !event.is_cancelled);
  },
});

export const update = mutation({
  args: {
    event_id: v.id("events"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      location: v.optional(v.string()),
      event_date: v.optional(v.number()),
      categories: v.optional(v.array(v.object({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        total_tickets: v.number(),
        available_tickets: v.number(),
        is_active: v.boolean(),
        pricing_tiers: v.array(v.object({
          id: v.string(),
          name: v.string(),
          description: v.optional(v.string()),
          price: v.number(),
          availability_type: v.union(
            v.literal("time_based"),
            v.literal("quantity_based"),
            v.literal("unlimited")
          ),
          sale_start_date: v.optional(v.number()),
          sale_end_date: v.optional(v.number()),
          max_tickets: v.optional(v.number()),
          tickets_sold: v.optional(v.number()),
          is_active: v.boolean(),
          sort_order: v.number(),
        })),
        sort_order: v.number(),
      }))),
      image_storage_id: v.optional(v.id("_storage")),
      is_published: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) return;

    await ctx.db.patch(args.event_id, {
      ...args.updates,
      updated_at: Date.now(),
    });
  },
});

/**
 * Check if a user is the organizer/owner of an event
 */
export const isUserEventOwner = query({
  args: { 
    event_id: v.id("events"),
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.event_id);
    if (!event) return false;

    // Get organizer profile for this user
    const organizerProfile = await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .first();

    if (!organizerProfile) return false;

    return event.organizer_id === organizerProfile._id;
  },
});

/**
 * Create an event from organizer input (simple format)
 * Organizers only need to provide human-readable info, system generates IDs
 */
export const createEventFromOrganizerInput = mutation({
  args: {
    // Basic event info
    title: v.string(),
    description: v.string(),
    date: v.string(), // "2025-05-15"
    time: v.string(), // "07:00"
    location: v.string(),
    image_url: v.optional(v.string()),
    
    // Categories with simple pricing tiers
    categories: v.array(v.object({
      name: v.string(),
      description: v.string(),
      total_tickets: v.number(),
      pricing_tiers: v.array(v.object({
        name: v.string(),
        description: v.optional(v.string()),
        price: v.number(), // In RM (e.g., 10.50)
        type: v.union(v.literal("time_based"), v.literal("quantity_based"), v.literal("unlimited")),
        sale_start: v.optional(v.string()), // "2025-04-15" (for time_based)
        sale_end: v.optional(v.string()),   // "2025-04-20" (for time_based)
        max_quantity: v.optional(v.number()), // For quantity_based
      }))
    }))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be logged in to create events");
    }

    // We don't need to manage users table directly since Convex Auth handles it
    // Just proceed with organizer profile creation/verification

    // Get or create organizer profile for this user
    let organizerProfile = await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    if (!organizerProfile) {
      const organizerProfileId = await ctx.db.insert("organizer_profiles", {
        user_id: identity.subject,
        contact_name: identity.name!,
        business_name: identity.name || "My Business",
        status: "pending", // New organizers start as pending for admin approval
        created_at: Date.now(),
      });
      organizerProfile = await ctx.db.get(organizerProfileId);
    }

    if (!organizerProfile) {
      throw new Error("Failed to create organizer profile");
    }

    // Check if organizer is approved to create events
    if (organizerProfile.status !== "active") {
      if (organizerProfile.status === "pending") {
        throw new Error("Your organizer account is pending approval. Please wait for admin review before creating events.");
      } else if (organizerProfile.status === "suspended") {
        throw new Error("Your organizer account has been suspended. Please contact support.");
      }
    }

    // Convert date/time to timestamp
    const eventDateTime = new Date(`${args.date}T${args.time}:00`).getTime();

    // Helper function to convert date string to timestamp
    const dateToTimestamp = (dateStr: string) => new Date(`${dateStr}T00:00:00`).getTime();

    // Process categories with auto-generated IDs
    const processedCategories = args.categories.map((category, categoryIndex) => {
      const pricingTiers = category.pricing_tiers.map((tier, tierIndex) => ({
        name: tier.name,
        description: tier.description,
        price: Math.round(tier.price * 100), // Convert RM to cents
        availability_type: tier.type,
        sale_start_date: tier.sale_start ? dateToTimestamp(tier.sale_start) : undefined,
        sale_end_date: tier.sale_end ? dateToTimestamp(tier.sale_end) : undefined,
        max_tickets: tier.max_quantity,
        sort_order: tierIndex + 1,
      }));

      return createCategory(
        category.name,
        category.description,
        category.total_tickets,
        categoryIndex + 1,
        pricingTiers
      );
    });

    // Create the event
    const eventId = await ctx.db.insert("events", {
      organizer_id: organizerProfile._id,
      name: args.title,
      description: args.description,
      event_date: eventDateTime,
      location: args.location,
      image_storage_id: undefined,
      categories: processedCategories,
      is_published: true,
      created_at: Date.now(),
    });

    return eventId;
  },
}); 