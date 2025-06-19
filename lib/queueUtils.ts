import { Doc } from "../convex/_generated/dataModel";

type Event = Doc<"events">;
type TicketCategory = Doc<"ticket_categories">;
type WaitingList = Doc<"waiting_list">;
type TicketReservation = Doc<"ticket_reservations">;

export type QueueStatus = 
  | "waiting"
  | "offered" 
  | "purchasing"
  | "converted"
  | "expired"
  | "declined"
  | "removed"
  | "cancelled";

export type ReservationSource = "queue_offer" | "direct_purchase" | "admin_hold";

export interface QueueConfig {
  offerTimeoutMinutes: number;      // How long users have to accept offer (default: 15)
  purchaseTimeoutMinutes: number;   // How long to complete purchase (default: 10)
  maxQueueSize: number;             // Maximum people in queue (default: 1000)
  notificationRetries: number;      // How many times to retry notifications (default: 3)
  suspiciousIPThreshold: number;    // How many queue entries per IP before flagging (default: 5)
}

export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  offerTimeoutMinutes: 15,
  purchaseTimeoutMinutes: 10,
  maxQueueSize: 1000,
  notificationRetries: 3,
  suspiciousIPThreshold: 5,
};

/**
 * Calculate available tickets for a category (considering reservations and queue)
 */
export function calculateAvailableTickets(
  ticketCategory: TicketCategory,
  activeReservations: TicketReservation[] = []
): number {
  const totalTickets = ticketCategory.total_quantity;
  const soldTickets = ticketCategory.sold_quantity || 0;
  const reservedTickets = activeReservations.reduce((sum, res) => sum + res.quantity, 0);
  
  return Math.max(0, totalTickets - soldTickets - reservedTickets);
}

/**
 * Check if someone can join the queue
 */
export function canJoinQueue(
  ticketCategory: TicketCategory,
  queueSize: number,
  requestedQuantity: number,
  config: QueueConfig = DEFAULT_QUEUE_CONFIG
): {
  canJoin: boolean;
  reason?: string;
  availableTickets?: number;
} {
  // Check if ticket sales are active
  if (!ticketCategory.is_active) {
    return { canJoin: false, reason: "Ticket sales are not active" };
  }

  // Check sale timing
  const now = Date.now();
  if (ticketCategory.sale_start_datetime && now < ticketCategory.sale_start_datetime) {
    return { canJoin: false, reason: "Ticket sales have not started yet" };
  }
  
  if (ticketCategory.sale_end_datetime && now > ticketCategory.sale_end_datetime) {
    return { canJoin: false, reason: "Ticket sales have ended" };
  }

  // Check queue size limits
  if (queueSize >= config.maxQueueSize) {
    return { canJoin: false, reason: "Queue is full" };
  }

  // Check quantity limits
  if (ticketCategory.max_quantity_per_order && requestedQuantity > ticketCategory.max_quantity_per_order) {
    return { 
      canJoin: false, 
      reason: `Maximum ${ticketCategory.max_quantity_per_order} tickets per order` 
    };
  }

  const minQuantity = ticketCategory.min_quantity_per_order || 1;
  if (requestedQuantity < minQuantity) {
    return { 
      canJoin: false, 
      reason: `Minimum ${minQuantity} tickets required` 
    };
  }

  return { canJoin: true };
}

/**
 * Calculate next queue position
 */
export function calculateNextPosition(existingQueueEntries: WaitingList[]): number {
  if (existingQueueEntries.length === 0) return 1;
  
  const maxPosition = Math.max(...existingQueueEntries.map(entry => entry.position));
  return maxPosition + 1;
}

/**
 * Determine how many tickets to offer from queue
 */
export function calculateOfferQuantity(
  requestedQuantity: number,
  availableTickets: number,
  ticketCategory: TicketCategory
): number {
  // Can't offer more than available
  const maxAvailable = Math.min(requestedQuantity, availableTickets);
  
  // Respect per-order limits
  if (ticketCategory.max_quantity_per_order) {
    return Math.min(maxAvailable, ticketCategory.max_quantity_per_order);
  }
  
  return maxAvailable;
}

/**
 * Get queue position display info
 */
