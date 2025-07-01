import { Doc, Id } from "../convex/_generated/dataModel";

// User role management utilities
type CustomerProfile = Doc<"customer_profiles">; // Use customer_profiles instead
type OrganizerProfile = Doc<"organizer_profiles">;
type UserRole = Doc<"user_roles">;

// Role checking functions
export function hasRole(userRoles: UserRole[], role: string): boolean {
  return userRoles.some(r => r.role === role);
}

// Check if user is an organizer
export function isOrganizer(userRoles: UserRole[], organizerProfile?: OrganizerProfile): boolean {
  return hasRole(userRoles, "organizer") || !!organizerProfile;
}

/**
 * Check if user is a premium customer
 */
export function isPremiumCustomer(userRoles: UserRole[]): boolean {
  return hasRole(userRoles, "premium_customer");
}

/**
 * Check if user is a regular customer
 */
export function isCustomer(userRoles: UserRole[], customerProfile?: CustomerProfile): boolean {
  return hasRole(userRoles, "customer") || !!customerProfile;
}

/**
 * Get the current active role for a user
 */
export function getCurrentActiveRole(userRoles: UserRole[]): string {
  // For now, return the first role or default to customer
  if (userRoles.length > 0) {
    return userRoles[0].role;
  }
  
  return "customer";
}

/**
 * Get all available roles for a user
 */
export function getAvailableRoles(userRoles: UserRole[]): string[] {
  return userRoles.map(r => r.role);
}

/**
 * Check if user can perform admin actions
 */
export function canPerformAdminActions(userRoles: UserRole[]): boolean {
  return hasRole(userRoles, "admin") || hasRole(userRoles, "super_admin");
}

/**
 * Check if user can moderate content
 */
export function canModerateContent(userRoles: UserRole[]): boolean {
  return hasRole(userRoles, "moderator") || canPerformAdminActions(userRoles);
}

/**
 * Check if user can create events
 */
export function canCreateEvents(userRoles: UserRole[], organizerProfile?: OrganizerProfile): boolean {
  return isOrganizer(userRoles, organizerProfile) && organizerProfile?.isVerified === true;
}

/**
 * Check if user can manage bookings
 */
export function canManageBookings(userRoles: UserRole[], organizerProfile?: OrganizerProfile): boolean {
  return isOrganizer(userRoles, organizerProfile);
}

/**
 * Get user permissions based on roles
 */
export function getUserPermissions(userRoles: UserRole[], organizerProfile?: OrganizerProfile) {
  return {
    canCreateEvents: canCreateEvents(userRoles, organizerProfile),
    canManageBookings: canManageBookings(userRoles, organizerProfile),
    canModerateContent: canModerateContent(userRoles),
    canPerformAdminActions: canPerformAdminActions(userRoles),
    isOrganizer: isOrganizer(userRoles, organizerProfile),
    isCustomer: isCustomer(userRoles),
    isPremium: isPremiumCustomer(userRoles),
  };
}

/**
 * Role transition utilities
 */
export function prepareOrganizerTransition(customerProfile?: CustomerProfile) {
  if (!customerProfile) {
    throw new Error("Customer profile required for organizer transition");
  }

  const fullName = customerProfile.firstName && customerProfile.lastName 
    ? `${customerProfile.firstName} ${customerProfile.lastName}` 
    : "";

  return {
    // Use customer profile data to pre-fill organizer profile
    fullName,
    displayName: fullName,
    phone: customerProfile.phone || "",
    // Set default values for organizer-specific fields
    organizerType: "individual" as const,
    storeName: "",
    storeDescription: "",
    primaryLocation: "",
    isVerified: false,
    createdAt: Date.now(),
  };
}

/**
 * Check if user is an admin
 */
export function isAdmin(userRoles: UserRole[]): boolean {
  return hasRole(userRoles, "admin");
}

/**
 * Get user's current active role (for UI display)
 */
export function getCurrentRole(userRoles: UserRole[]): string {
  // Return current active role if set
  if (userRoles.length > 0) {
    return userRoles[0].role;
  }
  
  // Default logic: admin > organizer > customer
  if (isAdmin(userRoles)) return "admin";
  if (isOrganizer(userRoles)) return "organizer";
  return "customer";
}

/**
 * Get all roles for a user
 */
