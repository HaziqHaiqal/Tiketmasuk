"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Calendar, Users, Award } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useStorageUrl } from "@/lib/utils";
import { Doc } from "@/convex/_generated/dataModel";
import Spinner from "@/components/Spinner";

type OrganizerWithStats = Doc<"organizer_profiles"> & {
  live_total_events: number;
};

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
  const logoUrl = useStorageUrl(organizer.logo_storage_id);
  const bannerUrl = useStorageUrl(organizer.banner_storage_id);

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
      {/* Banner/Header Image */}
      <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt={`${organizer.display_name} banner`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" />
        )}
        
        {/* Logo Overlay */}
        <div className="absolute -bottom-8 left-6">
          <div className="w-16 h-16 rounded-full bg-white p-1 shadow-lg">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={organizer.display_name}
                width={64}
                height={64}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-500" />
              </div>
            )}
          </div>
        </div>

        {/* Verification Badge */}
        {organizer.verification_status === "verified" && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-green-500 text-white">
              <Award className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="pt-12 pb-2">
        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
          {organizer.display_name}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {organizer.bio || "Creating amazing events and experiences"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
            <span>{organizer.live_total_events || 0} Events</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Star className="w-4 h-4 mr-2 text-yellow-500" />
            <span>{organizer.average_rating || 4.5}/5</span>
          </div>
        </div>

        {/* Location */}
        {organizer.business_address && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
            <span className="line-clamp-1">
              {organizer.business_address.city}, {organizer.business_address.state_province}
            </span>
          </div>
        )}

        {/* Categories */}
        {organizer.specialties && organizer.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {organizer.specialties.slice(0, 2).map((spec: string) => (
              <Badge key={spec} variant="secondary" className="text-xs">
                {spec}
              </Badge>
            ))}
            {organizer.specialties.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{organizer.specialties.length - 2} more
              </Badge>
            )}
          </div>
        )}
        
        {/* View Profile Button */}
        <Link href={`/organizers/${organizer._id}`} className="block">
          <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
            View Profile & Events
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
} 