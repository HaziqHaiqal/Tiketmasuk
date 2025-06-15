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

  // Organizer profiles - separate table for organizer-specific data (like public.management_profiles)
  organizer_profiles: defineTable({
    user_id: v.string(), // User ID from Convex Auth
    contact_name: v.string(),
    business_name: v.string(),
    business_registration: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
    logo_storage_id: v.optional(v.id("_storage")),
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("suspended")),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_user_id", ["user_id"])
    .index("by_status", ["status"]),

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
