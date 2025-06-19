"use client";

import { useAuthToken as useConvexAuthToken } from "@convex-dev/auth/react";
import { useCallback } from "react";
import { authenticatedFetch } from "@/lib/convex";

/**
 * Custom hook for accessing Convex Auth tokens
 * Follows the pattern recommended in the Convex Auth documentation
 */
export function useAuthToken() {
  const token = useConvexAuthToken();
  
  return token;
}

/**
 * Hook for making authenticated HTTP requests to Convex actions
 * This follows the Convex Auth documentation pattern for HTTP authentication
 */
export function useAuthenticatedFetch() {
  const token = useAuthToken();
  
  const authenticatedRequest = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      return authenticatedFetch(endpoint, token, options);
    },
    [token]
  );
  
  return authenticatedRequest;
}

/**
 * Hook for uploading files with authentication
 * Useful for file storage operations that require authentication
 */
export function useAuthenticatedUpload() {
  const authenticatedRequest = useAuthenticatedFetch();
  
  const uploadFile = useCallback(
    async (file: File, uploadUrl: string) => {
      const formData = new FormData();
      formData.append('file', file);
      
      return authenticatedRequest(uploadUrl, {
        method: 'POST',
        body: formData,
      });
    },
    [authenticatedRequest]
  );
  
  return uploadFile;
} 