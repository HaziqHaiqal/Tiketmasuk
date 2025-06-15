/**
 * Helper functions for event creation and management
 */

/**
 * Generate a simple unique ID using timestamp and random string
 */
function generateUniqueId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
}

/**
 * Generate a URL-friendly ID from a name
 */
export function generateSlugId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique ID for a category
 */
export function generateCategoryId(categoryName: string): string {
  const slug = generateSlugId(categoryName);
  const uniqueId = generateUniqueId();
  return `${slug}-${uniqueId}`;
}

/**
 * Generate a unique ID for a pricing tier within a category
 */
export function generatePricingTierId(categoryName: string, tierName: string): string {
  const categorySlug = generateSlugId(categoryName);
  const tierSlug = generateSlugId(tierName);
  const uniqueId = generateUniqueId();
  return `${categorySlug}-${tierSlug}-${uniqueId}`;
}

/**
 * Create a category object with auto-generated IDs
 */
export function createCategory(
  name: string,
  description: string,
  totalTickets: number,
  sortOrder: number,
  pricingTiers: Array<{
    name: string;
    description?: string;
    price: number;
    availability_type: "time_based" | "quantity_based" | "unlimited";
    sale_start_date?: number;
    sale_end_date?: number;
    max_tickets?: number;
    sort_order: number;
  }>
) {
  const categoryId = generateCategoryId(name);
  
  return {
    id: categoryId,
    name,
    description,
    total_tickets: totalTickets,
    available_tickets: totalTickets,
    is_active: true,
    sort_order: sortOrder,
    pricing_tiers: pricingTiers.map(tier => ({
      id: generatePricingTierId(name, tier.name),
      name: tier.name,
      description: tier.description,
      price: tier.price,
      availability_type: tier.availability_type,
      sale_start_date: tier.sale_start_date,
      sale_end_date: tier.sale_end_date,
      max_tickets: tier.max_tickets,
      tickets_sold: tier.availability_type === "quantity_based" ? 0 : undefined,
      is_active: true,
      sort_order: tier.sort_order,
    })),
  };
}

/**
 * Example usage for vendors - they only provide human-readable info
 */
export function createRunningEventCategories() {
  const now = Date.now();
  const days = (d: number) => d * 24 * 60 * 60 * 1000;
  
  return [
    createCategory(
      "5KM Fun Run", 
      "Perfect for beginners and families",
      500,
      1,
      [
        {
          name: "Super Early Bird",
          description: "Limited time offer - save the most!",
          price: 1000, // RM 10.00
          availability_type: "time_based" as const,
          sale_start_date: now,
          sale_end_date: now + days(5),
          sort_order: 1,
        },
        {
          name: "Early Bird",
          description: "Register early and save",
          price: 2000, // RM 20.00
          availability_type: "time_based" as const,
          sale_start_date: now + days(5),
          sale_end_date: now + days(15),
          sort_order: 2,
        },
        {
          name: "Standard Rate",
          description: "Regular pricing",
          price: 3000, // RM 30.00
          availability_type: "unlimited" as const,
          sort_order: 3,
        },
      ]
    ),
    
    createCategory(
      "10KM Challenge",
      "Take on the challenge with a longer distance", 
      300,
      2,
      [
        {
          name: "Super Early Bird",
          price: 2000, // RM 20.00
          availability_type: "time_based" as const,
          sale_start_date: now,
          sale_end_date: now + days(5),
          sort_order: 1,
        },
        {
          name: "Early Bird", 
          price: 3000, // RM 30.00
          availability_type: "time_based" as const,
          sale_start_date: now + days(5),
          sale_end_date: now + days(15),
          sort_order: 2,
        },
        {
          name: "Standard Rate",
          price: 4000, // RM 40.00
          availability_type: "unlimited" as const,
          sort_order: 3,
        },
      ]
    ),
    
    createCategory(
      "VIP Experience Package",
      "Includes premium start position, post-race meal, and exclusive merchandise",
      50,
      5,
      [
        {
          name: "Limited VIP",
          description: "Limited quantity available",
          price: 15000, // RM 150.00
          availability_type: "quantity_based" as const,
          max_tickets: 30,
          sort_order: 1,
        },
        {
          name: "VIP Standard",
          description: "After limited quantity is sold",
          price: 20000, // RM 200.00
          availability_type: "unlimited" as const,
          sort_order: 2,
        },
      ]
    ),
  ];
}

// =============================================================================
// VENDOR INPUT EXAMPLES
// =============================================================================

/**
 * EXAMPLE 1: Fun Run Event
 * What a vendor needs to input for a running event
 */
