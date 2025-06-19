"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CalendarDays, MapPin, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConvexAuth, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import QueueManagement from "@/components/QueueManagement";
import { useStorageUrl } from "@/lib/utils";
import JoinQueue from "@/components/JoinQueue";
import Spinner from "@/components/Spinner";

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
}

function EventPageContent({ eventId }: { eventId: string }) {
  const { isAuthenticated } = useConvexAuth();
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  const currentUser = useQuery(api.users.current);

  const event = useQuery(api.events.getById, {
    event_id: eventId as Id<"events">,
  });

  const imageUrl = useStorageUrl(event?.featured_image_storage_id);

  if (!event) {
    return <Spinner fullScreen />;
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-MY", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = () => {
    if (event.status === "published") {
      return <Badge className="bg-green-100 text-green-800">Published</Badge>;
    }
    if (event.status === "draft") {
      return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
    }
    if (event.moderation_status === "pending_review") {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
    }
    return null;
  };

  const getCategoryBadge = () => {
    if (event.event_category) {
      const categoryLabels = {
        sports: "Sports & Fitness",
        music: "Music & Entertainment", 
        food: "Food & Drink",
        travel: "Travel & Adventure",
        technology: "Technology & Innovation",
        arts: "Arts & Culture",
        business: "Business & Networking",
        education: "Education & Learning",
        health: "Health & Wellness",
        entertainment: "Entertainment & Lifestyle"
      };
      
      return (
        <Badge variant="outline">
          {categoryLabels[event.event_category] || event.event_category}
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Events
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Hero Image */}
          {imageUrl && (
            <div className="aspect-[21/9] relative w-full">
              <Image
                src={imageUrl}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Left Column - Event Details */}
              <div className="lg:col-span-2 space-y-8">
                {/* Header */}
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {getStatusBadge()}
                    {getCategoryBadge()}
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {event.title}
                  </h1>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {/* Event Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                    <div className="flex items-center text-gray-600 mb-2">
                      <CalendarDays className="w-5 h-5 mr-3 text-blue-600" />
                      <span className="text-sm font-medium">Date & Time</span>
                    </div>
                    <p className="text-gray-900 font-medium">
                      {formatDate(event.start_datetime)}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-5 h-5 mr-3 text-blue-600" />
                      <span className="text-sm font-medium">Location</span>
                    </div>
                    <p className="text-gray-900 font-medium">
                      {event.location_type === "online" ? "Online Event" : 
                       event.location_type === "hybrid" ? "Hybrid Event" : 
                       (event.venue_name && event.state) ? `${event.venue_name}, ${event.city}, ${event.state}` :
                       (event.state && event.city) ? `${event.city}, ${event.state}` :
                       "Physical Event"}
                    </p>
                  </div>

                  {event.max_attendees && (
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                      <div className="flex items-center text-gray-600 mb-2">
                        <Users className="w-5 h-5 mr-3 text-blue-600" />
                        <span className="text-sm font-medium">Capacity</span>
                      </div>
                      <p className="text-gray-900 font-medium">
                        {event.current_attendees || 0} / {event.max_attendees} attendees
                      </p>
                    </div>
                  )}

                  {event.is_free && (
                    <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                      <div className="flex items-center text-green-600 mb-2">
                        <span className="text-sm font-medium">Pricing</span>
                      </div>
                      <p className="text-green-900 font-bold text-xl">
                        FREE EVENT
                      </p>
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-900">
                    About This Event
                  </h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4">
                    Event Information
                  </h4>
                  <ul className="space-y-2 text-blue-700">
                    <li>• Please arrive 15 minutes before the event starts</li>
                    <li>• Bring a valid ID for entry verification</li>
                    {event.age_restriction && (
                      <li>• Age restriction: {event.age_restriction.min_age}+ years old</li>
                    )}
                    <li>• For questions, contact the event organizer</li>
                  </ul>
                </div>
              </div>

              {/* Right Column - Ticket Purchase / Queue */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <div className="bg-white border rounded-lg p-6 space-y-4">
                    <h3 className="text-lg font-semibold">Get Tickets</h3>
                    
                    {event.is_free ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600 mb-2">FREE</p>
                          <p className="text-gray-600">This is a free event</p>
                        </div>
                        {isAuthenticated ? (
                          <JoinQueue eventId={event._id} />
                        ) : (
                          <Button 
                            onClick={() => setAuthModal("login")}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            Sign in to Register
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {isAuthenticated ? (
                          <JoinQueue eventId={event._id} />
                        ) : (
                          <div className="text-center space-y-4">
                            <p className="text-gray-600">Sign in to view ticket options</p>
                            <Button 
                              onClick={() => setAuthModal("login")}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              Sign in to Buy Tickets
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventPage({ params }: EventPageProps) {
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    async function resolveParams() {
      const { id } = await params;
      setEventId(id);
    }
    resolveParams();
  }, [params]);

  if (!eventId) {
    return <Spinner fullScreen />;
  }

  return <EventPageContent eventId={eventId} />;
}