export function getQueueStatusInfo(status: QueueStatus): {
  label: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
} {
  const statusMap = {
    "waiting": {
      label: "In Queue",
      description: "You're in line! We'll notify you when tickets are available.",
      color: "bg-blue-500",
      icon: "⏳",
      isActive: true
    },
    "offered": {
      label: "Tickets Available!",
      description: "Tickets are ready for you! Complete your purchase now.",
      color: "bg-green-500", 
      icon: "🎫",
      isActive: true
    },
    "purchasing": {
      label: "Purchasing",
      description: "Complete your purchase to secure your tickets.",
      color: "bg-yellow-500",
      icon: "💳",
      isActive: true
    },
    "converted": {
      label: "Purchased",
      description: "Success! You've purchased your tickets.",
      color: "bg-green-600",
      icon: "✅",
      isActive: false
    },
    "expired": {
      label: "Offer Expired",
      description: "Your ticket offer has expired. You can rejoin the queue.",
      color: "bg-red-500",
      icon: "⏰",
      isActive: false
    },
    "declined": {
      label: "Declined",
      description: "You declined the ticket offer.",
      color: "bg-gray-500",
      icon: "❌",
      isActive: false
    },
    "removed": {
      label: "Removed",
      description: "You were removed from the queue.",
      color: "bg-red-600",
      icon: "🚫",
      isActive: false
    },
    "cancelled": {
      label: "Cancelled",
      description: "You left the queue.",
      color: "bg-gray-600",
      icon: "↩️",
      isActive: false
    }
  };

  return statusMap[status];
}

/**
 * Calculate estimated wait time (rough estimate)
 */
export function estimateWaitTime(
  position: number,
  ticketCategory: TicketCategory,
  averageProcessingTime: number = 10 // minutes per person
): {
  estimatedMinutes: number;
  estimatedHours: number;
  displayText: string;
} {
  const estimatedMinutes = (position - 1) * averageProcessingTime;
  const estimatedHours = estimatedMinutes / 60;

  let displayText: string;
  if (estimatedMinutes < 60) {
    displayText = `~${Math.round(estimatedMinutes)} minutes`;
  } else if (estimatedHours < 24) {
    displayText = `~${Math.round(estimatedHours)} hours`;
  } else {
    const days = Math.round(estimatedHours / 24);
    displayText = `~${days} days`;
  }

  return {
    estimatedMinutes,
    estimatedHours,
    displayText
  };
}

/**
 * Create reservation data for queue offer
 */
export function createQueueReservation(
  waitingListEntry: WaitingList,
  ticketCategory: TicketCategory,
  offeredQuantity: number,
  sessionId: string,
  config: QueueConfig = DEFAULT_QUEUE_CONFIG
): Partial<TicketReservation> {
  const now = Date.now();
  const expiresAt = now + (config.purchaseTimeoutMinutes * 60 * 1000);

  return {
    event_id: waitingListEntry.event_id,
    ticket_category_id: waitingListEntry.ticket_category_id,
    user_id: waitingListEntry.user_id,
    session_id: sessionId,
    quantity: offeredQuantity,
    reserved_at: now,
    expires_at: expiresAt,
    source: "queue_offer",
    waiting_list_id: waitingListEntry._id,
    status: "active",
    price_locked: ticketCategory.price,
    created_at: now
  };
}

/**
 * Update waiting list entry when offering tickets
 */
export function createQueueOffer(
  waitingListEntry: WaitingList,
  offeredQuantity: number,
  price: number,
  config: QueueConfig = DEFAULT_QUEUE_CONFIG
): Partial<WaitingList> {
  const now = Date.now();
  const expiresAt = now + (config.offerTimeoutMinutes * 60 * 1000);

  return {
    status: "offered",
    offered_at: now,
    offer_expires_at: expiresAt,
    offered_quantity: offeredQuantity,
    offered_price: price,
    notified_at: now,
    updated_at: now
  };
}

/**
 * Check if IP address seems suspicious
 */
export function detectSuspiciousActivity(
  ipAddress: string,
  userAgent: string,
  recentQueueEntries: WaitingList[],
  config: QueueConfig = DEFAULT_QUEUE_CONFIG
): boolean {
  // Count recent entries from same IP
  const sameIPCount = recentQueueEntries.filter(entry => entry.ip_address === ipAddress).length;
  
  if (sameIPCount >= config.suspiciousIPThreshold) {
    return true;
  }

  // Check for suspicious user agents (basic bots)
  const suspiciousAgents = ['bot', 'crawler', 'spider', 'scraper'];
  if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    return true;
  }

  return false;
}

