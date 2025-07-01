"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Package, ArrowLeft, Users, Calendar, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useStorageUrl } from "@/lib/utils";
import Spinner from "@/components/Spinner";

interface OrganizerStorePageProps {
  params: Promise<{
    id: string;
  }>;
}

function OrganizerStoreContent({ organizerId }: { organizerId: string }) {
  const organizer = useQuery(api.organizers.getProfile, {
    organizerId: organizerId as Id<"organizer_profiles">,
  });

  const products = useQuery(api.products.getByOrganizer, {
    organizer_id: organizerId as Id<"organizer_profiles">,
  });

  // Don't block the entire page

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
            Back to {organizer?.displayName || 'Organizer'}
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
                  <h1 className="text-3xl font-bold text-gray-900">{organizer.displayName}</h1>
                  <p className="text-gray-600">Official Store</p>
                </>
              ) : (
                <>
                  <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="h-5 w-32 bg-gray-200 animate-pulse rounded"></div>
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
            <Link
              href={`/organizers/${organizerId}/events`}
              className="flex items-center gap-2 px-4 py-4 text-gray-600 hover:text-gray-900"
            >
              <Calendar className="w-4 h-4" />
              Events
            </Link>
            <button className="flex items-center gap-2 px-4 py-4 border-b-2 border-purple-600 text-purple-600 font-medium">
              <Package className="w-4 h-4" />
              Store ({products?.length || '...'})
            </button>
          </div>
        </div>

        {/* Store Content */}
        {products === undefined ? (
          // Loading state for products
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-6 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-gray-200 animate-pulse"></div>
                  <CardHeader className="pb-2">
                    <div className="h-6 bg-gray-200 animate-pulse rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 animate-pulse rounded w-1/3"></div>
                    </div>
                    <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : products.length > 0 ? (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Products ({products.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductStoreCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Store Coming Soon</h3>
            <p className="text-gray-600">
              {organizer?.displayName || 'This organizer'} hasn't added any products to their store yet. Check back later for merchandise and event essentials!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Product Card Component for Store
interface ProductStoreCardProps {
  product: any; // Using any for now as we have the product structure
}

function ProductStoreCard({ product }: ProductStoreCardProps) {
  const imageUrl = useStorageUrl(product.featured_image_storage_id);
  const price = product.base_price / 100;

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
      <div className="relative h-48 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
          <Badge className="bg-green-500 text-white">
            {product.category}
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
            {product.track_inventory 
              ? `${product.stock_quantity || 0} in stock`
              : "In stock"
            }
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

export default function OrganizerStorePage({ params }: OrganizerStorePageProps) {
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

  return <OrganizerStoreContent organizerId={organizerId} />;
} 