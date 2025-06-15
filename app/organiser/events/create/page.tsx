"use client";

import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import EventForm from "@/components/EventForm";

export default function CreateEventPage() {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    router.push("/auth/login");
    return null;
  }

  const handleSuccess = () => {
    router.push("/organiser/events");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/organiser/events"
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
            <EventForm mode="create" onSuccess={handleSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
} 