/**
 * Format queue position for display
 */
export function formatQueuePosition(position: number): string {
  if (position === 1) return "1st in line";
  if (position === 2) return "2nd in line";
  if (position === 3) return "3rd in line";
  if (position <= 10) return `${position}th in line`;
  if (position <= 100) return `#${position} in queue`;
  return `#${position} in queue`;
}

/**
 * Calculate queue priority score
 */
export function calculatePriorityScore(
  userProfile: { 
    total_events_attended?: number; 
    favorite_organizers?: string[]; 
    verification_level?: string;
  } | null,
  ticketCategory: TicketCategory,
  event: Event
): number {
  let score = 0;

  // Base score for all users
  score += 100;

  // Previous customer bonus
  if (userProfile?.total_events_attended && userProfile.total_events_attended > 0) {
    score += 20;
  }

  // Organizer loyalty bonus
  if (userProfile?.favorite_organizers?.includes(event.organizer_id)) {
    score += 30;
  }

  // Early registration bonus (registered for waitlist quickly)
  const eventCreatedHours = (Date.now() - event.created_at) / (1000 * 60 * 60);
  if (eventCreatedHours < 24) {
    score += 10; // Early bird bonus
  }

  // VIP or verified user bonus
  if (userProfile?.verification_level === "identity_verified") {
    score += 15;
  }

  return score;
}

/**
 * Check if offer has expired
 */
export function isOfferExpired(waitingListEntry: WaitingList): boolean {
  if (!waitingListEntry.offer_expires_at) return false;
  return Date.now() > waitingListEntry.offer_expires_at;
}

/**
 * Check if reservation has expired
 */
export function isReservationExpired(reservation: TicketReservation): boolean {
  return Date.now() > reservation.expires_at;
}

/**
 * Get next eligible queue entries for processing
 */
export function getNextEligibleEntries(
  queueEntries: WaitingList[],
  availableTickets: number
): WaitingList[] {
  // Filter to only waiting entries, sorted by priority then position
  const waitingEntries = queueEntries
    .filter(entry => entry.status === "waiting")
    .sort((a, b) => {
      // First by priority score (higher first)
      if ((b.priority_score || 0) !== (a.priority_score || 0)) {
        return (b.priority_score || 0) - (a.priority_score || 0);
      }
      // Then by position (lower first)
      return a.position - b.position;
    });

  const eligibleEntries: WaitingList[] = [];
  let remainingTickets = availableTickets;

  for (const entry of waitingEntries) {
    if (remainingTickets <= 0) break;
    
    const canOffer = Math.min(entry.requested_quantity, remainingTickets);
    if (canOffer > 0) {
      eligibleEntries.push(entry);
      remainingTickets -= canOffer;
    }
  }

  return eligibleEntries;
}

/**
 * Validate queue entry data
 */
export function validateQueueEntry(data: {
  email: string;
  requestedQuantity: number;
  maxPrice?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    errors.push("Invalid email address");
  }

  // Quantity validation
  if (data.requestedQuantity < 1) {
    errors.push("Quantity must be at least 1");
  }

  if (data.requestedQuantity > 20) {
    errors.push("Maximum 20 tickets per request");
  }

  // Price validation
  if (data.maxPrice !== undefined && data.maxPrice < 0) {
    errors.push("Maximum price cannot be negative");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate queue statistics
 */
export function generateQueueStats(queueEntries: WaitingList[]): {
  totalInQueue: number;
  waitingCount: number;
  offeredCount: number;
  purchasingCount: number;
  averagePosition: number;
  oldestEntryAge: number;
} {
  const waiting = queueEntries.filter(e => e.status === "waiting");
  const offered = queueEntries.filter(e => e.status === "offered");
  const purchasing = queueEntries.filter(e => e.status === "purchasing");

  const averagePosition = waiting.length > 0 
    ? waiting.reduce((sum, e) => sum + e.position, 0) / waiting.length 
    : 0;

  const oldestEntry = queueEntries.length > 0
    ? Math.min(...queueEntries.map(e => e.created_at))
    : Date.now();

  return {
    totalInQueue: queueEntries.length,
    waitingCount: waiting.length,
    offeredCount: offered.length,
    purchasingCount: purchasing.length,
    averagePosition: Math.round(averagePosition),
    oldestEntryAge: Date.now() - oldestEntry
  };
} 