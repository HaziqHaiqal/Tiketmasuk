"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import EventForm from "@/components/EventForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Users } from "lucide-react";
import { useConvexAuth } from "convex/react";
import Spinner from "@/components/Spinner";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const eventId = params.id as Id<"events">;
  
  const event = useQuery(api.events.getById, {
    event_id: eventId,
  });
  const currentUser = useQuery(api.users.current);
  const userProfile = useQuery(api.users.getCurrentUserProfile);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to edit events.
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
            <strong>Access Denied:</strong> You need organizer privileges to edit events.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleSuccess = () => {
    router.push("/dashboard/organizer/events");
  };

  if (event === undefined) {
    return <Spinner fullScreen />;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/dashboard/organizer/events">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold mb-2">Edit Event</h1>
            <p className="text-blue-100">
              Update your event details, categories and pricing
            </p>
          </div>

          {/* Form Content */}
          <div className="px-8 py-10">
            <EventForm
              mode="edit"
              initialData={event}
              onFormSubmit={handleSuccess}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 