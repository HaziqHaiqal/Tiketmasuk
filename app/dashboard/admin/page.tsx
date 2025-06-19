"use client";

import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import AdminDashboard from "@/components/AdminDashboard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Shield } from "lucide-react";

export default function AdminDashboardPage() {
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.current);
  const userProfile = useQuery(api.users.getCurrentUserProfile);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to access the admin dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (currentUser === undefined || userProfile === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Checking permissions...</span>
        </div>
      </div>
    );
  }

  // Check if user has admin role
  if (!userProfile?.profile?.roles?.includes("admin")) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Access Denied:</strong> You don't have administrator privileges to access this dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminDashboard />
    </div>
  );
} 