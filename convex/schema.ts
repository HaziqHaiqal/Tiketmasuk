import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  // Users table - main user authentication data (managed by Convex Auth)
  // Note: Convex Auth automatically creates and manages the users table
  // We'll extend it with additional fields using the authTables
  
  // Customer profiles - separate table for customer-specific data
  customer_profiles: defineTable({
    user_id: v.string(), // User ID from Convex Auth
    full_name: v.string(),
    phone: v.optional(v.string()),
    date_of_birth: v.optional(v.string()),
    gender: v.optional(v.string()),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    address: v.optional(v.string()),
    postcode: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_user_id", ["user_id"]),

  // Organizer profiles - flexible structure for all types of organizers
  organizer_profiles: defineTable({
    user_id: v.string(), // User ID from Convex Auth
    
    // REQUIRED FIELDS - Essential for all organizers
    display_name: v.string(), // Public name shown to customers (e.g., "John's Events", "Music Lovers Club")
    full_name: v.string(), // Organizer's real full name
    phone: v.optional(v.string()), // Contact phone number - optional initially
    
    // STORE/BRAND INFORMATION
    store_name: v.string(), // Their store/brand name for selling products
    store_description: v.optional(v.string()), // What they do, their story
    
    // PROFILE & BRANDING IMAGES
    profile_image_storage_id: v.optional(v.id("_storage")), // Main profile picture/avatar (circular)
    store_logo_storage_id: v.optional(v.id("_storage")), // Store logo (for events & products)
    store_banner_storage_id: v.optional(v.id("_storage")), // Store banner/cover image
    
    // IMAGE METADATA (for better management)
    images: v.optional(v.object({
      profile_image: v.optional(v.object({
        storage_id: v.id("_storage"),
        filename: v.string(),
        size: v.number(), // in bytes
        uploaded_at: v.number(),
      })),
      store_logo: v.optional(v.object({
        storage_id: v.id("_storage"),
        filename: v.string(),
        size: v.number(),
        uploaded_at: v.number(),
      })),
      store_banner: v.optional(v.object({
        storage_id: v.id("_storage"),
        filename: v.string(),
        size: v.number(),
        uploaded_at: v.number(),
      })),
    })),
    
    // ORGANIZER TYPE & CATEGORY
    organizer_type: v.union(
      v.literal("individual"), // Solo organizer
      v.literal("group"), // Informal group/club
      v.literal("organization"), // NGO, association
      v.literal("business") // Registered business
    ),
    event_categories: v.optional(v.array(v.string())), // Types of events they organize
    
    // OPTIONAL BUSINESS DETAILS (only for those who have them)
    business_registration: v.optional(v.string()), // Only if they have one
    business_name: v.optional(v.string()), // Official business name if different from display_name
    tax_id: v.optional(v.string()), // For tax purposes if applicable
    
    // LOCATION & REACH
    primary_location: v.string(), // City/State where they primarily operate
    service_areas: v.optional(v.array(v.string())), // Areas they serve
    
    // SOCIAL & WEB PRESENCE
    website: v.optional(v.string()),
    social_media: v.optional(v.object({
      facebook: v.optional(v.string()),
      instagram: v.optional(v.string()),
      twitter: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      youtube: v.optional(v.string()),
    })),
    
    // VERIFICATION & STATUS
    verification_status: v.union(
      v.literal("unverified"), // Just registered
      v.literal("pending"), // Submitted for verification
      v.literal("verified"), // Verified organizer
      v.literal("premium") // Premium verified organizer
    ),
    verification_documents: v.optional(v.array(v.id("_storage"))), // ID, business docs, etc.
    
    // ACCOUNT STATUS
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("suspended"),
      v.literal("banned")
    ),
    
    // SETTINGS & PREFERENCES
    settings: v.optional(v.object({
      auto_approve_events: v.optional(v.boolean()), // Auto-publish events or require review
      allow_reviews: v.optional(v.boolean()), // Allow customer reviews
      public_contact_info: v.optional(v.boolean()), // Show contact info publicly
      newsletter_enabled: v.optional(v.boolean()), // Send marketing emails
    })),
    
    // STATISTICS (for dashboard)
    stats: v.optional(v.object({
      total_events: v.optional(v.number()),
      total_tickets_sold: v.optional(v.number()),
      total_revenue: v.optional(v.number()), // in cents
      average_rating: v.optional(v.number()),
      total_reviews: v.optional(v.number()),
    })),
    
    // TIMESTAMPS
    created_at: v.number(),
    updated_at: v.optional(v.number()),
    last_active_at: v.optional(v.number()),
  })
    .index("by_user_id", ["user_id"])
    .index("by_status", ["status"])
    .index("by_verification_status", ["verification_status"])
    .index("by_organizer_type", ["organizer_type"])
    .index("by_primary_location", ["primary_location"]),

  // Events table with embedded categories and pricing tiers
  events: defineTable({
    name: v.string(),
    description: v.string(),
    location: v.string(),
    event_date: v.number(),
    organizer_id: v.id("organizer_profiles"),
    image_storage_id: v.optional(v.id("_storage")),
    is_published: v.boolean(),
    is_cancelled: v.optional(v.boolean()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
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
  })
    .index("by_status", ["is_published"])
    .index("by_organizer", ["organizer_id"])
    .index("by_date", ["event_date"]),

  // Bookings table with embedded items (no more booking_items table)
  bookings: defineTable({
    organizer_id: v.id("organizer_profiles"),
    event_id: v.id("events"),
    customer_profile_id: v.id("customer_profiles"),
    booking_reference: v.string(),
    
    // Embedded booking items
    booking_details: v.array(v.object({
      category_id: v.string(),
      pricing_tier_id: v.string(),
      quantity: v.number(),
      unit_price: v.number(), // in cents
      total_price: v.number(), // in cents
    })),
    
    // Booking amounts
    subtotal: v.number(),
    discount_amount: v.optional(v.number()),
    service_fee: v.optional(v.number()),
    total_amount: v.number(),
    currency: v.string(),
    
    // Booking status
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    
    // Promo code applied
    promo_code_id: v.optional(v.id("promo_codes")),
    promo_code_used: v.optional(v.string()),
    
    // Additional info
    special_requests: v.optional(v.string()),
    booking_notes: v.optional(v.string()),
    metadata: v.optional(v.string()),
    
    // Timestamps
    expires_at: v.optional(v.number()),
    confirmed_at: v.optional(v.number()),
    cancelled_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_customer", ["customer_profile_id"])
    .index("by_event", ["event_id"])
    .index("by_organizer", ["organizer_id"])
    .index("by_status", ["status"])
    .index("by_reference", ["booking_reference"])
    .index("by_organizer_event", ["organizer_id", "event_id"]),

  // Products table
  products: defineTable({
    organizer_id: v.id("organizer_profiles"),
    event_id: v.optional(v.id("events")),
    name: v.string(),
    description: v.string(),
    base_price: v.number(),
    category: v.string(),
    product_type: v.union(
      v.literal("event-essential"),
      v.literal("merchandise")
    ),
    variants: v.array(v.object({
      id: v.string(),
      name: v.string(),
      options: v.array(v.object({
        id: v.string(),
        label: v.string(),
        price_modifier: v.number(),
        quantity: v.number(),
        available_quantity: v.number(),
        is_available: v.boolean(),
      })),
      is_required: v.boolean(),
    })),
    default_quantity: v.number(),
    max_quantity_per_ticket: v.number(),
    image_storage_id: v.optional(v.id("_storage")),
    is_active: v.boolean(),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_organizer", ["organizer_id"])
    .index("by_event", ["event_id"])
    .index("by_category", ["category"])
    .index("by_type", ["product_type"]),

  // Tickets table (removed booking_item_id reference)
  tickets: defineTable({
    booking_id: v.id("bookings"),
    event_id: v.id("events"),
    ticket_number: v.string(),
    category_id: v.string(),
    category_name: v.string(),
    pricing_tier_id: v.string(),
    pricing_tier_name: v.string(),
    holder_name: v.string(),
    holder_email: v.string(),
    holder_phone: v.optional(v.string()),
    status: v.union(
      v.literal("issued"),
      v.literal("valid"),
      v.literal("used"),
      v.literal("refunded"),
      v.literal("cancelled")
    ),
    qr_code: v.optional(v.string()),
    checked_in: v.boolean(),
    checked_in_at: v.optional(v.number()),
    checked_in_by: v.optional(v.string()),
    issued_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_booking", ["booking_id"])
    .index("by_event", ["event_id"])
    .index("by_holder_email", ["holder_email"])
    .index("by_ticket_number", ["ticket_number"]),

  // Waiting List table
  waiting_list: defineTable({
    event_id: v.id("events"),
    user_id: v.string(), // User ID from Convex Auth
    category_id: v.string(),
    quantity: v.number(),
    status: v.union(
      v.literal("waiting"),
      v.literal("offered"),
      v.literal("expired"),
      v.literal("purchased"),
      v.literal("cancelled")
    ),
    position: v.number(),
    joined_at: v.number(),
    offer_expires_at: v.optional(v.number()),
    updated_at: v.optional(v.number()),
    product_selections: v.optional(v.array(v.object({
      product_id: v.id("products"),
      quantity: v.number(),
      selected_variants: v.array(v.object({
        variant_id: v.string(),
        option_id: v.string(),
      })),
    }))),
  })
    .index("by_event", ["event_id"])
    .index("by_user", ["user_id"])
    .index("by_event_user", ["event_id", "user_id"])
    .index("by_status", ["status"])
    .index("by_position", ["position"]),

  // Promo Codes table
  promo_codes: defineTable({
    organizer_id: v.id("organizer_profiles"),
    event_id: v.optional(v.id("events")),
    product_id: v.optional(v.id("products")),
    code: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    discount_type: v.union(
      v.literal("percentage"),
      v.literal("fixed_amount"),
      v.literal("free_shipping")
    ),
    discount_value: v.number(),
    minimum_purchase: v.optional(v.number()),
    usage_limit: v.optional(v.number()),
    usage_limit_per_user: v.optional(v.number()),
    usage_count: v.number(),
    valid_from: v.number(),
    valid_until: v.number(),
    is_active: v.boolean(),
    applicable_categories: v.optional(v.array(v.string())),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_organizer", ["organizer_id"])
    .index("by_event", ["event_id"])
    .index("by_product", ["product_id"])
    .index("by_code", ["code"])
    .index("by_active", ["is_active"]),

  // Promo Code Usage tracking
  promo_code_usage: defineTable({
    promo_code_id: v.id("promo_codes"),
    user_id: v.string(), // User ID from Convex Auth
    booking_id: v.optional(v.id("bookings")),
    discount_amount: v.number(),
    used_at: v.number(),
  })
    .index("by_promo_code", ["promo_code_id"])
    .index("by_user", ["user_id"])
    .index("by_booking", ["booking_id"]),

  // Payments table
  payments: defineTable({
    id: v.string(),
    booking_id: v.id("bookings"),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    payment_method: v.optional(v.string()),
    transaction_reference: v.optional(v.string()),
    payment_response: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_booking", ["booking_id"])
    .index("by_status", ["status"])
    .index("by_payment_id", ["id"])
    .index("by_transaction_reference", ["transaction_reference"]),
});
