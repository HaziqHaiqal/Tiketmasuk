"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Edit, Trash2, Plus, Calendar, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStorageUrl } from "@/lib/utils";
import Image from "next/image";
import CancelEventButton from "./CancelEventButton";
import { useUser } from "@clerk/nextjs";

export default function OrganiserEventList() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  
  const events = useQuery(
    api.events.getUserEvents,
    user?.id ? { user_id: user.id } : "skip"
  );

  if (!events) {
    return <div>Loading...</div>;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">You haven't created any events yet.</p>
        <Link
          href="/organiser/events/create"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Your First Event
        </Link>
      </div>
    );
  }

  const upcomingEvents = events.filter((e) => e.event_date > Date.now());
  const pastEvents = events.filter((e) => e.event_date <= Date.now());

  const displayEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Events</h1>
        <Link
          href="/organiser/events/create"
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
        {displayEvents.map((event) => {
          const imageUrl = useStorageUrl(event.image_storage_id);
          const isPastEvent = event.event_date < Date.now();
          
          return (
            <div
              key={event._id}
              className="bg-white rounded-lg shadow-md border overflow-hidden"
            >
              <div className="flex">
                {/* Image */}
                <div className="w-32 h-32 flex-shrink-0">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={event.name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{event.name}</h3>
                        {event.is_cancelled && (
                          <Badge variant="destructive">Cancelled</Badge>
                        )}
                        {!event.is_published && (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(event.event_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(event.event_date).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{event.total_tickets} tickets available</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mt-2 line-clamp-2">
                        {event.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/organiser/events/${event._id}/edit`}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      
                                             {!isPastEvent && !event.is_cancelled && (
                         <CancelEventButton 
                           eventId={event._id}
                         />
                       )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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
