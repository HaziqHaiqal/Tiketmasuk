"use client";

import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Shield, Users, Settings } from "lucide-react";
import Spinner from "@/components/Spinner";

export default function DashboardPage() {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const currentUser = useQuery(api.users.current);
  const userProfile = useQuery(api.users.getCurrentUserProfile);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    if (userProfile) {
      // Check user roles and redirect accordingly
      if (userProfile.profile?.roles?.includes("admin")) {
        router.push("/dashboard/admin");
      } else if (userProfile.profile?.roles?.includes("organizer")) {
        router.push("/dashboard/organizer");
      } else {
        // Regular user - redirect to profile or show upgrade options
        router.push("/dashboard/profile");
      }
    }
  }, [isAuthenticated, userProfile, router]);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to access the dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state - let global loader handle it
  if (currentUser === undefined || userProfile === undefined) {
    return <Spinner fullScreen />;
  }

  // Fallback UI while redirecting
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Setting up your dashboard...</h2>
            <p className="text-gray-600">Redirecting based on your account type</p>
          </div>

          {/* Role indicators */}
          {userProfile && (
            <div className="flex justify-center space-x-4 text-sm text-gray-500">
              {userProfile.profile?.roles?.includes("admin") && (
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  Admin
                </div>
              )}
              {userProfile.profile?.roles?.includes("organizer") && (
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  Organizer
                </div>
              )}
              {(!userProfile.profile?.roles || userProfile.profile.roles.length === 0 || 
                (userProfile.profile.roles.length === 1 && userProfile.profile.roles[0] === "customer")) && (
                <div className="flex items-center">
                  <Settings className="w-4 h-4 mr-1" />
                  User
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 