export const VENDOR_INPUT_EXAMPLE_1 = {
  // Basic Event Info
  event: {
    title: "KL City Fun Run 2025",
    description: "Join us for an exciting fun run through the heart of Kuala Lumpur!",
    date: "2025-05-15", // Event date
    time: "07:00", // Start time
    location: "KLCC Park, Kuala Lumpur",
    image_url: "https://example.com/fun-run-banner.jpg",
    is_queue_enabled: true,
  },
  
  // Categories (Different distances/activities)
  categories: [
    {
      name: "5KM Fun Run",
      description: "Perfect for beginners and families",
      total_tickets: 500,
      pricing_tiers: [
        {
          name: "Super Early Bird",
          description: "Limited time offer - save the most!",
          price: 10.00, // RM (system converts to cents)
          type: "time_based",
          sale_start: "2025-04-15", // Start selling
          sale_end: "2025-04-20",   // Stop selling this tier
        },
        {
          name: "Early Bird",
          description: "Register early and save",
          price: 20.00,
          type: "time_based", 
          sale_start: "2025-04-21",
          sale_end: "2025-04-30",
        },
        {
          name: "Standard Rate",
          description: "Regular pricing",
          price: 30.00,
          type: "unlimited", // Always available
        },
      ]
    },
    {
      name: "10KM Challenge", 
      description: "Take on the challenge",
      total_tickets: 300,
      pricing_tiers: [
        {
          name: "Super Early Bird",
          price: 20.00,
          type: "time_based",
          sale_start: "2025-04-15",
          sale_end: "2025-04-20",
        },
        {
          name: "Early Bird",
          price: 30.00,
          type: "time_based",
          sale_start: "2025-04-21", 
          sale_end: "2025-04-30",
        },
        {
          name: "Standard Rate",
          price: 40.00,
          type: "unlimited",
        },
      ]
    },
    {
      name: "VIP Experience",
      description: "Premium package with exclusive perks",
      total_tickets: 50,
      pricing_tiers: [
        {
          name: "Limited Edition VIP",
          description: "Only 30 available!",
          price: 150.00,
          type: "quantity_based",
          max_quantity: 30, // Only 30 tickets at this price
        },
        {
          name: "VIP Standard",
          description: "After limited edition sells out",
          price: 200.00,
          type: "unlimited",
        },
      ]
    },
  ]
};

/**
 * EXAMPLE 2: Concert Event  
 * What a vendor needs to input for a concert
 */
export const VENDOR_INPUT_EXAMPLE_2 = {
  event: {
    title: "The Weeknd Live in KL",
    description: "Experience The Weeknd live at Stadium Merdeka!",
    date: "2025-08-20",
    time: "20:00",
    location: "Stadium Merdeka, Kuala Lumpur", 
    image_url: "https://example.com/weeknd-concert.jpg",
    is_queue_enabled: true,
  },
  
  categories: [
    {
      name: "General Admission",
      description: "Standing area with great view of the stage",
      total_tickets: 5000,
      pricing_tiers: [
        {
          name: "Presale",
          description: "Exclusive presale for fans",
          price: 280.00,
          type: "quantity_based",
          max_quantity: 1000, // First 1000 tickets
        },
        {
          name: "General Sale",
          price: 350.00,
          type: "unlimited",
        },
      ]
    },
    {
      name: "Premium Seating",
      description: "Reserved seats with excellent view",
      total_tickets: 2000,
      pricing_tiers: [
        {
          name: "Early Access",
          price: 450.00,
          type: "time_based",
          sale_start: "2025-06-01",
          sale_end: "2025-06-15",
        },
        {
          name: "Regular Price",
          price: 500.00,
          type: "unlimited",
        },
      ]
    },
    {
      name: "VIP Package",
      description: "Meet & greet + premium seating + merchandise",
      total_tickets: 100,
      pricing_tiers: [
        {
          name: "VIP Experience",
          price: 1200.00,
          type: "unlimited",
        },
      ]
    },
  ]
};

/**
 * EXAMPLE 3: Conference Event
 * What a vendor needs to input for a business conference
 */
export const VENDOR_INPUT_EXAMPLE_3 = {
  event: {
    title: "Tech Summit Malaysia 2025",
    description: "Malaysia's premier technology conference",
    date: "2025-09-10",
    time: "09:00", 
    location: "Kuala Lumpur Convention Centre",
    image_url: "https://example.com/tech-summit.jpg",
    is_queue_enabled: false, // No queue for conference
  },
  
  categories: [
    {
      name: "Student Pass",
      description: "Special pricing for students with valid ID",
      total_tickets: 200,
      pricing_tiers: [
        {
          name: "Student Rate",
          description: "Must present valid student ID",
          price: 50.00,
          type: "unlimited",
        },
      ]
    },
    {
      name: "Professional Pass",
      description: "Full conference access",
      total_tickets: 800, 
      pricing_tiers: [
        {
          name: "Super Early Bird",
          price: 299.00,
          type: "time_based",
          sale_start: "2025-06-01",
          sale_end: "2025-07-01",
        },
        {
          name: "Early Bird", 
          price: 399.00,
          type: "time_based",
          sale_start: "2025-07-02",
          sale_end: "2025-08-01",
        },
        {
          name: "Regular Price",
          price: 499.00,
          type: "unlimited",
        },
      ]
    },
    {
      name: "VIP Pass",
      description: "Conference + networking dinner + premium swag",
      total_tickets: 50,
      pricing_tiers: [
        {
          name: "VIP Experience",
          price: 899.00, 
          type: "unlimited",
        },
      ]
    },
  ]
}; 