import { Doc } from "./_generated/dataModel";

export const DURATIONS = {
  OFFER_EXPIRY: 15 * 60 * 1000, // 15 minutes in milliseconds
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes in milliseconds
};

// Updated to use new table name
export const WAITING_LIST_STATUS: Record<string, Doc<"waiting_list">["status"]> =
  {
    WAITING: "waiting",
    OFFERED: "offered", 
    PURCHASED: "purchased",
    EXPIRED: "expired",
    CANCELLED: "cancelled",
  };

export const TICKET_STATUS: Record<string, Doc<"tickets">["status"]> = {
  ISSUED: "issued",
  VALID: "valid",
  USED: "used",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
}; 