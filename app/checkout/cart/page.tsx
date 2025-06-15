"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import {
  Calendar,
  MapPin,
  Ticket,
  Clock,
  ArrowRight,
  Trash2,
  ShoppingCart
} from "lucide-react";
import { useStorageUrl } from "@/lib/utils";
import { clearCheckoutSessionData } from "@/lib/utils";
import Image from "next/image";
import Spinner from "@/components/Spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { getMinPrice } from "@/lib/eventUtils";

function CartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  
  const eventId = searchParams.get("eventId") as Id<"events">;
  const waitingListId = searchParams.get("waitingListId") as Id<"waiting_list">;

  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");

  const event = useQuery(api.events.getById, { event_id: eventId });
  const queuePosition = useQuery(
    api.waitingList.getQueuePosition,
    isAuthenticated ? {
      event_id: eventId,
      user_id: "", // Will be handled by the backend using ctx.auth
    } : "skip"
  );
  
  const imageUrl = useStorageUrl(event?.image_storage_id);

  // Calculate offer validity
  const hasValidOffer = queuePosition?.status === "offered";
  const offerExpiresAt = queuePosition?.offer_expires_at ?? 0;
  const isExpired = Date.now() > offerExpiresAt;

  useEffect(() => {
    if (!hasValidOffer || isExpired) return;

    const calculateTimeRemaining = () => {
      const diff = offerExpiresAt - Date.now();
      if (diff <= 0) {
        setTimeRemaining("Expired");
        // Clear all session storage data when timer reaches zero
        clearCheckoutSessionData();
        // Redirect when timer reaches zero
        router.push(`/event/${eventId}`);
        return;
      }

      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [offerExpiresAt, hasValidOffer, isExpired, eventId, router]);

  const handleProceedToDetails = () => {
    if (!event) return;

    setIsLoading(true);
    router.push(
      `/checkout/details?eventId=${eventId}&waitingListId=${waitingListId}&userType=authenticated`
    );
  };

  const handleLeaveQueue = async () => {
    if (!waitingListId) return;
    
    // Implementation for leaving queue would go here
    router.push(`/event/${eventId}`);
  };

  // Wait for auth to load
  if (authLoading) {
    return <Spinner />;
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    window.location.href = '/auth/login';
    return <Spinner />;
  }

  if (!event) {
    return <Spinner />;
  }

  // Redirect if user doesn't have valid offer
  if (!queuePosition || queuePosition.status !== "offered" || isExpired) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your Cart</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Review your ticket selection before proceeding to checkout
          </p>
          {hasValidOffer && (
            <Badge variant="secondary" className="mt-3 bg-blue-100 text-blue-800 hover:bg-blue-100">
              <Clock className="w-3 h-3 mr-1" />
              Reserved • Expires in {timeRemaining}
            </Badge>
          )}
        </div>

        {/* Progress Indicator */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mb-2">
                  1
                </div>
                <span className="text-sm font-medium text-blue-600">Cart</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-sm font-medium mb-2">
                  2
                </div>
                <span className="text-sm font-medium text-gray-400">Details</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-sm font-medium mb-2">
                  3
                </div>
                <span className="text-sm font-medium text-gray-400">Summary</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-sm font-medium mb-2">
                  4
                </div>
                <span className="text-sm font-medium text-gray-400">Payment</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-blue-600" />
                  Ticket Details
                </CardTitle>
                <CardDescription>
                  Your selected ticket for this event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Event Image and Info */}
                  <div className="flex gap-4">
                    {imageUrl && (
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={imageUrl}
                          alt={event.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{event.name}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(event.event_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(event.event_date).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Ticket Details */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">General Admission</h4>
                        <p className="text-sm text-gray-600">Standard entry ticket</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg text-gray-900">RM {((getMinPrice(event) / 100) * queuePosition.quantity).toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Qty: {queuePosition.quantity}</div>
                      </div>
                    </div>
                  </div>

                  <Separator />


                  {/* Important Notes */}
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-900 mb-2">Important Notes</h4>
                    <ul className="text-sm text-orange-800 space-y-1">
                      <li>• Please bring valid ID for entry</li>
                      <li>• Tickets are non-refundable</li>
                      <li>• Event details may be subject to change</li>
                      <li>• Please arrive 30 minutes before start time</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Event Summary */}
                <div>
                  <h4 className="font-semibold text-base mb-3">{event.name}</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.event_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(event.event_date).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Ticket × {queuePosition.quantity}</span>
                      <span>RM {((getMinPrice(event) / 100) * queuePosition.quantity).toFixed(2)}</span>
                    </div>
                  <div className="flex justify-between text-sm">
                    <span>Service Fee</span>
                    <span>RM 0.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>RM {((getMinPrice(event) / 100) * queuePosition.quantity).toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                {/* Countdown Timer */}
                {hasValidOffer && !isExpired && (
                  <div className="bg-red-50 p-3 rounded-lg text-center border border-red-200">
                    <div className="text-sm text-red-700 mb-1">Queue expires in</div>
                    <div className="text-lg font-bold text-red-900">{timeRemaining}</div>
                  </div>
                )}

                {/* Security Notice */}
                {/* <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Secure Checkout</span>
                  </div>
                  <p className="text-blue-700 text-xs mt-1">
                    Your payment information is protected with bank-level security
                  </p>
                </div> */}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleProceedToDetails}
                    disabled={isLoading || !hasValidOffer || isExpired}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {isLoading ? (
                      "Processing..."
                    ) : (
                      <>
                        Proceed to Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleLeaveQueue}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Leave Queue
                  </Button>
                </div>

                {/* Help Text */}
                <div className="text-xs text-gray-500 text-center">
                  Need help? Contact our support team
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CartContent />
    </Suspense>
  );
}
