// ============================================================================
// APP CONSTANTS & CONFIGURATION
// ============================================================================

// TIME-RELATED CONSTANTS (in milliseconds)
export const DURATIONS = {
  OFFER_EXPIRY: 15 * 60 * 1000, // 15 minutes for queue offers
  PURCHASE_TIMEOUT: 10 * 60 * 1000, // 10 minutes to complete purchase
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes session timeout
  REFRESH_INTERVAL: 30 * 1000, // 30 seconds for real-time updates
} as const;

// WAITING LIST STATUS
export const WAITING_LIST_STATUS = {
  WAITING: "waiting",
  OFFERED: "offered", 
  PURCHASING: "purchasing",
  CONVERTED: "converted",
  EXPIRED: "expired",
  DECLINED: "declined",
  REMOVED: "removed",
  CANCELLED: "cancelled",
} as const;

// EVENT STATUS
export const EVENT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
} as const;

// BOOKING STATUS
export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed", 
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

// USER ROLES
export const USER_ROLES = {
  CUSTOMER: "customer", // People who have accounts and make purchases
  ORGANIZER: "organizer", // People who create and manage events
  ADMIN: "admin", // System administrators
} as const;

// ORGANIZER VERIFICATION STATUS
export const VERIFICATION_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const;

// MODERATION STATUS  
export const MODERATION_STATUS = {
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

// EVENT CATEGORIES
export const EVENT_CATEGORIES = [
  "sports",
  "music", 
  "food",
  "travel",
  "technology",
  "arts",
  "business",
  "education",
  "health",
  "entertainment"
] as const;

// FRAUD DETECTION THRESHOLDS
export const FRAUD_DETECTION = {
  SUSPICIOUS_DESCRIPTION_MIN_LENGTH: 10,
  SUSPICIOUS_KEYWORDS: [
    "guaranteed",
    "free money", 
    "act now",
    "limited time",
    "cash prize",
    "winner",
    "lottery",
    "investment opportunity"
  ],
  MAX_FRAUD_SCORE: 100,
  REVIEW_THRESHOLD: 30,
} as const;

// NOTIFICATION SETTINGS
export const NOTIFICATIONS = {
  QUEUE_OFFER_TIMEOUT: 14 * 60 * 1000, // 14 minutes warning
  REMINDER_INTERVALS: [
    1 * 60 * 1000,  // 1 minute
    5 * 60 * 1000,  // 5 minutes
    10 * 60 * 1000, // 10 minutes
  ],
} as const;

 