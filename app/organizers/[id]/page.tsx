"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Package, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Star,
  Clock
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

interface OrganizerPageProps {
  params: Promise<{
    id: string;
  }>;
}

function OrganizerPageContent({ organizerId }: { organizerId: string }) {
  const organizer = useQuery(api.organizers.getProfileWithStats, {
    organizerId: organizerId as Id<"organizer_profiles">,
  });

  const organizerEvents = useQuery(api.events.getByOrganizer, {
    organizer_id: organizerId as Id<"organizer_profiles">,
  });

  const organizerProducts = useQuery(api.products.getByOrganizer, {
    organizer_id: organizerId as Id<"organizer_profiles">,
  });

  // Note: Image URLs removed from schema - using placeholder logic
  const logoUrl = null; // organizer?.logoUrl;
  const bannerUrl = null; // organizer?.bannerUrl;

  const getOrganizerTypeLabel = () => {
    if (!organizer || !organizer.organizerType) return "";
    const labels: Record<string, string> = {
      individual: "Individual",
      business: "Business"
    };
    return labels[organizer.organizerType] || organizer.organizerType;
  };

  const getVerificationBadge = () => {
    if (!organizer) return null;
    if (organizer.isVerified) {
      return <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending Verification</Badge>;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-MY", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/organizers"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Organizers
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Banner Section */}
          <div className="relative h-64 bg-gradient-to-br from-purple-400 to-pink-500">
            {bannerUrl && (
              <Image
                src={bannerUrl}
                alt={`${organizer?.displayName || 'Organizer'} banner`}
                fill
                className="object-cover"
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {/* Logo and Basic Info Overlay */}
            <div className="absolute bottom-6 left-6 flex items-end gap-6">
              <div className="w-24 h-24 rounded-full bg-white p-2 shadow-lg">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={organizer?.displayName || 'Organizer'}
                    width={88}
                    height={88}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>
              
              <div className="text-white pb-2">
                {organizer ? (
                  <>
                    <h1 className="text-3xl font-bold">{organizer.displayName}</h1>
                    <p className="text-purple-100">{getOrganizerTypeLabel()}</p>
                  </>
                ) : (
                  <>
                    <div className="h-8 w-48 bg-white/20 rounded animate-pulse mb-2"></div>
                    <div className="h-5 w-32 bg-white/20 rounded animate-pulse"></div>
                  </>
                )}
              </div>
            </div>

            {/* Verification Badge */}
            <div className="absolute top-6 right-6">
              {organizer ? getVerificationBadge() : (
                <div className="h-6 w-20 bg-white/20 rounded animate-pulse"></div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex px-8">
              <button className="flex items-center gap-2 px-4 py-4 border-b-2 border-purple-600 text-purple-600 font-medium">
                <Users className="w-4 h-4" />
                Profile
              </button>
              <Link
                href={`/organizers/${organizerId}/events`}
                className="flex items-center gap-2 px-4 py-4 text-gray-600 hover:text-gray-900"
              >
                <Calendar className="w-4 h-4" />
                Events ({organizerEvents?.length || 0})
              </Link>
              <Link
                href={`/organizers/${organizerId}/store`}
                className="flex items-center gap-2 px-4 py-4 text-gray-600 hover:text-gray-900"
              >
                <Package className="w-4 h-4" />
                Store ({organizerProducts?.length || 0})
              </Link>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8">
            {!organizer ? (
              // Loading state for profile content
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="h-6 bg-gray-200 animate-pulse rounded w-1/3"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
                        <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <div className="h-6 bg-gray-200 animate-pulse rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-gray-200 animate-pulse rounded"></div>
                          <div className="h-4 bg-gray-200 animate-pulse rounded w-48"></div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="h-6 bg-gray-200 animate-pulse rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2"></div>
                          <div className="h-4 bg-gray-200 animate-pulse rounded w-1/3"></div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* About Section */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>About {organizer.displayName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed">
                        {organizer.storeDescription || "This organizer hasn't added a description yet."}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {organizer.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <a href={`tel:${organizer.phone}`} className="text-blue-600 hover:underline">
                            {organizer.phone}
                          </a>
                        </div>
                      )}
                      
                      {organizer.website && (
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-gray-400" />
                          <a 
                            href={organizer.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline"
                          >
                            {organizer.website}
                          </a>
                        </div>
                      )}

                      {organizer.primaryLocation && (
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-600">
                            {organizer.primaryLocation}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Stats Sidebar */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Events</span>
                        <span className="font-semibold">{organizer.liveTotalEvents || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">4.5</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Member Since</span>
                        <span className="font-semibold">{formatDate(organizer.createdAt || organizer._creationTime)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Business Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Business Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <span className="text-gray-600 block text-sm">Business Name</span>
                        <p className="font-medium">{organizer.businessName || organizer.displayName}</p>
                      </div>
                      
                      {organizer.businessRegistration && (
                        <div>
                          <span className="text-gray-600 block text-sm">Registration</span>
                          <p className="font-medium">{organizer.businessRegistration}</p>
                        </div>
                      )}

                      <div>
                        <span className="text-gray-600 block text-sm">Account Type</span>
                        <Badge variant="outline" className="mt-1">
                          {getOrganizerTypeLabel()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrganizerPage({ params }: OrganizerPageProps) {
  const [organizerId, setOrganizerId] = useState<string | null>(null);

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params;
      setOrganizerId(resolvedParams.id);
    }
    resolveParams();
  }, [params]);

  if (!organizerId) {
    return <div>Loading...</div>;
  }

  return <OrganizerPageContent organizerId={organizerId} />;
} 