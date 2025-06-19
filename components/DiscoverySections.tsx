"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Calendar, Package, Users, ArrowRight, MapPin, Star } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import Link from "next/link";
import Image from "next/image";
import { useStorageUrl } from "@/lib/utils";
import { Doc } from "@/convex/_generated/dataModel";
import { useMemo } from "react";
import { getEventCategory } from "@/lib/eventUtils";

export default function DiscoverySections() {
  const events = useQuery(api.events.getUpcoming, {});
  const organizers = useQuery(api.organizers.getVerifiedOrganizersWithStats, {});
  const products = useQuery(api.products.getAll, {});

  // Memoize limited items to prevent unnecessary re-renders
  const limitedEvents = useMemo(() => events?.slice(0, 6) || [], [events]);
  const limitedOrganizers = useMemo(() => organizers?.slice(0, 6) || [], [organizers]);
  const limitedProducts = useMemo(() => products?.slice(0, 6) || [], [products]);

  // Proper loading check: undefined means still loading, empty array means no data
  const isLoading = events === undefined || organizers === undefined || products === undefined;

  return (
    <div className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* Events Section */}
        <Section
          title="Upcoming Events"
          description="Don't miss out on these exciting events happening near you"
          icon={<Calendar className="w-8 h-8 text-blue-600" />}
          items={limitedEvents}
          renderItem={(event, index) => <EventCard key={(event as Doc<"events">)._id} event={event as Doc<"events">} isPriority={index < 2} />}
          exploreLink="/events"
          exploreText="Explore All Events"
          isLoading={isLoading}
          loadingCount={6}
        />

        {/* Organizers Section */}
        <Section
          title="Top Organizers"
          description="Meet the amazing organizers creating unforgettable experiences"
          icon={<Users className="w-8 h-8 text-purple-600" />}
          items={limitedOrganizers}
          renderItem={(organizer, index) => <OrganizerCard key={(organizer as Doc<"organizer_profiles"> & { live_total_events: number })._id} organizer={organizer as Doc<"organizer_profiles"> & { live_total_events: number }} isPriority={index < 2} />}
          exploreLink="/organizers"
          exploreText="Explore All Organizers"
          isLoading={isLoading}
          loadingCount={6}
        />

        {/* Products Section */}
        <Section
          title="Featured Products"
          description="Discover amazing merchandise and event essentials from our organizers"
          icon={<Package className="w-8 h-8 text-green-600" />}
          items={limitedProducts}
          renderItem={(product, index) => <ProductCard key={(product as Doc<"products">)._id} product={product as Doc<"products">} isPriority={index < 2} />}
          exploreLink="/products"
          exploreText="Explore All Products"
          isLoading={isLoading}
          loadingCount={6}
        />

      </div>
    </div>
  );
}

// Generic Section Component
interface SectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  items: Array<Record<string, unknown>>;
  renderItem: (item: Record<string, unknown>, index: number) => React.ReactNode;
  exploreLink: string;
  exploreText: string;
  isLoading: boolean;
  loadingCount: number;
}

function Section({ title, description, icon, items, renderItem, exploreLink, exploreText, isLoading, loadingCount }: SectionProps) {
  return (
    <section>
      {/* Section Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          {icon}
          <h2 className="text-4xl font-bold text-gray-900 ml-3">{title}</h2>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">{description}</p>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: loadingCount }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <CardHeader className="pb-2">
                <div className="h-6 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
                </div>
                <div className="h-10 bg-gray-200 animate-pulse rounded mt-4"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          items.map(renderItem)
        )}
      </div>

      {/* Explore More Button */}
      {!isLoading && (
        <div className="text-center">
          <Link href={exploreLink}>
            <Button className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group">
              {exploreText}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}

// Event Card Component
interface EventCardProps {
  event: Doc<"events">;
  isPriority: boolean;
}

function EventCard({ event, isPriority }: EventCardProps) {
  const imageUrl = useStorageUrl(event.featured_image_storage_id);
  
  const formattedDate = useMemo(() => 
    new Date(event.start_datetime).toLocaleDateString(), 
    [event.start_datetime]
  );

  // Get event category using utility function
  const eventCategoryInfo = useMemo(() => getEventCategory(event), [event]);

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
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
      <div className="relative h-48 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            priority={isPriority}
            loading={isPriority ? "eager" : "lazy"}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
        )}
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          {event.event_category && (
            <Badge className={`px-3 py-1.5 text-xs font-semibold border backdrop-blur-sm ${getCategoryStyle(event.event_category)}`}>
              {event.event_category}
            </Badge>
          )}
        </div>
        
        {/* Free Event Badge */}
        {event.is_free && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-green-500 text-white hover:bg-green-600 backdrop-blur-sm border border-white/20">
              FREE
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
          {event.title}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {event.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
            {formattedDate}
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
            <span className="line-clamp-1">
              {event.location_type === "online" ? "Online Event" : 
               event.location_type === "hybrid" ? "Hybrid Event" : 
               (event.state && event.city) ? `${event.city}, ${event.state}` :
               "Physical Event"}
            </span>
          </div>
        </div>
        

        
                      <Link href={`/events/${event._id}`} className="block mt-4">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Organizer Card Component
interface OrganizerCardProps {
  organizer: Doc<"organizer_profiles"> & { live_total_events: number };
  isPriority: boolean;
}

function OrganizerCard({ organizer, isPriority }: OrganizerCardProps) {
  const imageUrl = useStorageUrl(organizer.logo_storage_id);

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
      <div className="relative h-48 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={organizer.display_name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            priority={isPriority}
            loading={isPriority ? "eager" : "lazy"}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
            <Users className="w-16 h-16 text-white opacity-70" />
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge className="bg-white text-gray-900 hover:bg-gray-100">
            Organizer
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-1 group-hover:text-purple-600 transition-colors">
          {organizer.display_name}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {organizer.bio || "Creating amazing events and experiences"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-purple-500" />
            {organizer.live_total_events || 0}+ Events Created
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-2 text-yellow-500" />
            {organizer.average_rating || 4.5} Rating
          </div>
        </div>
        
                      <Link href={`/organizers/${organizer._id}`} className="block mt-4">
          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            View Profile
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Product Card Component
interface ProductCardProps {
  product: Doc<"products">;
  isPriority: boolean;
}

function ProductCard({ product, isPriority }: ProductCardProps) {
  const imageUrl = useStorageUrl(product.featured_image_storage_id);
  
  // Memoize price calculation
  const price = useMemo(() => product.base_price / 100, [product.base_price]);

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
      <div className="relative h-48 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            priority={isPriority}
            loading={isPriority ? "eager" : "lazy"}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
            <Package className="w-16 h-16 text-white opacity-70" />
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge className="bg-white text-gray-900 hover:bg-gray-100">
            RM {price.toFixed(2)}
          </Badge>
        </div>
        <div className="absolute top-4 left-4">
          <Badge className="bg-blue-500 text-white">
            Product
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-1 group-hover:text-green-600 transition-colors">
          {product.name}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {product.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <Package className="w-4 h-4 mr-2 text-green-500" />
            {product.stock_quantity || 0} in stock
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-2 text-yellow-500" />
            {product.variants?.length || 0} variants
          </div>
        </div>
        
        <Link href={`/products/${product._id}`} className="block mt-4">
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
            View Product
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
} 