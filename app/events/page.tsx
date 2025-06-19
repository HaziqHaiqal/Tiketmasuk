"use client";

import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import EventCard from "@/components/EventCard";
import { Search, X } from "lucide-react";
import Spinner from "@/components/Spinner";

export default function EventsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);

  // If there's a search query, use search API, otherwise get all events
  const searchResults = useQuery(
    api.events.search, 
    query ? { query } : "skip"
  );
  const allEvents = useQuery(
    api.events.getUpcoming,
    !query ? {} : "skip"
  );

  const events = query ? searchResults : allEvents;

  // Simple component-level loading
  if (!events) {
    return <Spinner fullScreen />;
  }

  type Event = Doc<"events">;
  
  const upcomingEvents = events
    .filter((event: Event) => event.start_datetime > Date.now())
    .sort((a: Event, b: Event) => a.start_datetime - b.start_datetime);

  const pastEvents = events
    .filter((event: Event) => event.start_datetime <= Date.now())
    .sort((a: Event, b: Event) => b.start_datetime - a.start_datetime);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/events?q=${encodeURIComponent(searchInput.trim())}`);
    } else {
      router.push('/events');
    }
  };

  const handleClear = () => {
    setSearchInput("");
    router.push('/events');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for events..."
                className="block w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 m-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          {query ? (
            <>
              <Search className="w-6 h-6 text-gray-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Search Results for &quot;{query}&quot;
                </h1>
                <p className="text-gray-600 mt-1">
                  Found {events.length} events
                </p>
              </div>
            </>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Events</h1>
              <p className="text-gray-600 mt-1">
                Discover amazing events happening near you
              </p>
            </div>
          )}
        </div>

        {/* No Results State */}
        {events.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              {query ? "No events found" : "No events available"}
            </h3>
            <p className="text-gray-600 mt-1">
              {query 
                ? "Try adjusting your search terms or browse all events"
                : "Check back later for new events"
              }
            </p>
            {query && (
              <button
                onClick={() => router.push('/events')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse All Events
              </button>
            )}
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {query ? "Upcoming Events" : `Upcoming Events (${upcomingEvents.length})`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event: Event) => (
                <EventCard key={event._id} eventId={event._id} />
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {query ? "Past Events" : `Past Events (${pastEvents.length})`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((event: Event) => (
                <EventCard key={event._id} eventId={event._id} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}