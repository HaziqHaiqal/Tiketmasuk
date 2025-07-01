import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

// ============================================================================
// CONFIGURATION HOOKS
// ============================================================================

/**
 * Hook to get Malaysian states from configuration
 */
export function useMalaysianStates() {
  return useQuery(api.systemConfigs.getMalaysianStates);
}

/**
 * Hook to get event categories from configuration
 */
export function useEventCategories() {
  return useQuery(api.systemConfigs.getEventCategories);
}

/**
 * Hook to get user role configurations
 */
export function useUserRoleConfigs() {
  return useQuery(api.systemConfigs.getUserRoleConfigs);
}

/**
 * Hook to get organizer types from configuration
 */
export function useOrganizerTypes() {
  return useQuery(api.systemConfigs.getOrganizerTypes);
}

/**
 * Hook to get a specific configuration by key
 */
export function useConfig(configKey: string) {
  return useQuery(api.systemConfigs.getConfig, { config_key: configKey });
}

/**
 * Hook to get configurations by category
 */
export function useConfigsByCategory(category: string) {
  return useQuery(api.systemConfigs.getConfigsByCategory, { category });
}

/**
 * Hook to get all configurations (admin only)
 */
export function useAllConfigs() {
  return useQuery(api.systemConfigs.getAllConfigs);
}

/**
 * Hook to get editable configurations based on user role
 */
export function useEditableConfigs() {
  return useQuery(api.systemConfigs.getEditableConfigs);
}

// ============================================================================
// CONFIGURATION DATA TRANSFORMERS
// ============================================================================

/**
 * Transform event categories for use in select components
 */
export function transformEventCategoriesForSelect(categories: any[]) {
  if (!categories) return [];
  
  // Handle both old format (strings) and new format (objects)
  return categories.map(category => {
    if (typeof category === 'string') {
      return {
        value: category,
        label: category.charAt(0).toUpperCase() + category.slice(1)
      };
    }
    return {
      value: category.key,
      label: category.name
    };
  });
}

/**
 * Transform states for use in select components
 */
export function transformStatesForSelect(states: string[]) {
  if (!states) return [];
  
  return states.map(state => ({
    value: state,
    label: state
  }));
}

/**
 * Transform organizer types for use in select components
 */
export function transformOrganizerTypesForSelect(types: any[]) {
  if (!types) return [];
  
  // Handle both old format (strings) and new format (objects)
  return types.map(type => {
    if (typeof type === 'string') {
      return {
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1)
      };
    }
    return {
      value: type.key,
      label: type.name
    };
  });
}

/**
 * Get role info from configuration
 */
export function getRoleInfoFromConfig(roleConfigs: any, role: string) {
  if (!roleConfigs?.roleInfo) {
    // Fallback to hardcoded values
    const fallbackRoleInfo: Record<string, any> = {
      customer: { name: "Customer", description: "Browse and book events", color: "blue", icon: "👤" },
      organizer: { name: "Organizer", description: "Create and manage events", color: "purple", icon: "🎪" },
      admin: { name: "Admin", description: "Manage platform and users", color: "red", icon: "⚙️" }
    };
    return fallbackRoleInfo[role] || fallbackRoleInfo.customer;
  }
  
  return roleConfigs.roleInfo[role] || roleConfigs.roleInfo.customer;
}

// ============================================================================
// CONFIGURATION VALIDATION HELPERS
// ============================================================================

/**
 * Validate if a state is valid according to configuration
 */
export function isValidState(state: string, validStates: string[]) {
  return validStates?.includes(state) || false;
}

/**
 * Validate if an event category is valid according to configuration
 */
export function isValidEventCategory(category: string, validCategories: any[]) {
  if (!validCategories) return false;
  
  // Handle both old format (strings) and new format (objects)
  return validCategories.some(cat => {
    if (typeof cat === 'string') return cat === category;
    return cat.key === category;
  });
}

/**
 * Validate if an organizer type is valid according to configuration
 */
export function isValidOrganizerType(type: string, validTypes: any[]) {
  if (!validTypes) return false;
  
  // Handle both old format (strings) and new format (objects)
  return validTypes.some(t => {
    if (typeof t === 'string') return t === type;
    return t.key === type;
  });
}

// ============================================================================
// FALLBACK DATA (for when configurations are not available)
// ============================================================================

export const FALLBACK_MALAYSIAN_STATES = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan",
  "Pahang", "Penang", "Perak", "Perlis", "Sabah", "Sarawak",
  "Selangor", "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya"
];

export const FALLBACK_EVENT_CATEGORIES = [
  "sports", "music", "food", "travel", "technology",
  "arts", "business", "education", "health", "entertainment"
];

export const FALLBACK_ORGANIZER_TYPES = ["individual", "business"];

export const FALLBACK_USER_ROLES = ["customer", "organizer", "admin"];

// ============================================================================
// CONFIGURATION CACHE HELPERS
// ============================================================================

/**
 * Get configuration with fallback
 */
export function getConfigWithFallback<T>(
  configData: T | undefined,
  fallbackData: T
): T {
  return configData ?? fallbackData;
}

/**
 * Extract configuration data with path
 */
export function extractConfigData(config: any, path: string, fallback: any = null) {
  if (!config?.config_data) return fallback;
  
  const pathParts = path.split('.');
  let current = config.config_data;
  
  for (const part of pathParts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return fallback;
    }
  }
  
  return current;
} 