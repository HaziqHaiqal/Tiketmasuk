import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default convex;

// ============================================================================
// CONVEX AUTH UTILITIES (Following Official Documentation)
// ============================================================================

/**
 * Helper function for making authenticated HTTP requests to Convex HTTP actions
 * This follows the pattern recommended in the Convex Auth documentation
 */
export async function authenticatedFetch(
  endpoint: string, 
  token: string | null,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return fetch(`${process.env.NEXT_PUBLIC_CONVEX_SITE_URL}${endpoint}`, {
    ...options,
    headers,
  });
}

/**
 * Session refresh utility following Convex Auth best practices
 */
export interface SessionRefreshOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Helper to refresh authentication session
 * Useful for implementing proper session lifecycle management
 */
export async function refreshSession(
  signOut: () => Promise<void>,
  options: SessionRefreshOptions = {}
): Promise<void> {
  try {
    // Sign out current session
    await signOut();
    
    // Force a page refresh to re-initialize auth state
    // This follows the recommended pattern for session refresh
    window.location.reload();
    
    options.onSuccess?.();
  } catch (error) {
    console.error("Session refresh failed:", error);
    options.onError?.(error as Error);
  }
}
