import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Convex Auth tables - REQUIRED for authentication
  ...authTables,
  // ============================================================================
  // USER PROFILES - Extending Convex Auth users table
  // ============================================================================
  // Note: Convex Auth provides the core 'users' table automatically
  // We create user_profiles for additional user data

  user_profiles: defineTable({
    // LINK TO AUTH USER
    user_id: v.id("users"), // Links to Convex Auth users table

    // PROFILE INFORMATION
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    display_name: v.optional(v.string()),
    avatar_storage_id: v.optional(v.id("_storage")),
    date_of_birth: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"), v.literal("prefer_not_to_say"))),

    // CONTACT & LOCATION
    phone: v.optional(v.string()),
    phone_verified_at: v.optional(v.number()),
    address: v.optional(v.object({
      street: v.optional(v.string()),
      city: v.string(),
      state_province: v.string(),
      postal_code: v.optional(v.string()),
      country: v.string(),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
    })),

    // USER ROLES & PERMISSIONS (Industry Standard Approach)
    // Every user starts as "customer" (account holder who makes purchases), becomes "organizer" when they create first event
    // Note: "customer" = account holder who buys tickets, "attendees" (in bookings) = people who attend events
    roles: v.array(v.union(v.literal("customer"), v.literal("organizer"), v.literal("admin"))),
    current_active_role: v.optional(v.union(v.literal("customer"), v.literal("organizer"), v.literal("admin"))),
    permissions: v.optional(v.array(v.string())), // Custom permissions beyond role

    // ORGANIZER STATUS (automatically managed)
    is_organizer: v.optional(v.boolean()), // True when user creates first event
    organizer_since: v.optional(v.number()), // When they became an organizer

    // PREFERENCES & SETTINGS
    language: v.optional(v.string()),
    timezone: v.optional(v.string()),
    currency: v.optional(v.string()),
    marketing_opt_in: v.optional(v.boolean()),
    push_notifications: v.optional(v.boolean()),
    email_notifications: v.optional(v.boolean()),
    sms_notifications: v.optional(v.boolean()),

    // VERIFICATION & SECURITY
    account_status: v.union(v.literal("active"), v.literal("suspended"), v.literal("pending"), v.literal("banned")),
    verification_level: v.union(v.literal("unverified"), v.literal("email_verified"), v.literal("phone_verified"), v.literal("identity_verified")),
    two_factor_enabled: v.optional(v.boolean()),

    // ANALYTICS & TRACKING
    last_login_at: v.optional(v.number()),
    login_count: v.optional(v.number()),
    referral_code: v.optional(v.string()),
    referred_by: v.optional(v.id("users")),

    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_user_id", ["user_id"])
    .index("by_roles", ["roles"])
    .index("by_active_role", ["current_active_role"])
    .index("by_status", ["account_status"])
    .index("by_verification", ["verification_level"])
    .index("by_organizer_status", ["is_organizer"]),

  // ============================================================================
  // ORGANIZER PROFILES & BUSINESS MANAGEMENT
  // ============================================================================

  organizer_profiles: defineTable({
    user_id: v.id("users"), // Links to Convex Auth users table

    // BUSINESS INFORMATION
    business_name: v.string(),
    business_type: v.union(
      v.literal("individual"),
      v.literal("sole_proprietorship"),
      v.literal("llc"),
      v.literal("corporation"),
      v.literal("nonprofit"),
      v.literal("partnership"),
      v.literal("government")
    ),
    business_registration_number: v.optional(v.string()),
    tax_id: v.optional(v.string()),

    // BRANDING & MARKETING
    display_name: v.string(),
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    social_media: v.optional(v.object({
      facebook: v.optional(v.string()),
      twitter: v.optional(v.string()),
      instagram: v.optional(v.string()),
      linkedin: v.optional(v.string()),
      youtube: v.optional(v.string()),
      tiktok: v.optional(v.string()),
    })),

    // MEDIA ASSETS
    logo_storage_id: v.optional(v.id("_storage")),
    banner_storage_id: v.optional(v.id("_storage")),
    brand_colors: v.optional(v.object({
      primary: v.optional(v.string()),
      secondary: v.optional(v.string()),
      accent: v.optional(v.string()),
    })),

    // BUSINESS ADDRESS & CONTACT
    business_address: v.object({
      street: v.optional(v.string()),
      city: v.string(),
      state_province: v.string(),
      postal_code: v.optional(v.string()),
      country: v.string(),
    }),
    business_phone: v.optional(v.string()),
    business_email: v.optional(v.string()),

    // VERIFICATION & COMPLIANCE
    verification_status: v.union(v.literal("pending"), v.literal("verified"), v.literal("rejected")),
    verification_documents: v.optional(v.array(v.object({
      type: v.string(),
      storage_id: v.id("_storage"),
      status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
      uploaded_at: v.number(),
    }))),

    // FINANCIAL INFORMATION
    bank_account_verified: v.optional(v.boolean()),
    payment_methods: v.optional(v.array(v.object({
      type: v.union(v.literal("bank_account"), v.literal("paypal"), v.literal("stripe")),
      last_four: v.optional(v.string()),
      is_default: v.boolean(),
      added_at: v.number(),
    }))),

    // SUBSCRIPTION & PLAN
    subscription_tier: v.union(v.literal("free"), v.literal("basic"), v.literal("pro"), v.literal("enterprise")),
    subscription_expires_at: v.optional(v.number()),

    // PERFORMANCE METRICS
    total_events_hosted: v.optional(v.number()),
    total_tickets_sold: v.optional(v.number()),
    total_revenue: v.optional(v.number()),
    average_rating: v.optional(v.number()),
    total_reviews: v.optional(v.number()),

    // EVENT SPECIALIZATIONS
    specialties: v.optional(v.array(v.union(
      v.literal("sports"), v.literal("music"), v.literal("food"),
      v.literal("travel"), v.literal("technology"), v.literal("arts"),
      v.literal("business"), v.literal("education"), v.literal("health"),
      v.literal("entertainment"), v.literal("cultural"), v.literal("religious"),
      v.literal("networking"), v.literal("fundraising")
    ))),

    // SETTINGS & PREFERENCES
    auto_approve_events: v.optional(v.boolean()),
    default_refund_policy: v.optional(v.string()),

    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_user_id", ["user_id"])
    .index("by_status", ["verification_status"])
    .index("by_tier", ["subscription_tier"])
    .index("by_specialties", ["specialties"])
    .index("by_rating", ["average_rating"]),

  // ============================================================================
  // EVENTS MANAGEMENT
  // ============================================================================

  events: defineTable({
    // BASIC EVENT INFORMATION
    title: v.string(),
    slug: v.string(), // URL-friendly version of title
    description: v.string(),
    short_description: v.optional(v.string()),
    organizer_id: v.id("organizer_profiles"),

    // EVENT CLASSIFICATION & METADATA
    event_category: v.optional(v.union(
      v.literal("sports"), v.literal("music"), v.literal("food"),
      v.literal("travel"), v.literal("technology"), v.literal("arts"),
      v.literal("business"), v.literal("education"), v.literal("health"),
      v.literal("entertainment")
    )),
    tags: v.optional(v.array(v.string())),

    // TIMING & SCHEDULING
    start_datetime: v.number(),
    end_datetime: v.optional(v.number()),
    timezone: v.string(),
    is_recurring: v.optional(v.boolean()),
    recurrence_pattern: v.optional(v.object({
      frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
      interval: v.number(),
      end_date: v.optional(v.number()),
      days_of_week: v.optional(v.array(v.number())),
    })),

    // LOCATION & VENUE
    venue_id: v.optional(v.id("venues")),
    location_type: v.union(v.literal("physical"), v.literal("online"), v.literal("hybrid")),
    online_platform: v.optional(v.object({
      platform: v.union(v.literal("zoom"), v.literal("teams"), v.literal("youtube"), v.literal("custom")),
      url: v.optional(v.string()),
      access_code: v.optional(v.string()),
    })),

    // MEDIA & ASSETS
    featured_image_storage_id: v.optional(v.id("_storage")),
    gallery_images: v.optional(v.array(v.id("_storage"))),
    promotional_video_storage_id: v.optional(v.id("_storage")),
    documents: v.optional(v.array(v.object({
      name: v.string(),
      storage_id: v.id("_storage"),
      type: v.string(),
    }))),

    // EVENT STATUS & LIFECYCLE  
    status: v.union(
      v.literal("draft"),        // Organizer is still editing
      v.literal("pending"),      // Submitted for admin approval
      v.literal("approved"),     // Admin approved, can be published
      v.literal("rejected"),     // Admin rejected
      v.literal("published"),    // Live and visible to public
      v.literal("cancelled"),
      v.literal("postponed"),
      v.literal("sold_out"),
      v.literal("completed")
    ),

    // MODERATION & APPROVAL SYSTEM
    moderation_status: v.union(
      v.literal("not_submitted"),   // Draft, not yet submitted
      v.literal("pending_review"),  // Waiting for admin approval
      v.literal("approved"),        // Admin approved
      v.literal("rejected"),        // Admin rejected
      v.literal("requires_changes") // Admin requested changes
    ),
    submitted_for_review_at: v.optional(v.number()),
    reviewed_at: v.optional(v.number()),
    reviewed_by: v.optional(v.id("users")), // Admin who reviewed
    rejection_reason: v.optional(v.string()),
    admin_notes: v.optional(v.string()),

    // FRAUD PREVENTION FLAGS
    fraud_score: v.optional(v.number()), // 0-100 risk score
    risk_factors: v.optional(v.array(v.union(
      v.literal("new_organizer"),
      v.literal("high_ticket_price"),
      v.literal("vague_description"),
      v.literal("suspicious_images"),
      v.literal("duplicate_content"),
      v.literal("misleading_title"),
      v.literal("no_refund_policy"),
      v.literal("unrealistic_claims")
    ))),
    requires_manual_review: v.optional(v.boolean()),

    visibility: v.union(v.literal("public"), v.literal("private"), v.literal("unlisted")),
    is_featured: v.optional(v.boolean()),

    // PRICING & BUSINESS
    is_free: v.boolean(),
    currency: v.optional(v.string()),
    pricing_type: v.optional(v.union(v.literal("free"), v.literal("paid"), v.literal("donation"))),

    // CAPACITY & LIMITS
    max_attendees: v.optional(v.number()),
    current_attendees: v.optional(v.number()),
    waitlist_enabled: v.optional(v.boolean()),
    max_waitlist: v.optional(v.number()),

    // ATTENDEE MANAGEMENT
    requires_approval: v.optional(v.boolean()),
    registration_deadline: v.optional(v.number()),
    age_restriction: v.optional(v.object({
      min_age: v.optional(v.number()),
      max_age: v.optional(v.number()),
    })),

    // POLICIES & TERMS
    refund_policy: v.optional(v.string()),
    terms_and_conditions: v.optional(v.string()),
    privacy_policy: v.optional(v.string()),

    // SEO & MARKETING
    seo_title: v.optional(v.string()),
    seo_description: v.optional(v.string()),
    meta_keywords: v.optional(v.array(v.string())),

    // CUSTOM FIELDS & QUESTIONS
    custom_fields: v.optional(v.array(v.object({
      field_id: v.string(),
      label: v.string(),
      type: v.union(v.literal("text"), v.literal("textarea"), v.literal("select"), v.literal("checkbox"), v.literal("radio")),
      required: v.boolean(),
      options: v.optional(v.array(v.string())),
    }))),

    // ANALYTICS & PERFORMANCE
    view_count: v.optional(v.number()),
    like_count: v.optional(v.number()),
    share_count: v.optional(v.number()),

    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
    published_at: v.optional(v.number()),
  })
    .index("by_organizer", ["organizer_id"])
    .index("by_category", ["event_category"])
    .index("by_status", ["status"])
    .index("by_moderation_status", ["moderation_status"])
    .index("by_start_time", ["start_datetime"])
    .index("by_featured", ["is_featured"])
    .index("by_slug", ["slug"])
    .index("by_pending_review", ["moderation_status", "submitted_for_review_at"])
    .index("by_fraud_score", ["fraud_score"])
    .index("by_reviewed_by", ["reviewed_by"])
    .searchIndex("search_events", {
      searchField: "title",
      filterFields: ["event_category", "status", "location_type", "moderation_status"]
    }),

  // ============================================================================
  // VENUES & LOCATIONS
  // ============================================================================

  venues: defineTable({
    // BASIC VENUE INFORMATION
    name: v.string(),
    description: v.optional(v.string()),
    venue_type: v.union(
      v.literal("conference_center"),
      v.literal("hotel"),
      v.literal("restaurant"),
      v.literal("outdoor"),
      v.literal("theater"),
      v.literal("stadium"),
      v.literal("club"),
      v.literal("gallery"),
      v.literal("other")
    ),

    // LOCATION & ADDRESS
    address: v.object({
      street: v.string(),
      city: v.string(),
      state_province: v.string(),
      postal_code: v.optional(v.string()),
      country: v.string(),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
    }),

    // CONTACT INFORMATION
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),

    // CAPACITY & LAYOUT
    max_capacity: v.number(),
    layout_options: v.optional(v.array(v.object({
      name: v.string(),
      capacity: v.number(),
      setup_type: v.string(), // "theater", "classroom", "banquet", etc.
    }))),

    // AMENITIES & FEATURES
    amenities: v.optional(v.array(v.union(
      v.literal("parking"),
      v.literal("wifi"),
      v.literal("av_equipment"),
      v.literal("catering"),
      v.literal("wheelchair_accessible"),
      v.literal("air_conditioning"),
      v.literal("security"),
      v.literal("restrooms")
    ))),

    // MEDIA
    images: v.optional(v.array(v.id("_storage"))),
    floor_plan_storage_id: v.optional(v.id("_storage")),

    // AVAILABILITY & PRICING
    hourly_rate: v.optional(v.number()),
    daily_rate: v.optional(v.number()),
    currency: v.optional(v.string()),

    // VERIFICATION & STATUS
    verification_status: v.union(v.literal("pending"), v.literal("verified"), v.literal("rejected")),
    is_active: v.boolean(),

    // OWNERSHIP
    owner_id: v.optional(v.id("users")),

    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_city", ["address.city"])
    .index("by_type", ["venue_type"])
    .index("by_status", ["verification_status"])
    .index("by_capacity", ["max_capacity"])
    .searchIndex("search_venues", {
      searchField: "name",
      filterFields: ["venue_type", "address.city"]
    }),

  // ============================================================================
  // TICKET CATEGORIES & PRICING
  // ============================================================================

  ticket_categories: defineTable({
    event_id: v.id("events"),

    // TICKET INFORMATION
    name: v.string(), // "VIP", "General Admission", "Student", "Early Bird"
    description: v.optional(v.string()),

    // PRICING
    price: v.number(), // Price in cents/smallest currency unit
    currency: v.string(),
    original_price: v.optional(v.number()), // For showing discounts

    // QUANTITY & AVAILABILITY
    total_quantity: v.number(), // Total tickets available
    sold_quantity: v.optional(v.number()), // Tickets actually sold/confirmed
    reserved_quantity: v.optional(v.number()), // Tickets temporarily reserved (during checkout)
    queue_enabled: v.optional(v.boolean()), // Whether to enable queue when sold out

    // PURCHASE LIMITS
    min_quantity_per_order: v.optional(v.number()),
    max_quantity_per_order: v.optional(v.number()),
    max_quantity_per_user: v.optional(v.number()),

    // TIMING & AVAILABILITY
    sale_start_datetime: v.optional(v.number()),
    sale_end_datetime: v.optional(v.number()),

    // STATUS & VISIBILITY
    is_active: v.boolean(),
    is_hidden: v.optional(v.boolean()), // Hidden from public but still purchasable via direct link
    requires_promo_code: v.optional(v.boolean()),

    // BUNDLED PRODUCTS (NEW)
    includes_products: v.optional(v.boolean()), // Does this ticket include products?
    bundled_products: v.optional(v.array(v.object({
      product_id: v.id("products"),
      quantity: v.number(), // Usually 1 per ticket
      is_required: v.boolean(), // Must select variants during purchase
      included_in_price: v.boolean(), // Already included or additional cost
    }))),

    // SPECIAL CONDITIONS
    requires_approval: v.optional(v.boolean()),
    age_restriction: v.optional(v.object({
      min_age: v.optional(v.number()),
      max_age: v.optional(v.number()),
    })),

    // SORTING & DISPLAY
    sort_order: v.optional(v.number()),

    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_event", ["event_id"])
    .index("by_status", ["is_active"])
    .index("by_sort_order", ["sort_order"])
    .index("by_includes_products", ["includes_products"]),

  // ============================================================================
  // PROMOTIONAL CODES & DISCOUNTS
  // ============================================================================

  promo_codes: defineTable({
    // CODE INFORMATION
    code: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),

    // SCOPE
    event_id: v.optional(v.id("events")), // null means global promo code
    ticket_category_ids: v.optional(v.array(v.id("ticket_categories"))), // Specific ticket types
    organizer_id: v.id("organizer_profiles"),

    // DISCOUNT CONFIGURATION
    discount_type: v.union(v.literal("percentage"), v.literal("fixed_amount"), v.literal("free")),
    discount_value: v.number(), // Percentage (0-100) or amount in cents
    max_discount_amount: v.optional(v.number()), // Cap for percentage discounts

    // USAGE LIMITS
    max_uses: v.optional(v.number()), // Total number of times code can be used
    max_uses_per_user: v.optional(v.number()),
    current_uses: v.optional(v.number()),

    // TIMING
    valid_from: v.number(),
    valid_until: v.number(),

    // STATUS
    is_active: v.boolean(),

    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_code", ["code"])
    .index("by_event", ["event_id"])
    .index("by_organizer", ["organizer_id"])
    .index("by_validity", ["valid_from", "valid_until"]),

  // ============================================================================
  // BOOKINGS & ORDERS
  // ============================================================================

  bookings: defineTable({
    // BOOKING IDENTIFICATION
    booking_number: v.string(), // Human-friendly booking reference
    event_id: v.optional(v.id("events")), // Optional for standalone product orders
    customer_id: v.id("users"), // Links to Convex Auth users table

    // BOOKING TYPE
    booking_type: v.union(
      v.literal("event_tickets"), // Traditional event booking with tickets
      v.literal("products_only"), // Standalone product purchase (store)
      v.literal("event_with_products") // Event tickets + additional products
    ),

    // CONTACT INFORMATION (may differ from user profile)
    contact_info: v.object({
      first_name: v.string(),
      last_name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
    }),

    // TICKETS & ITEMS
    ticket_items: v.optional(v.array(v.object({
      ticket_category_id: v.id("ticket_categories"),
      quantity: v.number(),
      unit_price: v.number(),
      discount_amount: v.optional(v.number()),
      promo_code: v.optional(v.string()),

      // BUNDLED PRODUCTS (selected variants for included products)
      bundled_product_selections: v.optional(v.array(v.object({
        product_id: v.id("products"),
        variant_selections: v.array(v.object({
          variant_id: v.string(),
          option_id: v.string(),
          option_label: v.string(),
          price_modifier: v.number(),
        })),
        additional_cost: v.optional(v.number()), // If not included in ticket price
        
        // CUSTOMER'S CHOSEN FULFILLMENT METHOD FOR THIS BUNDLED PRODUCT
        fulfillment_method: v.union(
          v.literal("pickup"),
          v.literal("shipping")
        ),
        
        // FULFILLMENT DETAILS
        fulfillment_status: v.optional(v.union(
          v.literal("pending"),
          v.literal("preparing"),
          v.literal("ready_for_pickup"),
          v.literal("shipped"),
          v.literal("in_transit"),
          v.literal("delivered"),
          v.literal("completed")
        )),
        
        // SHIPPING DETAILS (if chosen shipping)
        shipping_cost: v.optional(v.number()), // Additional shipping cost
        shipping_zone: v.optional(v.string()), // Which shipping zone
        estimated_delivery_date: v.optional(v.number()),
        tracking_number: v.optional(v.string()),
        shipping_carrier: v.optional(v.string()), // "Pos Malaysia", "DHL", "FedEx"
        shipping_address: v.optional(v.object({
          address_line_1: v.string(),
          address_line_2: v.optional(v.string()),
          city: v.string(),
          state_province: v.string(),
          postal_code: v.string(),
          country: v.string(),
          phone: v.optional(v.string()),
        })),

        // PICKUP DETAILS (if chosen pickup)
        pickup_location_id: v.optional(v.string()),
        pickup_location_name: v.optional(v.string()),
        pickup_ready_at: v.optional(v.number()),
        pickup_notification_sent: v.optional(v.boolean()),
      }))),
    }))),

    // STANDALONE PRODUCT ITEMS (for store purchases)
    product_items: v.optional(v.array(v.object({
      product_id: v.id("products"),
      quantity: v.number(),
      unit_price: v.number(),
      discount_amount: v.optional(v.number()),
      promo_code: v.optional(v.string()),

      // VARIANT SELECTIONS
      variant_selections: v.array(v.object({
        variant_id: v.string(),
        option_id: v.string(),
        option_label: v.string(),
        price_modifier: v.number(),
      })),
      
      // CUSTOMER'S CHOSEN FULFILLMENT METHOD
      fulfillment_method: v.union(
        v.literal("pickup"),
        v.literal("shipping")
      ),
      
      // FULFILLMENT DETAILS
      fulfillment_status: v.optional(v.union(
        v.literal("pending"),
        v.literal("preparing"),
        v.literal("ready_for_pickup"),
        v.literal("shipped"),
        v.literal("in_transit"),
        v.literal("delivered"),
        v.literal("completed")
      )),
      
      // SHIPPING DETAILS (if chosen shipping)
      shipping_cost: v.optional(v.number()), // Additional shipping cost
      shipping_zone: v.optional(v.string()), // Which shipping zone
      estimated_delivery_date: v.optional(v.number()),
      tracking_number: v.optional(v.string()),
      shipping_carrier: v.optional(v.string()), // "Pos Malaysia", "DHL", "FedEx"
      shipping_address: v.optional(v.object({
        address_line_1: v.string(),
        address_line_2: v.optional(v.string()),
        city: v.string(),
        state_province: v.string(),
        postal_code: v.string(),
        country: v.string(),
        phone: v.optional(v.string()),
      })),

      // PICKUP DETAILS (if chosen pickup)
      pickup_location_id: v.optional(v.string()),
      pickup_location_name: v.optional(v.string()),
      pickup_ready_at: v.optional(v.number()),
      pickup_notification_sent: v.optional(v.boolean()),
    }))),

    // PRICING BREAKDOWN
    subtotal: v.number(), // Total before taxes and fees
    tax_amount: v.optional(v.number()),
    service_fee: v.optional(v.number()),
    processing_fee: v.optional(v.number()),
    discount_amount: v.optional(v.number()),
    total_amount: v.number(), // Final amount charged
    currency: v.string(),

    // PAYMENT INFORMATION
    payment_status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded"),
      v.literal("partially_refunded")
    ),
    payment_method: v.optional(v.union(
      v.literal("credit_card"),
      v.literal("debit_card"),
      v.literal("paypal"),
      v.literal("bank_transfer"),
      v.literal("apple_pay"),
      v.literal("google_pay")
    )),
    payment_intent_id: v.optional(v.string()), // Stripe/payment processor ID

    // BOOKING STATUS & LIFECYCLE
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("refunded"),
      v.literal("no_show")
    ),

    // ATTENDEE INFORMATION
    attendees: v.optional(v.array(v.object({
      first_name: v.string(),
      last_name: v.string(),
      email: v.optional(v.string()),
      ticket_category_id: v.id("ticket_categories"),
      check_in_status: v.optional(v.union(v.literal("checked_in"), v.literal("no_show"))),
      check_in_datetime: v.optional(v.number()),
      custom_fields: v.optional(v.object({})), // Dynamic field responses
    }))),

    // SPECIAL HANDLING
    special_requests: v.optional(v.string()),
    dietary_requirements: v.optional(v.string()),
    accessibility_needs: v.optional(v.string()),

    // BILLING & SHIPPING ADDRESSES (for product purchases)
    billing_address: v.optional(v.object({
      first_name: v.string(),
      last_name: v.string(),
      company: v.optional(v.string()),
      address_line_1: v.string(),
      address_line_2: v.optional(v.string()),
      city: v.string(),
      state_province: v.string(),
      postal_code: v.string(),
      country: v.string(),
      phone: v.optional(v.string()),
    })),
    shipping_address: v.optional(v.object({
      first_name: v.string(),
      last_name: v.string(),
      company: v.optional(v.string()),
      address_line_1: v.string(),
      address_line_2: v.optional(v.string()),
      city: v.string(),
      state_province: v.string(),
      postal_code: v.string(),
      country: v.string(),
      phone: v.optional(v.string()),
    })),
    same_as_billing: v.optional(v.boolean()), // If shipping address is same as billing
    
    // SHIPPING & FULFILLMENT
    has_shipped_items: v.optional(v.boolean()), // True if any items require shipping
    total_shipping_cost: v.optional(v.number()), // Total additional shipping charges
    estimated_delivery_date: v.optional(v.number()),

    // COMMUNICATION
    confirmation_sent: v.optional(v.boolean()),
    reminder_sent: v.optional(v.boolean()),

    // REFUNDS & MODIFICATIONS
    refund_amount: v.optional(v.number()),
    refund_reason: v.optional(v.string()),
    refunded_at: v.optional(v.number()),

    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
    confirmed_at: v.optional(v.number()),
  })
    .index("by_booking_number", ["booking_number"])
    .index("by_event", ["event_id"])
    .index("by_customer", ["customer_id"])
    .index("by_status", ["status"])
    .index("by_payment_status", ["payment_status"])
    .index("by_booking_type", ["booking_type"])
    .index("by_created_at", ["created_at"])
    .index("by_event_and_customer", ["event_id", "customer_id"])
    .index("by_has_shipped_items", ["has_shipped_items"])
    .searchIndex("search_bookings", {
      searchField: "booking_number",
      filterFields: ["status", "payment_status", "booking_type"]
    }),

  // ============================================================================
  // QUEUE & WAITING LIST MANAGEMENT 
  // ============================================================================

  waiting_list: defineTable({
    event_id: v.id("events"),
    user_id: v.id("users"), // Links to Convex Auth users table
    ticket_category_id: v.id("ticket_categories"), // Specific ticket category for queue

    // QUEUE POSITION & PRIORITY
    position: v.number(), // Position in queue (1 = first in line)
    priority_score: v.optional(v.number()), // For VIP or special handling

    // TICKET REQUIREMENTS
    requested_quantity: v.number(), // How many tickets they want
    max_price: v.optional(v.number()), // Maximum price they're willing to pay

    // CONTACT INFO 
    email: v.string(),
    phone: v.optional(v.string()),

    // QUEUE STATUS
    status: v.union(
      v.literal("waiting"),           // In queue, waiting for turn
      v.literal("offered"),          // Offered tickets, timer running
      v.literal("purchasing"),       // User is completing purchase
      v.literal("converted"),        // Successfully purchased
      v.literal("expired"),          // Offer expired
      v.literal("declined"),         // User declined offer
      v.literal("removed"),          // Manually removed from queue
      v.literal("cancelled")         // User cancelled their position
    ),

    // OFFER MANAGEMENT
    offered_at: v.optional(v.number()),         // When tickets were offered
    offer_expires_at: v.optional(v.number()),   // When offer expires (15 min timer)
    offered_quantity: v.optional(v.number()),   // How many tickets offered (may be less than requested)
    offered_price: v.optional(v.number()),      // Price at time of offer

    // PURCHASE TRACKING
    purchase_session_id: v.optional(v.string()), // Track purchase session
    purchase_started_at: v.optional(v.number()),
    purchase_timeout_at: v.optional(v.number()), // Timeout for completing purchase

    // NOTIFICATIONS & COMMUNICATION
    notified_at: v.optional(v.number()),
    notification_attempts: v.optional(v.number()),
    last_notification_sent: v.optional(v.number()),
    notification_preferences: v.optional(v.object({
      email: v.optional(v.boolean()),
      sms: v.optional(v.boolean()),
      push: v.optional(v.boolean()),
    })),

    // FRAUD PREVENTION
    ip_address: v.optional(v.string()),
    user_agent: v.optional(v.string()),
    is_suspicious: v.optional(v.boolean()),

    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_event", ["event_id"])
    .index("by_user", ["user_id"])
    .index("by_ticket_category", ["ticket_category_id"])
    .index("by_queue_position", ["ticket_category_id", "status", "position"])
    .index("by_status", ["status"])
    .index("by_expiry", ["offer_expires_at"])
    .index("by_created_at", ["created_at"]),

  // ============================================================================
  // TICKET RESERVATIONS (Short-term holds during purchase process)
  // ============================================================================

  ticket_reservations: defineTable({
    // RESERVATION DETAILS
    event_id: v.id("events"),
    ticket_category_id: v.id("ticket_categories"),
    user_id: v.optional(v.id("users")), // May be anonymous during initial selection
    session_id: v.string(), // Browser/app session ID

    // QUANTITY & TIMING
    quantity: v.number(),
    reserved_at: v.number(),
    expires_at: v.number(), // Short expiry (5-15 minutes)

    // RESERVATION SOURCE
    source: v.union(
      v.literal("queue_offer"),     // From waiting list offer
      v.literal("direct_purchase"), // Direct ticket selection
      v.literal("admin_hold")       // Admin reserved tickets
    ),
    waiting_list_id: v.optional(v.id("waiting_list")), // If from queue

    // STATUS
    status: v.union(
      v.literal("active"),    // Currently reserved
      v.literal("expired"),   // Reservation expired
      v.literal("converted"), // Successfully purchased
      v.literal("released")   // Manually released
    ),

    // METADATA
    price_locked: v.optional(v.number()), // Lock price during reservation
    metadata: v.optional(v.object({})),   // Additional data

    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_session", ["session_id"])
    .index("by_user", ["user_id"])
    .index("by_ticket_category", ["ticket_category_id"])
    .index("by_expiry", ["expires_at"])
    .index("by_status", ["status"])
    .index("by_waiting_list", ["waiting_list_id"]),

  // ============================================================================
  // PRODUCTS & MARKETPLACE
  // ============================================================================

  products: defineTable({
    // BASIC PRODUCT INFO
    name: v.string(),
    description: v.string(),
    short_description: v.optional(v.string()),
    organizer_id: v.id("organizer_profiles"),

    // PRODUCT CLASSIFICATION
    category: v.union(
      v.literal("merchandise"),
      v.literal("add_on"),
      v.literal("upgrade"),
      v.literal("service"),
      v.literal("digital"),
      v.literal("food_beverage")
    ),
    subcategory: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),

    // PRICING
    base_price: v.number(),
    currency: v.string(),
    pricing_type: v.union(v.literal("fixed"), v.literal("variable"), v.literal("donation")),

    // VARIANTS & OPTIONS
    has_variants: v.boolean(),
    variants: v.optional(v.array(v.object({
      variant_id: v.string(),
      name: v.string(), // "Size", "Color", "Type"
      options: v.array(v.object({
        option_id: v.string(),
        label: v.string(), // "Large", "Red", "Premium"
        price_modifier: v.number(), // Additional cost (can be negative)
        sku: v.optional(v.string()),
        stock_quantity: v.optional(v.number()),
      })),
      required: v.boolean(),
    }))),

    // INVENTORY & AVAILABILITY
    track_inventory: v.boolean(),
    stock_quantity: v.optional(v.number()),
    low_stock_threshold: v.optional(v.number()),
    allow_backorders: v.optional(v.boolean()),

    // MEDIA
    images: v.optional(v.array(v.id("_storage"))),
    featured_image_storage_id: v.optional(v.id("_storage")),

    // AVAILABILITY & ASSOCIATIONS
    is_active: v.boolean(),
    is_featured: v.optional(v.boolean()),

    // PRODUCT SCOPE
    product_scope: v.union(
      v.literal("store_only"), // Available in organizer's store only
      v.literal("event_bundled"), // Can be bundled with event tickets
      v.literal("both") // Available in both store and for event bundling
    ),
    available_events: v.optional(v.array(v.id("events"))), // null means available for all events when scope allows

    // FULFILLMENT OPTIONS
    // Products can support "pickup", "shipping", or both - customer chooses during checkout
    supported_fulfillment_types: v.array(v.union(
      v.literal("pickup"),         // Customer pickup at specified locations
      v.literal("shipping")        // Shipped to customer address (with additional charge)
    )),
    
    // SHIPPING CONFIGURATION
    shipping_cost: v.optional(v.number()), // Additional charge for shipping in cents
    shipping_estimated_days: v.optional(v.object({
      min: v.number(),
      max: v.number(),
    })),
    shipping_zones: v.optional(v.array(v.object({
      zone_name: v.string(), // "Kuala Lumpur", "Selangor", "International", etc.
      postcodes: v.optional(v.array(v.string())), // Specific postcodes covered
      countries: v.optional(v.array(v.string())), // For international shipping
      shipping_cost: v.number(), // Zone-specific shipping cost
      estimated_days: v.object({
        min: v.number(),
        max: v.number(),
      }),
    }))),

    // PICKUP CONFIGURATION
    pickup_locations: v.optional(v.array(v.object({
      location_id: v.string(),
      name: v.string(), // "Main Office", "Event Venue"
      address: v.object({
        address_line_1: v.string(),
        address_line_2: v.optional(v.string()),
        city: v.string(),
        state_province: v.string(),
        postal_code: v.string(),
        country: v.string(),
      }),
      pickup_hours: v.optional(v.object({
        monday: v.optional(v.string()),
        tuesday: v.optional(v.string()),
        wednesday: v.optional(v.string()),
        thursday: v.optional(v.string()),
        friday: v.optional(v.string()),
        saturday: v.optional(v.string()),
        sunday: v.optional(v.string()),
      })),
      instructions: v.optional(v.string()),
      is_default: v.optional(v.boolean()),
    }))),

    // PHYSICAL PROPERTIES
    weight: v.optional(v.number()),
    dimensions: v.optional(v.object({
      length: v.number(),
      width: v.number(),
      height: v.number(),
      unit: v.string(),
    })),

    // SEO & MARKETING
    seo_title: v.optional(v.string()),
    seo_description: v.optional(v.string()),

    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_organizer", ["organizer_id"])
    .index("by_category", ["category"])
    .index("by_status", ["is_active"])
    .index("by_featured", ["is_featured"])
    .index("by_scope", ["product_scope"])
    .index("by_fulfillment_types", ["supported_fulfillment_types"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["category", "is_active", "product_scope"]
    }),

  // ============================================================================
  // SHIPPING TRACKING & LOGISTICS
  // ============================================================================
  
  shipping_tracking: defineTable({
    // REFERENCE INFORMATION
    booking_id: v.id("bookings"),
    tracking_number: v.string(),
    carrier: v.string(), // "Pos Malaysia", "DHL", "FedEx", "J&T"
    
    // SHIPPING DETAILS
    origin_address: v.object({
      city: v.string(),
      state_province: v.string(),
      postal_code: v.string(),
      country: v.string(),
    }),
    destination_address: v.object({
      city: v.string(),
      state_province: v.string(),
      postal_code: v.string(),
      country: v.string(),
    }),
    
    // STATUS & TIMELINE
    status: v.union(
      v.literal("label_created"),
      v.literal("picked_up"),
      v.literal("in_transit"),
      v.literal("out_for_delivery"),
      v.literal("delivered"),
      v.literal("exception"),
      v.literal("returned")
    ),
    estimated_delivery_date: v.optional(v.number()),
    actual_delivery_date: v.optional(v.number()),
    
    // TRACKING EVENTS
    tracking_events: v.optional(v.array(v.object({
      timestamp: v.number(),
      status: v.string(),
      location: v.optional(v.string()),
      description: v.string(),
    }))),
    
    // PACKAGE INFORMATION
    weight: v.optional(v.number()),
    dimensions: v.optional(v.object({
      length: v.number(),
      width: v.number(),
      height: v.number(),
      unit: v.string(),
    })),
    
    // DELIVERY CONFIRMATION
    signature_required: v.optional(v.boolean()),
    delivered_to: v.optional(v.string()),
    delivery_photo_storage_id: v.optional(v.id("_storage")),
    
    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_booking", ["booking_id"])
    .index("by_tracking_number", ["tracking_number"])
    .index("by_carrier", ["carrier"])
    .index("by_status", ["status"])
    .index("by_delivery_date", ["estimated_delivery_date"]),

  // ============================================================================
  // NOTIFICATIONS & COMMUNICATIONS
  // ============================================================================

  notifications: defineTable({
    // RECIPIENT INFORMATION
    user_id: v.id("users"), // Links to Convex Auth users table

    // NOTIFICATION CONTENT
    type: v.union(
      v.literal("booking_confirmation"),
      v.literal("payment_success"),
      v.literal("payment_failed"),
      v.literal("event_reminder"),
      v.literal("event_update"),
      v.literal("event_cancelled"),
      v.literal("waitlist_available"),
      v.literal("refund_processed"),
      v.literal("shipping_confirmation"),
      v.literal("item_shipped"),
      v.literal("item_delivered"),
      v.literal("ready_for_pickup"),
      v.literal("system_announcement")
    ),
    title: v.string(),
    message: v.string(),

    // CONTEXT & LINKS
    related_event_id: v.optional(v.id("events")),
    related_booking_id: v.optional(v.id("bookings")),
    action_url: v.optional(v.string()),

    // COMMUNICATION CHANNELS
    channels: v.array(v.union(v.literal("in_app"), v.literal("email"), v.literal("sms"), v.literal("push"))),

    // STATUS TRACKING
    status: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed"), v.literal("read")),
    read_at: v.optional(v.number()),

    // EMAIL SPECIFIC
    email_sent: v.optional(v.boolean()),
    email_opened: v.optional(v.boolean()),
    email_clicked: v.optional(v.boolean()),

    // SCHEDULING
    scheduled_for: v.optional(v.number()), // For scheduled notifications

    // TIMESTAMPS
    created_at: v.number(),
    sent_at: v.optional(v.number()),
  })
    .index("by_user", ["user_id"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_event", ["related_event_id"]),

  // ============================================================================
  // REVIEWS & RATINGS
  // ============================================================================

  reviews: defineTable({
    // REVIEW CONTEXT
    event_id: v.id("events"),
    reviewer_id: v.id("users"), // Links to Convex Auth users table
    booking_id: v.optional(v.id("bookings")), // Link to actual attendance

    // RATING & CONTENT
    overall_rating: v.number(), // 1-5 stars
    ratings_breakdown: v.optional(v.object({
      venue: v.optional(v.number()),
      organization: v.optional(v.number()),
      value_for_money: v.optional(v.number()),
      content_quality: v.optional(v.number()),
    })),

    // REVIEW CONTENT
    title: v.optional(v.string()),
    content: v.string(),
    pros: v.optional(v.string()),
    cons: v.optional(v.string()),

    // VERIFICATION & MODERATION
    is_verified_attendee: v.boolean(), // Did they actually attend?
    moderation_status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    moderation_reason: v.optional(v.string()),

    // INTERACTION
    helpful_votes: v.optional(v.number()),
    total_votes: v.optional(v.number()),

    // RESPONSE FROM ORGANIZER
    organizer_response: v.optional(v.object({
      content: v.string(),
      responded_at: v.number(),
    })),

    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_event", ["event_id"])
    .index("by_reviewer", ["reviewer_id"])
    .index("by_rating", ["overall_rating"])
    .index("by_status", ["moderation_status"]),

  // ============================================================================
  // ANALYTICS & INSIGHTS
  // ============================================================================

  analytics_events: defineTable({
    // EVENT TRACKING
    event_type: v.union(
      v.literal("page_view"),
      v.literal("event_view"),
      v.literal("ticket_add_to_cart"),
      v.literal("booking_started"),
      v.literal("booking_completed"),
      v.literal("booking_abandoned"),
      v.literal("search_performed"),
      v.literal("filter_applied"),
      v.literal("share_event"),
      v.literal("waitlist_joined")
    ),

    // CONTEXT
    user_id: v.optional(v.id("users")),
    session_id: v.optional(v.string()),
    event_id: v.optional(v.id("events")),

    // EVENT PROPERTIES
    properties: v.optional(v.object({
      page_url: v.optional(v.string()),
      referrer: v.optional(v.string()),
      user_agent: v.optional(v.string()),
      device_type: v.optional(v.string()),
      browser: v.optional(v.string()),
      location: v.optional(v.object({
        country: v.optional(v.string()),
        region: v.optional(v.string()),
        city: v.optional(v.string()),
      })),
    })),

    // CONVERSION TRACKING
    value: v.optional(v.number()), // For revenue tracking
    currency: v.optional(v.string()),

    // TIMESTAMP
    timestamp: v.number(),
  })
    .index("by_event_type", ["event_type"])
    .index("by_user", ["user_id"])
    .index("by_event", ["event_id"])
    .index("by_timestamp", ["timestamp"]),

  // ============================================================================
  // SYSTEM CONFIGURATION & SETTINGS
  // ============================================================================

  system_settings: defineTable({
    key: v.string(),
    value: v.union(v.string(), v.number(), v.boolean(), v.object({})),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    is_public: v.boolean(), // Can be accessed by frontend

    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_key", ["key"])
    .index("by_category", ["category"]),

  // ============================================================================
  // AUDIT LOGS & SECURITY
  // ============================================================================

  audit_logs: defineTable({
    // ACTOR INFORMATION
    user_id: v.optional(v.id("users")),
    actor_type: v.union(v.literal("user"), v.literal("system"), v.literal("admin")),
    actor_ip: v.optional(v.string()),

    // ACTION DETAILS
    action: v.string(), // "create_event", "update_booking", "delete_user", etc.
    resource_type: v.string(), // "event", "booking", "user", etc.
    resource_id: v.optional(v.string()),

    // CHANGE TRACKING
    old_values: v.optional(v.object({})),
    new_values: v.optional(v.object({})),

    // CONTEXT
    description: v.optional(v.string()),
    metadata: v.optional(v.object({})),

    // TIMESTAMP
    timestamp: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_action", ["action"])
    .index("by_resource", ["resource_type", "resource_id"])
    .index("by_timestamp", ["timestamp"]),

  // ============================================================================
  // ADMIN MODERATION & VALIDATION SYSTEM
  // ============================================================================

  admin_moderation_logs: defineTable({
    // EVENT BEING MODERATED
    event_id: v.id("events"),

    // ADMIN DETAILS
    admin_id: v.id("users"), // Links to Convex Auth users table (admin user)
    admin_name: v.string(), // Cached admin name for quick display

    // MODERATION ACTION
    action: v.union(
      v.literal("submitted_for_review"),   // Event submitted by organizer
      v.literal("reviewed"),               // Admin reviewed (approved/rejected)
      v.literal("approved"),               // Admin approved event
      v.literal("rejected"),               // Admin rejected event 
      v.literal("requested_changes"),      // Admin requested changes
      v.literal("escalated"),              // Escalated to higher admin
      v.literal("auto_approved"),          // System auto-approved (low risk)
      v.literal("auto_rejected")           // System auto-rejected (high risk)
    ),

    // REVIEW DETAILS
    previous_status: v.optional(v.string()),
    new_status: v.string(),
    fraud_score_at_review: v.optional(v.number()),
    risk_factors_at_review: v.optional(v.array(v.string())),

    // ADMIN DECISION
    decision_reason: v.optional(v.string()),
    admin_notes: v.optional(v.string()),
    rejection_category: v.optional(v.union(
      v.literal("inappropriate_content"),
      v.literal("misleading_information"),
      v.literal("duplicate_event"),
      v.literal("pricing_issues"),
      v.literal("venue_problems"),
      v.literal("legal_concerns"),
      v.literal("fraud_suspected"),
      v.literal("incomplete_information"),
      v.literal("policy_violation")
    )),

    // ORGANIZER RESPONSE (if applicable)
    organizer_responded: v.optional(v.boolean()),
    organizer_response: v.optional(v.string()),
    organizer_response_at: v.optional(v.number()),

    // SYSTEM FLAGS & AUTOMATION
    is_automated_decision: v.boolean(),
    system_confidence: v.optional(v.number()), // 0-100 confidence in automated decision
    requires_escalation: v.optional(v.boolean()),
    escalated_to_admin_id: v.optional(v.id("users")),

    // PERFORMANCE TRACKING
    review_duration_seconds: v.optional(v.number()), // How long admin took to review

    // APPEAL PROCESS
    appeal_submitted: v.optional(v.boolean()),
    appeal_reason: v.optional(v.string()),
    appeal_submitted_at: v.optional(v.number()),
    appeal_resolved: v.optional(v.boolean()),
    appeal_resolution: v.optional(v.string()),

    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_event", ["event_id"])
    .index("by_admin", ["admin_id"])
    .index("by_action", ["action"])
    .index("by_status", ["new_status"])
    .index("by_created_at", ["created_at"])
    .index("by_fraud_score", ["fraud_score_at_review"])
    .index("by_pending_review", ["action", "created_at"])
    .index("by_escalation", ["requires_escalation", "escalated_to_admin_id"]),

  // ============================================================================
  // EVENT TEMPLATES & SERIES MANAGEMENT
  // ============================================================================
  
  event_templates: defineTable({
    organizer_id: v.id("organizer_profiles"),
    template_name: v.string(),
    description: v.optional(v.string()),
    template_data: v.object({}), // Serialized event data
    category: v.optional(v.string()),
    is_public: v.boolean(), // Can other organizers use this template
    usage_count: v.optional(v.number()),
    
    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_organizer", ["organizer_id"])
    .index("by_category", ["category"])
    .index("by_public", ["is_public"]),

  event_series: defineTable({
    series_name: v.string(),
    organizer_id: v.id("organizer_profiles"),
    description: v.optional(v.string()),
    event_ids: v.array(v.id("events")),
    series_discount_percentage: v.optional(v.number()),
    is_active: v.boolean(),
    
    // TIMESTAMPS  
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_organizer", ["organizer_id"])
    .index("by_status", ["is_active"]),

  // ============================================================================
  // SOCIAL FEATURES & COMMUNITY
  // ============================================================================
  
  event_followers: defineTable({
    event_id: v.id("events"),
    user_id: v.id("users"),
    notification_preferences: v.object({
      event_updates: v.optional(v.boolean()),
      price_changes: v.optional(v.boolean()),
      availability_alerts: v.optional(v.boolean()),
    }),
    
    // TIMESTAMPS
    created_at: v.number(),
  })
    .index("by_event", ["event_id"])
    .index("by_user", ["user_id"])
    .index("by_event_and_user", ["event_id", "user_id"]),

  event_shares: defineTable({
    event_id: v.id("events"),
    user_id: v.optional(v.id("users")), // Optional for anonymous shares
    platform: v.union(
      v.literal("facebook"),
      v.literal("twitter"), 
      v.literal("whatsapp"),
      v.literal("telegram"),
      v.literal("email"),
      v.literal("copy_link")
    ),
    referrer_url: v.optional(v.string()),
    
    // TIMESTAMPS
    shared_at: v.number(),
  })
    .index("by_event", ["event_id"])
    .index("by_user", ["user_id"])
    .index("by_platform", ["platform"])
    .index("by_shared_at", ["shared_at"]),

  user_event_interactions: defineTable({
    user_id: v.id("users"),
    event_id: v.id("events"),
    interaction_type: v.union(
      v.literal("viewed"),
      v.literal("liked"),
      v.literal("shared"),
      v.literal("bookmarked"),
      v.literal("attended"),
      v.literal("reviewed")
    ),
    metadata: v.optional(v.object({})), // Additional interaction data
    
    // TIMESTAMPS
    timestamp: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_event", ["event_id"])
    .index("by_interaction_type", ["interaction_type"])
    .index("by_user_and_event", ["user_id", "event_id"]),

  // ============================================================================
  // ACCESSIBILITY & COMPLIANCE
  // ============================================================================
  
  accessibility_requests: defineTable({
    booking_id: v.id("bookings"),
    user_id: v.id("users"),
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
    status: v.union(
      v.literal("requested"),
      v.literal("under_review"),
      v.literal("approved"),
      v.literal("denied"),
      v.literal("fulfilled")
    ),
    organizer_response: v.optional(v.string()),
    
    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_booking", ["booking_id"])
    .index("by_user", ["user_id"])
    .index("by_event", ["event_id"])
    .index("by_status", ["status"]),

  data_processing_consents: defineTable({
    user_id: v.id("users"),
    consent_type: v.union(
      v.literal("marketing_emails"),
      v.literal("analytics_tracking"),
      v.literal("personalized_ads"),
      v.literal("data_sharing_partners"),
      v.literal("location_tracking")
    ),
    consented: v.boolean(),
    consent_method: v.union(v.literal("checkbox"), v.literal("opt_in"), v.literal("implicit")),
    consent_date: v.number(),
    ip_address: v.string(),
    user_agent: v.optional(v.string()),
    
    // TIMESTAMPS
    created_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_consent_type", ["consent_type"])
    .index("by_consent_date", ["consent_date"]),

  // ============================================================================
  // ADVANCED TICKETING FEATURES  
  // ============================================================================
  
  ticket_transfers: defineTable({
    original_booking_id: v.id("bookings"),
    from_user_id: v.id("users"),
    to_user_id: v.id("users"),
    to_email: v.string(), // Email of recipient
    transfer_reason: v.optional(v.string()),
    transfer_fee: v.optional(v.number()),
    verification_code: v.string(), // For security
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    expires_at: v.number(),
    
    // TIMESTAMPS
    created_at: v.number(),
    completed_at: v.optional(v.number()),
  })
    .index("by_original_booking", ["original_booking_id"])
    .index("by_from_user", ["from_user_id"])
    .index("by_to_user", ["to_user_id"])
    .index("by_status", ["status"])
    .index("by_verification_code", ["verification_code"]),

  group_bookings: defineTable({
    event_id: v.id("events"),
    group_leader_id: v.id("users"),
    group_name: v.string(),
    min_tickets: v.number(),
    max_tickets: v.optional(v.number()),
    discount_percentage: v.number(),
    current_bookings: v.optional(v.number()),
    member_booking_ids: v.array(v.id("bookings")),
    invite_code: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    expires_at: v.optional(v.number()),
    
    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_event", ["event_id"])
    .index("by_group_leader", ["group_leader_id"])
    .index("by_invite_code", ["invite_code"])
    .index("by_status", ["status"]),

  // ============================================================================
  // MOBILE APP & DEVICE MANAGEMENT
  // ============================================================================
  
  push_notification_tokens: defineTable({
    user_id: v.id("users"),
    token: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android"), v.literal("web")),
    device_info: v.optional(v.object({
      device_id: v.optional(v.string()),
      app_version: v.optional(v.string()),
      os_version: v.optional(v.string()),
    })),
    is_active: v.boolean(),
    last_used: v.number(),
    
    // TIMESTAMPS
    created_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_token", ["token"])
    .index("by_platform", ["platform"])
    .index("by_active", ["is_active"]),

  offline_ticket_cache: defineTable({
    booking_id: v.id("bookings"),
    user_id: v.id("users"),
    ticket_data: v.object({
      qr_code: v.string(),
      event_details: v.object({}),
      venue_info: v.object({}),
    }),
    download_count: v.optional(v.number()),
    last_synced: v.number(),
    cache_expires_at: v.number(),
    
    // TIMESTAMPS
    created_at: v.number(),
  })
    .index("by_booking", ["booking_id"])
    .index("by_user", ["user_id"])
    .index("by_expires_at", ["cache_expires_at"]),

});
