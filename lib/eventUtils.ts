import { Doc } from "../convex/_generated/dataModel";

type Event = Doc<"events">;
type EventCategory = Event["categories"][0];
type PricingTier = EventCategory["pricing_tiers"][0];

// Generate unique ID for embedded objects (categories, pricing tiers)
export function generateUniqueId(): string {
  return crypto.randomUUID();
}

export function getMinPrice(event: Event): number {
  if (!event.categories || event.categories.length === 0) return 0;
  
  const allPrices = event.categories.flatMap((category: EventCategory) =>
    category.pricing_tiers
      .filter((tier: PricingTier) => tier.is_active)
      .map((tier: PricingTier) => tier.price)
  );
  
  return allPrices.length > 0 ? Math.min(...allPrices) : 0;
}

export function getMaxPrice(event: Event): number {
  if (!event.categories || event.categories.length === 0) return 0;
  
  const allPrices = event.categories.flatMap((category: EventCategory) =>
    category.pricing_tiers
      .filter((tier: PricingTier) => tier.is_active)
      .map((tier: PricingTier) => tier.price)
  );
  
  return allPrices.length > 0 ? Math.max(...allPrices) : 0;
}

export function getTotalTickets(event: Event): number {
  if (!event.categories || event.categories.length === 0) return 0;
  
  return event.categories.reduce((sum: number, cat: EventCategory) => sum + cat.total_tickets, 0);
}

export function getAvailableTickets(event: Event): number {
  if (!event.categories || event.categories.length === 0) return 0;
  
  return event.categories.reduce((sum: number, cat: EventCategory) => sum + cat.available_tickets, 0);
}

export function getBestPrice(category: EventCategory): PricingTier | null {
  const now = Date.now();
  const availableTiers = category.pricing_tiers.filter((tier: PricingTier) => {
    if (!tier.is_active) return false;
    
    if (tier.availability_type === "time_based") {
      return (!tier.sale_start_date || tier.sale_start_date <= now) &&
             (!tier.sale_end_date || tier.sale_end_date > now);
    }
    
    if (tier.availability_type === "quantity_based") {
      return !tier.max_tickets || !tier.tickets_sold || tier.tickets_sold < tier.max_tickets;
    }
    
    return true; // unlimited
  });
  
  return availableTiers.sort((a: PricingTier, b: PricingTier) => a.price - b.price)[0] || null;
} 