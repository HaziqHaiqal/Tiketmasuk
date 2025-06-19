"use client";

import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import OrganizerDashboard from "@/components/OrganizerDashboard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Users } from "lucide-react";
import Spinner from "@/components/Spinner";

export default function OrganizerDashboardPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const currentUser = useQuery(api.users.current);
  const userProfile = useQuery(api.users.getCurrentUserProfile);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <Spinner />
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to access the organizer dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (currentUser === undefined || userProfile === undefined) {
    return <Spinner fullScreen />;
  }

  // Check if user has organizer role
  if (!userProfile?.profile?.roles?.includes("organizer")) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="border-orange-200 bg-orange-50">
          <Users className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Access Denied:</strong> You need organizer privileges to access this dashboard. 
            Please contact support to upgrade your account.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <OrganizerDashboard />;
} 