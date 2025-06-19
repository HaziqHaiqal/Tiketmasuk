import { Doc, Id } from "../convex/_generated/dataModel";

type User = Doc<"users">; // Convex Auth users table
type UserProfile = Doc<"user_profiles">; // Extended user profile data

export type UserRole = "customer" | "organizer" | "admin";

/**
 * Check if user has a specific role
 */
export function hasRole(userProfile: UserProfile, role: UserRole): boolean {
  return userProfile.roles?.includes(role) || false;
}

/**
 * Check if user is an organizer (has organizer role)
 */
export function isOrganizer(userProfile: UserProfile): boolean {
  return hasRole(userProfile, "organizer") || userProfile.is_organizer === true;
}

/**
 * Check if user is an admin
 */
export function isAdmin(userProfile: UserProfile): boolean {
  return hasRole(userProfile, "admin");
}

/**
 * Check if user is a customer (everyone is a customer by default)
 */
export function isCustomer(userProfile: UserProfile): boolean {
  return hasRole(userProfile, "customer") || userProfile.roles?.length === 0;
}

// Legacy alias - will be removed in next version
export const isAttendee = isCustomer;

/**
 * Get user's current active role (for UI display)
 */
export function getCurrentRole(userProfile: UserProfile): UserRole {
  // Return current active role if set
  if (userProfile.current_active_role) {
    return userProfile.current_active_role;
  }
  
  // Default logic: admin > organizer > customer
  if (isAdmin(userProfile)) return "admin";
  if (isOrganizer(userProfile)) return "organizer";
  return "customer";
}

/**
 * Get all roles for a user
 */
export function getAllRoles(userProfile: UserProfile): UserRole[] {
  const roles = userProfile.roles || [];
  
  // Everyone is at least a customer
  if (!roles.includes("customer")) {
    return ["customer", ...roles];
  }
  
  return roles;
}

/**
 * Check if user can switch to a specific role
 */
export function canSwitchToRole(userProfile: UserProfile, targetRole: UserRole): boolean {
  return getAllRoles(userProfile).includes(targetRole);
}

/**
 * Get role display information
 */
export function getRoleInfo(role: UserRole): { 
  name: string; 
  description: string; 
  color: string; 
  icon: string;
} {
  const roleMap = {
    "customer": {
      name: "Customer",
      description: "Browse and purchase tickets for events",
      color: "bg-blue-500",
      icon: "🎫"
    },
    "organizer": {
      name: "Organizer", 
      description: "Create and manage events, sell tickets",
      color: "bg-green-500",
      icon: "🎪"
    },
    "admin": {
      name: "Admin",
      description: "Full system access and user management",
      color: "bg-red-500", 
      icon: "⚙️"
    }
  };
  
  return roleMap[role];
}

/**
 * Generate initial user profile data for new user
 */
export function createInitialUserProfile(userId: string): Partial<UserProfile> {
  return {
    user_id: userId as Id<"users">,
    roles: ["customer"], // Everyone starts as customer
    current_active_role: "customer",
    is_organizer: false,
    account_status: "active",
    verification_level: "unverified",
    created_at: Date.now(),
  };
}

/**
 * Upgrade user to organizer when they create their first event
 */
export function upgradeToOrganizer(userProfile: UserProfile): Partial<UserProfile> {
      const currentRoles = userProfile.roles || ["customer"];
  
  // Add organizer role if not already present
  if (!currentRoles.includes("organizer")) {
    currentRoles.push("organizer");
  }
  
  return {
    roles: currentRoles,
    is_organizer: true,
    organizer_since: userProfile.organizer_since || Date.now(),
    current_active_role: "organizer", // Switch to organizer mode
    updated_at: Date.now(),
  };
}

/**
 * Get user capabilities based on their current role
 */
export function getUserCapabilities(userProfile: UserProfile): {
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
  const currentRole = getCurrentRole(userProfile);
  
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
export function formatRoleForDisplay(role: UserRole): string {
  return getRoleInfo(role).name;
}

/**
 * Get available role switches for user (for role switching dropdown)
 */
export function getAvailableRoleSwitches(userProfile: UserProfile): Array<{
  role: UserRole;
  name: string;
  description: string;
  isCurrent: boolean;
}> {
  const allRoles = getAllRoles(userProfile);
  const currentRole = getCurrentRole(userProfile);
  
  return allRoles.map(role => ({
    role,
    ...getRoleInfo(role),
    isCurrent: role === currentRole
  }));
} 