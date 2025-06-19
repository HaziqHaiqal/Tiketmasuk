"use client";

import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useMemo } from "react";
import EventCard from "@/components/EventCard";
import { Search, X, Filter, ChevronDown, Calendar, MapPin, DollarSign } from "lucide-react";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

function EventsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);
  
  // Filter states
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "date_asc" | "date_desc">("newest");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [showFilters, setShowFilters] = useState(false);

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

  type Event = Doc<"events">;
  
  // Get unique categories and location types for filter options
  const availableCategories = useMemo(() => {
    if (!events) return [];
    const categorySet = new Set<string>();
    events.forEach((event: Event) => {
      if (event.event_category) {
        categorySet.add(event.event_category);
      }
    });
    return Array.from(categorySet).sort();
  }, [events]);

  const malaysianStates = [
    { value: "Johor", label: "Johor" },
    { value: "Kedah", label: "Kedah" },
    { value: "Kelantan", label: "Kelantan" },
    { value: "Melaka", label: "Melaka" },
    { value: "Negeri Sembilan", label: "Negeri Sembilan" },
    { value: "Pahang", label: "Pahang" },
    { value: "Penang", label: "Penang" },
    { value: "Perak", label: "Perak" },
    { value: "Perlis", label: "Perlis" },
    { value: "Sabah", label: "Sabah" },
    { value: "Sarawak", label: "Sarawak" },
    { value: "Selangor", label: "Selangor" },
    { value: "Terengganu", label: "Terengganu" },
    { value: "Kuala Lumpur", label: "Kuala Lumpur" },
    { value: "Labuan", label: "Labuan" },
    { value: "Putrajaya", label: "Putrajaya" }
  ];

  // Apply filters and sorting
  const filteredAndSortedEvents = useMemo(() => {
    if (!events) return [];
    let filtered = [...events];

    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((event: Event) => 
        event.event_category && selectedCategories.includes(event.event_category)
      );
    }

    // Apply state filter
    if (selectedStates.length > 0) {
      filtered = filtered.filter((event: Event) => 
        event.state && selectedStates.includes(event.state)
      );
    }

    // Apply price filter
    if (priceFilter === "free") {
      filtered = filtered.filter((event: Event) => event.is_free);
    } else if (priceFilter === "paid") {
      filtered = filtered.filter((event: Event) => !event.is_free);
    }

    // Apply sorting
    filtered.sort((a: Event, b: Event) => {
      switch (sortBy) {
        case "newest":
          return b._creationTime - a._creationTime;
        case "oldest":
          return a._creationTime - b._creationTime;
        case "date_asc":
          return a.start_datetime - b.start_datetime;
        case "date_desc":
          return b.start_datetime - a.start_datetime;
        default:
          return a.start_datetime - b.start_datetime;
      }
    });

    return filtered;
  }, [events, selectedCategories, selectedStates, priceFilter, sortBy]);
  
  const upcomingEvents = filteredAndSortedEvents
    .filter((event: Event) => event.start_datetime > Date.now());

  const pastEvents = filteredAndSortedEvents
    .filter((event: Event) => event.start_datetime <= Date.now());

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

  const clearAllFilters = () => {
    setSortBy("newest");
    setSelectedCategories([]);
    setSelectedStates([]);
    setPriceFilter("all");
  };

  const hasActiveFilters = selectedCategories.length > 0 || 
                          selectedStates.length > 0 || 
                          priceFilter !== "all" || 
                          sortBy !== "newest";

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleState = (state: string) => {
    setSelectedStates(prev => 
      prev.includes(state) 
        ? prev.filter(s => s !== state)
        : [...prev, state]
    );
  };

  // Loading state
  if (!events) {
    return <Spinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Search and Filter Control Panel */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Search Section */}
          <div className="p-6 border-b border-gray-100">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search events by name, description, organizer..."
                className="block w-full pl-11 pr-32 py-4 border border-gray-300 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Filters Section */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters & Sorting
              </h3>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between text-xs h-9">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="truncate">
                        {sortBy === "newest" ? "Newest" : 
                         sortBy === "oldest" ? "Oldest" :
                         sortBy === "date_asc" ? "Date ↑" :
                         "Date ↓"}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 ml-1 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("newest")}>
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("date_asc")}>
                    Event Date (Earliest)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("date_desc")}>
                    Event Date (Latest)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Categories Filter */}
              {availableCategories.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-between text-xs h-9">
                      <div className="flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5" />
                        <span className="truncate">
                          Categories {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                        </span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 ml-1 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
                    <DropdownMenuLabel>Event Categories</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableCategories.map((category) => (
                      <DropdownMenuCheckboxItem
                        key={category}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => category && toggleCategory(category)}
                      >
                        {category}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* State Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between text-xs h-9">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">
                        State {selectedStates.length > 0 && `(${selectedStates.length})`}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 ml-1 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
                  <DropdownMenuLabel>Malaysian States</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {malaysianStates.map((state) => (
                    <DropdownMenuCheckboxItem
                      key={state.value}
                      checked={selectedStates.includes(state.value)}
                      onCheckedChange={() => toggleState(state.value)}
                    >
                      {state.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Price Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between text-xs h-9">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span className="truncate">
                        {priceFilter === "all" ? "All Price" : priceFilter === "free" ? "Free" : "Paid"}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 ml-1 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-32">
                  <DropdownMenuLabel>Price</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setPriceFilter("all")}>
                    All Events
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriceFilter("free")}>
                    Free Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriceFilter("paid")}>
                    Paid Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Active Filter Badges */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Active filters:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((category) => (
                    <Badge 
                      key={category} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-gray-200 text-xs"
                      onClick={() => toggleCategory(category)}
                    >
                      {category} ×
                    </Badge>
                  ))}
                  {selectedStates.map((state) => (
                    <Badge 
                      key={state} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-gray-200 text-xs"
                      onClick={() => toggleState(state)}
                    >
                      {malaysianStates.find(s => s.value === state)?.label} ×
                    </Badge>
                  ))}
                  {priceFilter !== "all" && (
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-gray-200 text-xs"
                      onClick={() => setPriceFilter("all")}
                    >
                      {priceFilter === "free" ? "Free Events" : "Paid Events"} ×
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
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
                  {hasActiveFilters 
                    ? `Found ${filteredAndSortedEvents.length} events (${events.length} total)`
                    : `Found ${events.length} events`
                  }
                </p>
              </div>
            </>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Events</h1>
              <p className="text-gray-600 mt-1">
                {hasActiveFilters 
                  ? `Showing ${filteredAndSortedEvents.length} of ${events.length} events`
                  : "Discover amazing events happening near you"
                }
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

export default function EventsPage() {
  return (
    <Suspense fallback={<Spinner fullScreen />}>
      <EventsContent />
    </Suspense>
  );
}