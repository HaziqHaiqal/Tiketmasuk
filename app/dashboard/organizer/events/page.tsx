"use client";

import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import OrganizerEventList from "@/components/OrganizerEventList";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Users } from "lucide-react";
import Spinner from "@/components/Spinner";

export default function OrganizerEventsPage() {
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
    return <Spinner fullScreen />;
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading user data - let global loader handle it
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
            <strong>Access Denied:</strong> You need organizer privileges to manage events.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/dashboard/organizer"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
            <p className="mt-2 text-gray-600">
              Manage your event listings and track sales
            </p>
          </div>
          <Link
            href="/dashboard/organizer/events/create"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </Link>
        </div>

        {/* Event List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                        <OrganizerEventList />
        </div>
      </div>
    </div>
  );
} 