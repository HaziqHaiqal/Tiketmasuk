import { Doc } from "../convex/_generated/dataModel";

type Event = Doc<"events">;
type TicketCategory = Doc<"ticket_categories">;
type User = Doc<"users">; // Convex Auth users table
type UserProfile = Doc<"user_profiles">; // Extended user profile data
type OrganizerProfile = Doc<"organizer_profiles">;

export type EventType = 
  | "sports"
  | "music" 
  | "food"
  | "travel"
  | "technology"
  | "arts"
  | "business"
  | "education"
  | "health"
  | "entertainment";

export interface EventCategoryInfo {
  name: string;
  color: string;
}

const EVENT_TYPE_MAP: Record<EventType, EventCategoryInfo> = {
  'sports': { name: 'Sports', color: 'bg-blue-500' },
  'music': { name: 'Music', color: 'bg-purple-500' },
  'food': { name: 'Food', color: 'bg-orange-500' },
  'travel': { name: 'Travel', color: 'bg-green-500' },
  'technology': { name: 'Technology', color: 'bg-indigo-500' },
  'arts': { name: 'Arts', color: 'bg-pink-500' },
  'business': { name: 'Business', color: 'bg-gray-600' },
  'education': { name: 'Education', color: 'bg-yellow-600' },
  'health': { name: 'Health', color: 'bg-red-500' },
  'entertainment': { name: 'Entertainment', color: 'bg-violet-500' },
};

// Generate unique ID for embedded objects
export function generateUniqueId(): string {
  return crypto.randomUUID();
}

// NOTE: The following functions now require ticket categories to be passed separately
// since they're no longer embedded in the events table

export function getMinPrice(ticketCategories: TicketCategory[]): number {
  if (!ticketCategories || ticketCategories.length === 0) return 0;
  
  const activePrices = ticketCategories
    .filter((category) => category.is_active)
    .map((category) => category.price);
  
  return activePrices.length > 0 ? Math.min(...activePrices) : 0;
}

export function getMaxPrice(ticketCategories: TicketCategory[]): number {
  if (!ticketCategories || ticketCategories.length === 0) return 0;
  
  const activePrices = ticketCategories
    .filter((category) => category.is_active)
    .map((category) => category.price);
  
  return activePrices.length > 0 ? Math.max(...activePrices) : 0;
}

export function getTotalTickets(ticketCategories: TicketCategory[]): number {
  if (!ticketCategories || ticketCategories.length === 0) return 0;
  
  return ticketCategories.reduce((sum, cat) => {
    return sum + (cat.total_quantity || 0);
  }, 0);
}

export function getAvailableTickets(ticketCategories: TicketCategory[]): number {
  if (!ticketCategories || ticketCategories.length === 0) return 0;
  
  return ticketCategories.reduce((sum, cat) => {
    const sold = cat.sold_quantity || 0;
    const reserved = cat.reserved_quantity || 0;
    const total = cat.total_quantity || 0;
    return sum + Math.max(0, total - sold - reserved);
  }, 0);
}

export function getBestPrice(ticketCategories: TicketCategory[]): TicketCategory | null {
  const now = Date.now();
  const availableCategories = ticketCategories.filter((category) => {
    if (!category.is_active) return false;
    
    // Check sale dates
    if (category.sale_start_datetime && category.sale_start_datetime > now) return false;
    if (category.sale_end_datetime && category.sale_end_datetime <= now) return false;
    
    // Check availability
    if (category.total_quantity) {
      const sold = category.sold_quantity || 0;
      const reserved = category.reserved_quantity || 0;
      if ((sold + reserved) >= category.total_quantity) return false;
    }
    
    return true;
  });
  
  return availableCategories.sort((a, b) => a.price - b.price)[0] || null;
}

/**
 * Get event category information from database event_category field
 */
export function getEventCategory(event: Event): EventCategoryInfo | null {
  // Return category info if event_category is set, otherwise null (no badge)
  if (event.event_category && EVENT_TYPE_MAP[event.event_category]) {
    return EVENT_TYPE_MAP[event.event_category];
  }
  
  return null;
}

/**
 * Get all available event types
 */
export function getAllEventTypes(): EventType[] {
  return Object.keys(EVENT_TYPE_MAP) as EventType[];
}

/**
 * Get event type information by type
 */
export function getEventTypeInfo(type: EventType): EventCategoryInfo {
  return EVENT_TYPE_MAP[type];
}

/**
 * Format event date for display
 */
export function formatEventDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Check if event is happening soon (within 24 hours)
 */
export function isEventSoon(startDateTime: number): boolean {
  const now = Date.now();
  const eventTime = startDateTime;
  const timeDiff = eventTime - now;
  return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000; // 24 hours
}

