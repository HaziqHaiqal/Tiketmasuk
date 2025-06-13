import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - consistent with Clerk user management
  users: defineTable({
    user_id: v.string(), // Clerk user ID
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_user_id", ["user_id"])
    .index("by_email", ["email"]),

  // Vendors table - event organizers
  vendors: defineTable({
    user_id: v.string(), // Clerk user ID of the vendor
    business_name: v.string(),
    contact_name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("pending"),
      v.literal("suspended"),
      v.literal("inactive")
    ),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_user_id", ["user_id"])
    .index("by_status", ["status"])
    .index("by_email", ["email"]),

  // Events table - main events
  events: defineTable({
    vendor_id: v.id("vendors"),
    name: v.string(),
    description: v.string(),
    location: v.string(),
    event_date: v.number(), // Unix timestamp
    price: v.number(), // Price in cents
    total_tickets: v.number(),
    available_tickets: v.number(),
    image_storage_id: v.optional(v.id("_storage")),
    is_published: v.boolean(),
    is_cancelled: v.optional(v.boolean()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_vendor", ["vendor_id"])
    .index("by_date", ["event_date"])
    .index("by_status", ["is_published", "is_cancelled"]),

  // Products table - additional items for events
  products: defineTable({
    vendor_id: v.id("vendors"),
    event_id: v.optional(v.id("events")),
    name: v.string(),
    description: v.string(),
    price: v.number(), // Price in cents
    quantity: v.number(),
    available_quantity: v.number(),
    category: v.string(),
    type: v.union(
      v.literal("physical"),
      v.literal("digital"),
      v.literal("ticket"),
      v.literal("service")
    ),
    is_active: v.boolean(),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_vendor", ["vendor_id"])
    .index("by_event", ["event_id"])
    .index("by_category", ["category"])
    .index("by_type", ["type"]),

  // Bookings table - order management
  bookings: defineTable({
    booking_reference: v.string(), // Unique booking reference
    user_id: v.string(), // Clerk user ID - links to users table
    vendor_id: v.id("vendors"),
    total_amount: v.number(), // Total amount in cents
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
    notes: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_reference", ["booking_reference"])
    .index("by_user", ["user_id"])
    .index("by_vendor", ["vendor_id"])
    .index("by_status", ["status"]),

  // Booking Items table - items within a booking
  booking_items: defineTable({
    booking_id: v.id("bookings"),
    event_id: v.optional(v.id("events")),
    product_id: v.optional(v.id("products")),
    item_type: v.union(v.literal("event_ticket"), v.literal("product")),
    item_name: v.string(),
    quantity: v.number(),
    unit_price: v.number(), // Price per unit in cents
    total_price: v.number(), // Total price for this line item in cents
    created_at: v.number(),
  })
    .index("by_booking", ["booking_id"])
    .index("by_event", ["event_id"])
    .index("by_product", ["product_id"]),

  // Payments table - financial transactions
  payments: defineTable({
    booking_id: v.id("bookings"),
    amount: v.number(), // Amount in cents
    currency: v.string(), // e.g., "MYR"
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("expired"),
      v.literal("refunded")
    ),
    payment_method: v.string(), // "toyyibpay", "stripe", etc.
    payment_provider: v.string(), // "ToyyibPay", "Stripe", etc.
    transaction_reference: v.optional(v.string()), // Provider's transaction ID
    bill_code: v.optional(v.string()), // ToyyibPay bill code for callbacks
    provider_response: v.optional(v.any()), // Full provider response
    refund_amount: v.optional(v.number()), // Amount refunded in cents
    refund_reason: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_booking", ["booking_id"])
    .index("by_status", ["status"])
    .index("by_method", ["payment_method"])
    .index("by_transaction_ref", ["transaction_reference"])
    .index("by_bill_code", ["bill_code"]),

  // Tickets table - individual tickets issued
  tickets: defineTable({
    booking_id: v.id("bookings"),
    booking_item_id: v.id("booking_items"),
    event_id: v.id("events"),
    ticket_number: v.string(), // Unique ticket number
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
    qr_code: v.optional(v.string()), // QR code for validation
    checked_in: v.boolean(),
    checked_in_at: v.optional(v.number()),
    checked_in_by: v.optional(v.string()),
    issued_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_booking", ["booking_id"])
    .index("by_event", ["event_id"])
    .index("by_status", ["status"])
    .index("by_ticket_number", ["ticket_number"])
    .index("by_holder_email", ["holder_email"]),

  // Waiting List table - queue management for sold out events
  waiting_list: defineTable({
    event_id: v.id("events"),
    user_id: v.string(), // Clerk user ID
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    quantity: v.number(), // Number of tickets requested
    position: v.number(), // Position in queue (based on ticket count)
    status: v.union(
      v.literal("waiting"),
      v.literal("offered"),
      v.literal("purchased"),
      v.literal("expired"),
      v.literal("cancelled")
    ),
    offer_expires_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_event", ["event_id"])
    .index("by_user", ["user_id"])
    .index("by_status", ["status"])
    .index("by_event_status", ["event_id", "status"])
    .index("by_position", ["event_id", "position"]),
});
