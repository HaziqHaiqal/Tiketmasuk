// User Role Types (Account-based)
export type UserRole = "customer" | "organizer" | "admin";

export interface Customer {
  // Account holder who makes purchases
  id: string;
  email: string;
  name: string;
  phone?: string;
  roles: UserRole[];
  // Can purchase tickets for themselves or others
}

export interface Attendee {
  // Person who will attend the event (may or may not have account)
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  special_requirements?: string;
  checked_in?: boolean;
  check_in_time?: number;
  ticket_number: string;
  // Attendee does not necessarily have a user account
}

export interface BookingRelationship {
  // Clear separation of concerns
  customer: Customer;      // Who paid for the booking
  attendees: Attendee[];   // Who will attend the event
  // One customer can buy tickets for multiple attendees
  // Attendees can be the customer themselves or other people
}

// Business Logic Examples:
// 1. Customer = Attendee: John buys 1 ticket for himself
// 2. Customer ≠ Attendee: Sarah buys 3 tickets for her family
// 3. Corporate: HR Manager buys 50 tickets for employees 