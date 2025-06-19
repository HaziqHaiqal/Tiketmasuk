"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import {
  CalendarDays,
  MapPin,
  Ticket,
  Check,
  CircleArrowRight,
  LoaderCircle,
  PencilIcon,
  StarIcon,
} from "lucide-react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useStorageUrl } from "@/lib/utils";
import Image from "next/image";

export default function EventCard({ eventId }: { eventId: Id<"events"> }) {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const event = useQuery(api.events.getById, { event_id: eventId });
  const imageUrl = useStorageUrl(event?.featured_image_storage_id);

  if (!event) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const isPastEvent = event.start_datetime < Date.now();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-MY", {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLocationDisplay = () => {
    if (event.location_type === "online") return "Online Event";
    if (event.location_type === "hybrid") return "Hybrid Event";
    
    // For physical events, show actual location if available
    if (event.state && event.city) {
      return `${event.city}, ${event.state}`;
    }
    
    return "Physical Event";
  };

  const getCategoryStyle = (category: string) => {
    const categoryStyles: Record<string, string> = {
      // Music & Entertainment
      'music': 'bg-purple-100 text-purple-800 border-purple-200',
      'concert': 'bg-purple-100 text-purple-800 border-purple-200',
      'festival': 'bg-pink-100 text-pink-800 border-pink-200',
      'party': 'bg-pink-100 text-pink-800 border-pink-200',
      
      // Business & Professional
      'business': 'bg-blue-100 text-blue-800 border-blue-200',
      'conference': 'bg-blue-100 text-blue-800 border-blue-200',
      'workshop': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'seminar': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'networking': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      
      // Education & Learning
      'education': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'training': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'course': 'bg-green-100 text-green-800 border-green-200',
      'webinar': 'bg-teal-100 text-teal-800 border-teal-200',
      
      // Sports & Fitness
      'sports': 'bg-orange-100 text-orange-800 border-orange-200',
      'fitness': 'bg-orange-100 text-orange-800 border-orange-200',
      'marathon': 'bg-red-100 text-red-800 border-red-200',
      'tournament': 'bg-red-100 text-red-800 border-red-200',
      
      // Arts & Culture
      'art': 'bg-violet-100 text-violet-800 border-violet-200',
      'exhibition': 'bg-violet-100 text-violet-800 border-violet-200',
      'theater': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
      'cultural': 'bg-rose-100 text-rose-800 border-rose-200',
      
      // Food & Lifestyle
      'food': 'bg-amber-100 text-amber-800 border-amber-200',
      'cooking': 'bg-amber-100 text-amber-800 border-amber-200',
      'lifestyle': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'wellness': 'bg-lime-100 text-lime-800 border-lime-200',
      
      // Technology
      'technology': 'bg-slate-100 text-slate-800 border-slate-200',
      'tech': 'bg-slate-100 text-slate-800 border-slate-200',
      'startup': 'bg-gray-100 text-gray-800 border-gray-200',
      
      // Community & Social
      'community': 'bg-sky-100 text-sky-800 border-sky-200',
      'social': 'bg-sky-100 text-sky-800 border-sky-200',
      'charity': 'bg-green-100 text-green-800 border-green-200',
      'fundraising': 'bg-green-100 text-green-800 border-green-200',
    };
    
    const normalizedCategory = category.toLowerCase();
    return categoryStyles[normalizedCategory] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div
      onClick={() => router.push(`/events/${eventId}`)}
      className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 cursor-pointer overflow-hidden relative ${
        isPastEvent ? "opacity-75 hover:opacity-100" : ""
      }`}
    >
      {/* Event Image */}
      <div className="relative w-full h-48">
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <CalendarDays className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4 flex gap-2">
          {event.event_category && (
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getCategoryStyle(event.event_category)} backdrop-blur-sm`}>
              {event.event_category}
            </span>
          )}
          {isPastEvent && (
            <span className="bg-gray-900/70 text-white px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
              Past Event
            </span>
          )}
        </div>
        
        {/* Free Event Badge */}
        {event.is_free && !isPastEvent && (
          <div className="absolute top-4 right-4">
            <span className="bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/20">
              FREE
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {/* Event Title */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 line-clamp-2">
              {event.title}
            </h2>
            {event.short_description && (
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                {event.short_description}
              </p>
            )}
          </div>

          {/* Event Details */}
          <div className="space-y-3">
            <div className="flex items-center text-gray-600">
              <CalendarDays className="w-4 h-4 mr-3 flex-shrink-0" />
              <span className="text-sm">
                {formatDate(event.start_datetime)}
              </span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-3 flex-shrink-0" />
              <span className="text-sm">
                {getLocationDisplay()}
              </span>
            </div>

            {event.max_attendees && (
              <div className="flex items-center text-gray-600">
                <Ticket className="w-4 h-4 mr-3 flex-shrink-0" />
                <span className="text-sm">
                  {event.current_attendees || 0} / {event.max_attendees} attendees
                </span>
              </div>
            )}
          </div>



          {/* Action Button */}
          <div className="pt-2">
            {event.is_free ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle free event registration
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
              >
                Register for Free
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle paid event ticket purchase
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
              >
                Get Tickets
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
