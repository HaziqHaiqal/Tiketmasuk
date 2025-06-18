"use client";

import EventCard from "@/components/EventCard";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { CalendarDays, MapPin, Ticket, Users, Star, Crown, Clock } from "lucide-react";
import { useParams } from "next/navigation";
import Spinner from "@/components/Spinner";
import JoinQueue from "@/components/JoinQueue";
import { useConvexAuth } from "convex/react";
import { useStorageUrl } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthModalManager, type AuthModalType } from "@/components/auth/AuthModalManager";
import { useState } from "react";

export default function EventPage() {
  const { isAuthenticated } = useConvexAuth();
  const params = useParams();
  const [authModal, setAuthModal] = useState<AuthModalType>(null);
  
  const event = useQuery(api.events.getById, {
    event_id: params.id as Id<"events">,
  });
  
  const imageUrl = useStorageUrl(event?.image_storage_id);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Get price range from all categories and pricing tiers
  type EventCategory = Doc<"events">["categories"][0];
  type PricingTier = EventCategory["pricing_tiers"][0];
  
  const allPrices = event.categories.flatMap((category: EventCategory) =>
    category.pricing_tiers.map((tier: PricingTier) => tier.price)
  );
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const totalAvailableTickets = event.categories.reduce((sum: number, cat: EventCategory) => sum + cat.available_tickets, 0);
  const totalTickets = event.categories.reduce((sum: number, cat: EventCategory) => sum + cat.total_tickets, 0);

  const getCategoryIcon = (categoryName: string) => {
    const lowerName = categoryName.toLowerCase();
    if (lowerName.includes('vip') || lowerName.includes('platinum')) {
      return <Crown className="w-5 h-5 text-yellow-600" />;
    }
    if (lowerName.includes('premium')) {
      return <Star className="w-5 h-5 text-purple-600" />;
    }
    if (lowerName.includes('km') || lowerName.includes('run')) {
      return <Users className="w-5 h-5 text-green-600" />;
    }
    return <Ticket className="w-5 h-5 text-blue-600" />;
  };

  const getTierBadge = (tierName: string) => {
    const lowerName = tierName.toLowerCase();
    if (lowerName.includes('super early')) {
      return <Badge variant="default" className="text-xs bg-green-600">Super Early Bird</Badge>;
    }
    if (lowerName.includes('early')) {
      return <Badge variant="default" className="text-xs bg-green-500">Early Bird</Badge>;
    }
    if (lowerName.includes('vip')) {
      return <Badge variant="default" className="text-xs bg-yellow-600">VIP</Badge>;
    }
    if (lowerName.includes('limited')) {
      return <Badge variant="default" className="text-xs bg-red-500">Limited</Badge>;
    }
    return null;
  };

  const getBestPrice = (category: EventCategory) => {
    const now = Date.now();
    const availableTiers = category.pricing_tiers.filter((tier: PricingTier) => {
      if (!tier.is_active) return false;
      
      if (tier.availability_type === "time_based") {
        return (!tier.sale_start_date || tier.sale_start_date <= now) &&
               (!tier.sale_end_date || tier.sale_end_date > now);
      }
      
      if (tier.availability_type === "quantity_based") {
        return !tier.max_tickets || !tier.tickets_sold || tier.tickets_sold < tier.max_tickets;
      }
      
      return true; // unlimited
    });
    
    return availableTiers.sort((a: PricingTier, b: PricingTier) => a.price - b.price)[0];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {imageUrl && (
            <div className="aspect-[21/9] relative w-full">
              <Image
                src={imageUrl}
                alt={event.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Column - Event Details */}
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {event.name}
                  </h1>
                  <p className="text-lg text-gray-600">{event.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center text-gray-600 mb-1">
                      <CalendarDays className="w-5 h-5 mr-2 text-blue-600" />
                      <span className="text-sm font-medium">Date</span>
                    </div>
                    <p className="text-gray-900">
                      {new Date(event.event_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center text-gray-600 mb-1">
                      <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                      <span className="text-sm font-medium">Location</span>
                    </div>
                    <p className="text-gray-900">{event.location}</p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center text-gray-600 mb-1">
                      <Ticket className="w-5 h-5 mr-2 text-blue-600" />
                      <span className="text-sm font-medium">Price Range</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-blue-800 font-medium">RM</span>
                      <span className="text-blue-900 font-bold text-xl">
                        {(minPrice / 100).toFixed(2)}
                      </span>
                      {minPrice !== maxPrice && (
                        <>
                          <span className="text-blue-700 font-medium mx-1">-</span>
                          <span className="text-blue-900 font-bold text-xl">
                            {(maxPrice / 100).toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      {event.categories.length} categor{event.categories.length !== 1 ? 'ies' : 'y'} available
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center text-gray-600 mb-1">
                      <Users className="w-5 h-5 mr-2 text-blue-600" />
                      <span className="text-sm font-medium">Availability</span>
                    </div>
                    <p className="text-gray-900">
                      {totalAvailableTickets} / {totalTickets} tickets left
                    </p>
                  </div>
                </div>

                {/* Event Categories Overview */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Ticket className="w-6 h-6 text-blue-600" />
                    Event Categories
                  </h3>
                  
                  <div className="grid gap-4">
                    {event.categories
                      .filter((cat: EventCategory) => cat.is_active)
                      .sort((a: EventCategory, b: EventCategory) => a.sort_order - b.sort_order)
                      .map((category: EventCategory) => {
                        const bestPrice = getBestPrice(category);
                        return (
                          <Card key={category.id} className="border border-gray-200">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  {getCategoryIcon(category.name)}
                                  <div>
                                    <CardTitle className="text-lg">{category.name}</CardTitle>
                                    {category.description && (
                                      <CardDescription className="mt-1">
                                        {category.description}
                                      </CardDescription>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  {bestPrice && (
                                    <div className="text-lg font-bold text-blue-900">
                                      From RM {(bestPrice.price / 100).toFixed(2)}
                                    </div>
                                  )}
                                  <div className="text-sm text-gray-500">
                                    {category.available_tickets} / {category.total_tickets} available
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="pt-0">
                              <div className="space-y-2">
                                <div className="text-sm font-medium text-gray-700 mb-2">
                                  Pricing Options:
                                </div>
                                <div className="grid gap-2">
                                  {category.pricing_tiers
                                    .filter((tier: PricingTier) => tier.is_active)
                                    .sort((a: PricingTier, b: PricingTier) => a.sort_order - b.sort_order)
                                    .slice(0, 3) // Show first 3 tiers
                                    .map((tier: PricingTier) => (
                                      <div key={tier.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{tier.name}</span>
                                          {getTierBadge(tier.name)}
                                          {tier.availability_type === "time_based" && (
                                            <Clock className="w-3 h-3 text-orange-500" />
                                          )}
                                        </div>
                                        <span className="font-bold text-blue-900">
                                          RM {(tier.price / 100).toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  {category.pricing_tiers.length > 3 && (
                                    <div className="text-xs text-gray-500 text-center py-1">
                                      +{category.pricing_tiers.length - 3} more options
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </div>

                {/* Additional Event Information */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Event Information
                  </h3>
                  <ul className="space-y-2 text-blue-700">
                    <li>• Please arrive 30 minutes before the event starts</li>
                    <li>• Tickets are non-refundable</li>
                    <li>• Valid ID required for entry</li>
                    <li>• Event may be cancelled due to weather conditions</li>
                  </ul>
                </div>
              </div>

              {/* Right Column - Ticket Purchase */}
              <div>
                <div className="sticky top-8 space-y-4">
                  <EventCard eventId={params.id as Id<"events">} />

                  {isAuthenticated ? (
                    <JoinQueue
                      eventId={params.id as Id<"events">}
                      userId="" // Will be handled by the backend using ctx.auth
                    />
                  ) : (
                    <Button 
                      onClick={() => setAuthModal("login")}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Sign in to buy tickets
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModalManager open={authModal} onOpenChange={setAuthModal} />
    </div>
  );
}
