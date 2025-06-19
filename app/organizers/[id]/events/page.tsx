"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Calendar, ArrowLeft, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import EventCard from "@/components/EventCard";

interface OrganizerEventsPageProps {
  params: Promise<{
    id: string;
  }>;
}

function OrganizerEventsContent({ organizerId }: { organizerId: string }) {
  const organizer = useQuery(api.organizers.getProfileWithImages, {
    organizer_id: organizerId as Id<"organizer_profiles">,
  });

  const organizerEvents = useQuery(api.events.getByOrganizer, {
    organizer_id: organizerId as Id<"organizer_profiles">,
  });

  // Don't block the entire page
  const upcomingEvents = organizerEvents?.filter(event => event.start_datetime > Date.now()) || [];
  const pastEvents = organizerEvents?.filter(event => event.start_datetime <= Date.now()) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href={`/organizers/${organizerId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to {organizer?.display_name || 'Organizer'}
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              {organizer ? (
                <>
                  <h1 className="text-3xl font-bold text-gray-900">{organizer.display_name}</h1>
                  <p className="text-gray-600">Events & Experiences</p>
                </>
              ) : (
                <>
                  <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="h-5 w-40 bg-gray-200 animate-pulse rounded"></div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <div className="flex">
            <Link
              href={`/organizers/${organizerId}`}
              className="flex items-center gap-2 px-4 py-4 text-gray-600 hover:text-gray-900"
            >
              <Users className="w-4 h-4" />
              Profile
            </Link>
            <button className="flex items-center gap-2 px-4 py-4 border-b-2 border-purple-600 text-purple-600 font-medium">
              <Calendar className="w-4 h-4" />
              Events ({organizerEvents?.length || '...'})
            </button>
            <Link
              href={`/organizers/${organizerId}/store`}
              className="flex items-center gap-2 px-4 py-4 text-gray-600 hover:text-gray-900"
            >
              Store
            </Link>
          </div>
        </div>

        {/* Events Content */}
        {organizerEvents === undefined ? (
          // Loading state for events content
          <div className="space-y-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-6 h-6 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-6">
                    <div className="h-48 bg-gray-200 animate-pulse rounded mb-4"></div>
                    <div className="h-6 bg-gray-200 animate-pulse rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Upcoming Events ({upcomingEvents.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event._id} eventId={event._id} />
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Calendar className="w-6 h-6 text-gray-400" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Past Events ({pastEvents.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastEvents.map((event) => (
                    <EventCard key={event._id} eventId={event._id} />
                  ))}
                </div>
              </div>
            )}

            {/* No Events State */}
            {organizerEvents.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No events yet</h3>
                <p className="text-gray-600">
                  {organizer?.display_name || 'This organizer'} hasn't created any events yet. Check back later for upcoming events!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrganizerEventsPage({ params }: OrganizerEventsPageProps) {
  const [organizerId, setOrganizerId] = useState<string | null>(null);

  useEffect(() => {
    async function resolveParams() {
      const { id } = await params;
      setOrganizerId(id);
    }
    resolveParams();
  }, [params]);

  if (!organizerId) {
    return <Spinner fullScreen />;
  }

  return <OrganizerEventsContent organizerId={organizerId} />;
} 