"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConvexAuth } from "convex/react";

import EventListItem from "./EventListItem";

export default function OrganizerEventList() {
  const { isAuthenticated } = useConvexAuth();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  // Get organizer profile first
  const organizerProfile = useQuery(
    api.users.getOrganizerProfile,
    isAuthenticated ? {} : "skip"
  );

  const events = useQuery(
    api.events.getByOrganizer,
    organizerProfile ? { organizer_id: organizerProfile._id } : "skip"
  );

  if (!events) {
    return null;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          You haven&apos;t created any events yet. Start by creating your first event!
        </p>
        <Link
          href="/dashboard/organizer/events/create"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Your First Event
        </Link>
      </div>
    );
  }

  const upcomingEvents = events.filter((e: Doc<"events">) => e.start_datetime > Date.now());
  const pastEvents = events.filter((e: Doc<"events">) => e.start_datetime <= Date.now());

  const displayEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Events</h1>
        <Link
          href="/dashboard/organizer/events/create"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={cn(
            "pb-2 px-1 font-medium text-sm",
            activeTab === "upcoming"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Upcoming ({upcomingEvents.length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={cn(
            "pb-2 px-1 font-medium text-sm",
            activeTab === "past"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Past ({pastEvents.length})
        </button>
      </div>

      {/* Event List */}
      <div className="grid gap-4">
        {displayEvents.map((event) => (
          <EventListItem key={event._id} event={event} />
        ))}
      </div>

      {displayEvents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {activeTab === "upcoming"
            ? "No upcoming events"
            : "No past events"}
        </div>
      )}
    </div>
  );
} 