export function getAllRoles(userRoles: UserRole[]): string[] {
  const roles = userRoles.map(r => r.role);
  
  // Everyone is at least a customer
  if (!roles.includes("customer")) {
    return ["customer", ...roles];
  }
  
  return roles;
}

/**
 * Check if user can switch to a specific role
 */
export function canSwitchToRole(userRoles: UserRole[], targetRole: string): boolean {
  return getAllRoles(userRoles).includes(targetRole);
}

/**
 * Get role display information
 */
export function getRoleInfo(role: string): { 
  name: string; 
  description: string; 
  color: string; 
  icon: string; 
} {
  const roleInfoMap: Record<string, { name: string; description: string; color: string; icon: string }> = {
    customer: {
      name: "Customer",
      description: "Browse and book events",
      color: "blue",
      icon: "👤"
    },
    organizer: {
      name: "Organizer", 
      description: "Create and manage events",
      color: "purple",
      icon: "🎪"
    },
    admin: {
      name: "Admin",
      description: "Manage platform and users", 
      color: "red",
      icon: "⚙️"
    }
  };

  return roleInfoMap[role] || roleInfoMap.customer;
}

/**
 * Generate initial user profile data for new user
 */
export function createInitialUserProfile(userId: string): Partial<CustomerProfile> {
  return {
    userId: userId as Id<"users">,
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: undefined,
    gender: undefined,
    address: undefined,
    language: undefined,
    timezone: undefined,
    currency: undefined,
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: true,
    },
    privacy: {
      profileVisibility: "public",
      showEmail: false,
      showPhone: true,
    },
    phoneVerified: false,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Upgrade user to organizer when they create their first event
 */
export function upgradeToOrganizer(userRoles: UserRole[], customerProfile?: CustomerProfile): any {
  // Return the organizer profile data
  return {
    ...prepareOrganizerTransition(customerProfile),
    updatedAt: Date.now(),
  };
}

/**
 * Get user capabilities based on their current role
 */
export function getUserCapabilities(userRoles: UserRole[]): {
  canCreateEvents: boolean;
  canManageEvents: boolean;
  canViewAllEvents: boolean;
  canManageUsers: boolean;
  canAccessAnalytics: boolean;
  canManagePayments: boolean;
  canPurchaseTickets: boolean;
  canModerateEvents: boolean;
  canApproveEvents: boolean;
  canRejectEvents: boolean;
  canAccessAdminPanel: boolean;
  canViewModerationLogs: boolean;
  canManageSystemSettings: boolean;
} {
  const currentRole = getCurrentRole(userRoles);
  
  const capabilities = {
    canCreateEvents: false,
    canManageEvents: false,
    canViewAllEvents: false,
    canManageUsers: false,
    canAccessAnalytics: false,
    canManagePayments: false,
    canPurchaseTickets: true, // Everyone can buy tickets
    canModerateEvents: false,
    canApproveEvents: false,
    canRejectEvents: false,
    canAccessAdminPanel: false,
    canViewModerationLogs: false,
    canManageSystemSettings: false,
  };
  
  if (currentRole === "organizer" || currentRole === "admin") {
    capabilities.canCreateEvents = true;
    capabilities.canManageEvents = true;
    capabilities.canAccessAnalytics = true;
    capabilities.canManagePayments = true;
  }
  
  if (currentRole === "admin") {
    capabilities.canViewAllEvents = true;
    capabilities.canManageUsers = true;
    capabilities.canModerateEvents = true;
    capabilities.canApproveEvents = true;
    capabilities.canRejectEvents = true;
    capabilities.canAccessAdminPanel = true;
    capabilities.canViewModerationLogs = true;
    capabilities.canManageSystemSettings = true;
  }
  
  return capabilities;
}

/**
 * Format role for display in UI
 */
export function formatRoleForDisplay(role: string): string {
  return getRoleInfo(role).name;
}

/**
 * Get available role switches for user (for role switching dropdown)
 */
export function getAvailableRoleSwitches(userRoles: UserRole[]): Array<{
  role: string;
  name: string;
  description: string;
  isCurrent: boolean;
}> {
  const allRoles = getAllRoles(userRoles);
  const currentRole = getCurrentRole(userRoles);
  
  return allRoles.map(role => ({
    role,
    ...getRoleInfo(role),
    isCurrent: role === currentRole
  }));
} 