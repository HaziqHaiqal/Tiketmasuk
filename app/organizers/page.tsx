"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Calendar, Users, Award, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useStorageUrl } from "@/lib/utils";
import { Doc } from "@/convex/_generated/dataModel";
import Spinner from "@/components/Spinner";

interface OrganizerWithStats {
  _id: Id<"organizer_profiles">;
  _creationTime: number;
  userId?: Id<"users">;
  fullName?: string;
  displayName?: string;
  storeName?: string;
  storeDescription?: string;
  organizerType?: "individual" | "group" | "organization" | "business";
  primaryLocation?: string;
  phone?: string;
  website?: string;
  businessName?: string;
  businessRegistration?: string;
  isVerified?: boolean;
  liveTotalEvents: number;
}

export default function OrganizersPage() {
  const organizers = useQuery(api.organizers.getVerifiedOrganizersWithStats);

  if (organizers === undefined) {
    return <Spinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Organizers</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing event organizers and explore their upcoming events
          </p>
        </div>

        {/* Filter/Search Bar */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700 font-medium">
                {organizers.length} Organizers Found
              </span>
            </div>
          </div>
        </div>

        {/* Organizers Grid */}
        {organizers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Organizers Yet</h3>
            <p className="text-gray-600">Check back later to discover amazing event organizers!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizers.map((organizer) => (
              <OrganizerCard key={organizer._id} organizer={organizer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Individual Organizer Card Component
interface OrganizerCardProps {
  organizer: OrganizerWithStats;
}

function OrganizerCard({ organizer }: OrganizerCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Banner - Use placeholder */}
      <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600">
      </div>

      <div className="p-6 -mt-12 relative">
        {/* Profile Image - Use placeholder */}
        <div className="w-20 h-20 bg-gray-200 rounded-full border-4 border-white mb-4 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-600">
            {organizer.displayName?.charAt(0).toUpperCase() || '?'}
          </span>
        </div>

        {/* Verification Badge */}
        {organizer.isVerified && (
          <div className="absolute top-4 right-4 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </div>
        )}

        {/* Organizer Info */}
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          {organizer.displayName || 'Unknown Organizer'}
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          {organizer.storeDescription || "Creating amazing events and experiences"}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{organizer.liveTotalEvents || 0} Events</span>
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
            <span>4.5/5</span>
          </div>
        </div>

        {/* Location - Use primaryLocation */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{organizer.primaryLocation || 'Location not specified'}</span>
        </div>

        {/* Action Button */}
        <Link
          href={`/organizers/${organizer._id}`}
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg transition-colors duration-200"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
} 