import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// ACCESSIBILITY REQUESTS
// ============================================================================

export const createAccessibilityRequest = mutation({
  args: {
    booking_id: v.id("bookings"),
    event_id: v.id("events"),
    accommodation_type: v.union(
      v.literal("wheelchair_access"),
      v.literal("sign_language_interpreter"),
      v.literal("audio_description"),
      v.literal("large_print_materials"),
      v.literal("assisted_listening"),
      v.literal("dietary_accommodations"),
      v.literal("other")
    ),
    details: v.string(),
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

    return await ctx.db.insert("accessibility_requests", {
      booking_id: args.booking_id,
      user_id: identity.subject as Id<"users">,
      event_id: args.event_id,
      accommodation_type: args.accommodation_type,
      details: args.details,
      status: "requested",
      created_at: Date.now(),
    });
  },
});

export const updateAccessibilityRequest = mutation({
  args: {
    request_id: v.id("accessibility_requests"),
    status: v.union(
      v.literal("requested"),
      v.literal("under_review"),
      v.literal("approved"),
      v.literal("denied"),
      v.literal("fulfilled")
    ),
    organizer_response: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const request = await ctx.db.get(args.request_id);
    if (!request) {
      throw new Error("Request not found");
    }

    // Check if user is organizer of the event
    const event = await ctx.db.get(request.event_id);
    if (!event) {
      throw new Error("Event not found");
    }

    const organizerProfile = await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject as Id<"users">))
      .first();

    if (!organizerProfile || event.organizer_id !== organizerProfile._id) {
      throw new Error("Not authorized to update this request");
    }

    const { request_id, ...updates } = args;
    
    await ctx.db.patch(request_id, {
      ...updates,
      updated_at: Date.now(),
    });

    return await ctx.db.get(request_id);
  },
});

export const getAccessibilityRequestsByEvent = query({
  args: {
    event_id: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify user is organizer of the event
    const event = await ctx.db.get(args.event_id);
    if (!event) {
      throw new Error("Event not found");
    }

    const organizerProfile = await ctx.db
      .query("organizer_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject as Id<"users">))
      .first();

    if (!organizerProfile || event.organizer_id !== organizerProfile._id) {
      throw new Error("Not authorized to view these requests");
    }

    const requests = await ctx.db
      .query("accessibility_requests")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .collect();

    // Get user details for each request
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const userProfile = await ctx.db
          .query("user_profiles")
          .withIndex("by_user_id", (q) => q.eq("user_id", request.user_id))
          .first();
        
        return {
          ...request,
          userProfile: userProfile ? {
            first_name: userProfile.first_name,
            last_name: userProfile.last_name,
            display_name: userProfile.display_name,
          } : null,
        };
      })
    );

    return requestsWithUsers;
  },
});

export const getUserAccessibilityRequests = query({
  args: {
    user_id: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = args.user_id || (identity?.subject as Id<"users">);
    
    if (!userId) {
      throw new Error("User ID required");
    }

    // Users can only see their own requests unless they're admin
    if (userId !== identity?.subject) {
      // TODO: Add admin check here
      throw new Error("Not authorized");
    }

    return await ctx.db
      .query("accessibility_requests")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .collect();
  },
});

// ============================================================================
// DATA PROCESSING CONSENTS
// ============================================================================

export const recordConsent = mutation({
  args: {
    consent_type: v.union(
      v.literal("marketing_emails"),
      v.literal("analytics_tracking"),
      v.literal("personalized_ads"),
      v.literal("data_sharing_partners"),
      v.literal("location_tracking")
    ),
    consented: v.boolean(),
    consent_method: v.union(v.literal("checkbox"), v.literal("opt_in"), v.literal("implicit")),
    ip_address: v.string(),
    user_agent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("data_processing_consents", {
      user_id: identity.subject as Id<"users">,
      consent_type: args.consent_type,
      consented: args.consented,
      consent_method: args.consent_method,
      consent_date: Date.now(),
      ip_address: args.ip_address,
      user_agent: args.user_agent,
      created_at: Date.now(),
    });
  },
});

export const getUserConsents = query({
  args: {
    user_id: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = args.user_id || (identity?.subject as Id<"users">);
    
    if (!userId) {
      throw new Error("User ID required");
    }

    // Users can only see their own consents unless they're admin
    if (userId !== identity?.subject) {
      // TODO: Add admin check here
      throw new Error("Not authorized");
    }

    const consents = await ctx.db
      .query("data_processing_consents")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .collect();

    // Group by consent type and get latest consent for each
    const latestConsents = consents.reduce((acc, consent) => {
      const existing = acc[consent.consent_type];
      if (!existing || consent.consent_date > existing.consent_date) {
        acc[consent.consent_type] = consent;
      }
      return acc;
    }, {} as Record<string, any>);

    return {
      allConsents: consents.sort((a, b) => b.consent_date - a.consent_date),
      latestConsents,
    };
  },
});

export const updateConsent = mutation({
  args: {
    consent_type: v.union(
      v.literal("marketing_emails"),
      v.literal("analytics_tracking"),
      v.literal("personalized_ads"),
      v.literal("data_sharing_partners"),
      v.literal("location_tracking")
    ),
    consented: v.boolean(),
    ip_address: v.string(),
    user_agent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current consent
    const existingConsents = await ctx.db
      .query("data_processing_consents")
      .withIndex("by_user", (q) => q.eq("user_id", identity.subject as Id<"users">))
      .filter((q) => q.eq(q.field("consent_type"), args.consent_type))
      .collect();

    const latestConsent = existingConsents.sort((a, b) => b.consent_date - a.consent_date)[0];

    // Only record if consent has changed
    if (!latestConsent || latestConsent.consented !== args.consented) {
      return await ctx.db.insert("data_processing_consents", {
        user_id: identity.subject as Id<"users">,
        consent_type: args.consent_type,
        consented: args.consented,
        consent_method: "opt_in",
        consent_date: Date.now(),
        ip_address: args.ip_address,
        user_agent: args.user_agent,
        created_at: Date.now(),
      });
    }

    return latestConsent;
  },
});

export const getConsentReport = query({
  args: {
    start_date: v.optional(v.number()),
    end_date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // TODO: Add admin check here
    
    let query = ctx.db.query("data_processing_consents");

    if (args.start_date) {
      query = query.filter((q) => q.gte(q.field("consent_date"), args.start_date!));
    }

    if (args.end_date) {
      query = query.filter((q) => q.lte(q.field("consent_date"), args.end_date!));
    }

    const consents = await query.collect();

    // Aggregate statistics
    const stats = {
      totalConsents: consents.length,
      consentsByType: {} as Record<string, { granted: number; denied: number }>,
      consentsByMethod: {} as Record<string, number>,
      uniqueUsers: new Set(consents.map(c => c.user_id)).size,
    };

    consents.forEach(consent => {
      // By type
      if (!stats.consentsByType[consent.consent_type]) {
        stats.consentsByType[consent.consent_type] = { granted: 0, denied: 0 };
      }
      if (consent.consented) {
        stats.consentsByType[consent.consent_type].granted++;
      } else {
        stats.consentsByType[consent.consent_type].denied++;
      }

      // By method
      stats.consentsByMethod[consent.consent_method] = 
        (stats.consentsByMethod[consent.consent_method] || 0) + 1;
    });

    return stats;
  },
}); 