/**
 * Check if event is currently happening
 */
export function isEventHappening(startDateTime: number, endDateTime?: number): boolean {
  const now = Date.now();
  if (endDateTime) {
    return now >= startDateTime && now <= endDateTime;
  }
  // If no end time, assume event lasts 3 hours
  const assumedEndTime = startDateTime + (3 * 60 * 60 * 1000);
  return now >= startDateTime && now <= assumedEndTime;
}

/**
 * Check if event has ended
 */
export function isEventEnded(startDateTime: number, endDateTime?: number): boolean {
  const now = Date.now();
  if (endDateTime) {
    return now > endDateTime;
  }
  // If no end time, assume event lasts 3 hours
  const assumedEndTime = startDateTime + (3 * 60 * 60 * 1000);
  return now > assumedEndTime;
}

/**
 * Generate event slug from title
 */
export function generateEventSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Calculate the lowest ticket price for an event
 */
export function getLowestTicketPrice(ticketCategories: TicketCategory[]): number | null {
  if (!ticketCategories || ticketCategories.length === 0) {
    return null;
  }
  
  const activeTickets = ticketCategories.filter(ticket => ticket.is_active);
  if (activeTickets.length === 0) {
    return null;
  }
  
  return Math.min(...activeTickets.map(ticket => ticket.price));
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number, currency: string = 'MYR'): string {
  // Convert from cents to main currency unit
  const mainAmount = amount / 100;
  
  const formatters: Record<string, Intl.NumberFormat> = {
    'MYR': new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }),
    'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    'EUR': new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR' }),
  };
  
  const formatter = formatters[currency] || formatters['MYR'];
  return formatter.format(mainAmount);
}

/**
 * Calculate event capacity utilization percentage
 */
export function getCapacityUtilization(currentAttendees: number = 0, maxAttendees?: number): number | null {
  if (!maxAttendees || maxAttendees <= 0) {
    return null;
  }
  
  return Math.round((currentAttendees / maxAttendees) * 100);
}

/**
 * Check if event is sold out
 */
export function isEventSoldOut(currentAttendees: number = 0, maxAttendees?: number): boolean {
  if (!maxAttendees) {
    return false;
  }
  
  return currentAttendees >= maxAttendees;
}

/**
 * Get event status badge info
 */
export function getEventStatusBadge(event: Event): { label: string; color: string; icon?: string } {
  const now = Date.now();
  
  switch (event.status) {
    case 'draft':
      return { label: 'Draft', color: 'bg-gray-500' };
    case 'cancelled':
      return { label: 'Cancelled', color: 'bg-red-500' };
    case 'postponed':
      return { label: 'Postponed', color: 'bg-yellow-500' };
    case 'sold_out':
      return { label: 'Sold Out', color: 'bg-orange-500' };
    case 'completed':
      return { label: 'Completed', color: 'bg-green-500' };
    case 'published':
      if (isEventEnded(event.start_datetime, event.end_datetime)) {
        return { label: 'Ended', color: 'bg-gray-500' };
      }
      if (isEventHappening(event.start_datetime, event.end_datetime)) {
        return { label: 'Live Now', color: 'bg-red-500' };
      }
      if (isEventSoon(event.start_datetime)) {
        return { label: 'Starting Soon', color: 'bg-blue-500' };
      }
      return { label: 'Published', color: 'bg-green-500' };
    default:
      return { label: 'Unknown', color: 'bg-gray-500' };
  }
}

/**
 * Generate event sharing URL
 */
export function getEventShareUrl(eventSlug: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tiketmasuk.com';
  return `${baseUrl}/events/${eventSlug}`;
}

/**
 * Validate event form data
 */
export function validateEventData(data: Partial<Event>): string[] {
  const errors: string[] = [];
  
  if (!data.title || data.title.trim().length < 3) {
    errors.push('Event title must be at least 3 characters long');
  }
  
  if (!data.description || data.description.trim().length < 10) {
    errors.push('Event description must be at least 10 characters long');
  }
  
  if (!data.start_datetime || data.start_datetime <= Date.now()) {
    errors.push('Event start date must be in the future');
  }
  
  if (data.end_datetime && data.end_datetime <= (data.start_datetime || 0)) {
    errors.push('Event end date must be after start date');
  }
  
  if (data.max_attendees && data.max_attendees < 1) {
    errors.push('Maximum attendees must be at least 1');
  }
  
  return errors;
}

/**
 * Calculate event duration in hours
 */
export function getEventDuration(startDateTime: number, endDateTime?: number): number {
  if (!endDateTime) {
    return 3; // Default 3 hours if no end time
  }
  
  const durationMs = endDateTime - startDateTime;
  return Math.round(durationMs / (1000 * 60 * 60)); // Convert to hours
}