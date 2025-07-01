"use client";

import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import EventForm from "@/components/EventForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Users } from "lucide-react";
import Spinner from "@/components/Spinner";

export default function CreateEventPage() {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);
  const userProfile = useQuery(api.users.getCurrentUserProfile);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to create events.
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
  if (!userProfile?.roles?.includes("organizer")) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="border-orange-200 bg-orange-50">
          <Users className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Access Denied:</strong> You need organizer privileges to create events.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleSuccess = () => {
    router.push("/dashboard/organizer/events");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/dashboard/organizer/events"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Events
          </Link>
        </div>

        {/* Main Container with rounded corners */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Blue Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-10 text-white">
            <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
            <p className="text-blue-100">
              Set up your event with categories and pricing tiers
            </p>
          </div>

          {/* Form Content */}
          <div className="px-8 py-10">
            <EventForm mode="create" onFormSubmit={handleSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
} 