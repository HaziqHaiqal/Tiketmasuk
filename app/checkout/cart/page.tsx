"use client";

import { useState, Suspense } from "react";
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
  Trash2
} from "lucide-react";
import { useStorageUrl, calculateFees } from "@/lib/utils";
import Image from "next/image";
import Spinner from "@/components/Spinner";
import CheckoutLayout from "@/components/checkout/CheckoutLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";


function CartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  
  const eventId = searchParams.get("eventId") as Id<"events">;
  const waitingListId = searchParams.get("waitingListId") as Id<"waiting_list">;

  const [isLoading, setIsLoading] = useState(false);

  const event = useQuery(api.events.getById, { event_id: eventId });
  const waitingListEntry = useQuery(
    api.waitingList.getWaitingListEntry,
    waitingListId ? { waiting_list_id: waitingListId } : "skip"
  );
  const queuePosition = useQuery(
    api.waitingList.getQueuePosition,
    isAuthenticated && eventId && waitingListEntry?.ticket_category_id ? {
      event_id: eventId,
      ticket_category_id: waitingListEntry.ticket_category_id,
    } : "skip"
  );
  const ticketCategories = useQuery(
    api.events.getTicketCategories,
    eventId ? { event_id: eventId } : "skip"
  );
  
  const imageUrl = useStorageUrl(event?.featured_image_storage_id);

  // Get the specific ticket category for this queue entry
  const ticketCategory = ticketCategories?.find(cat => cat._id === waitingListEntry?.ticket_category_id);

  // Calculate offer validity
  const hasValidOffer = queuePosition?.status === "offered";
  const offerExpiresAt = queuePosition?.offer_expires_at ?? 0;
  const isExpired = Date.now() > offerExpiresAt;

  // Calculate pricing with fees
  const subtotal = ((ticketCategory?.price || 0) * (queuePosition?.requested_quantity || 0));
  const fees = calculateFees(subtotal);
  const totalAmount = fees.total;

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
    <CheckoutLayout
      currentStep={1}
      offerExpiresAt={offerExpiresAt}
      hasValidOffer={hasValidOffer}
      redirectPath={`/event/${eventId}`}
      title="Your Cart"
      description="Review your ticket selection before proceeding to checkout"
    >

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
                          alt={event.title}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{event.title}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(event.start_datetime).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(event.start_datetime).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">Event Location</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Ticket Details */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{ticketCategory?.name || "General Admission"}</h4>
                        <p className="text-sm text-gray-600">{ticketCategory?.description || "Standard entry ticket"}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg text-gray-900">RM {(((ticketCategory?.price || 0) / 100) * queuePosition.requested_quantity).toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Qty: {queuePosition.requested_quantity}</div>
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
                  <h4 className="font-semibold text-base mb-3">{event.title}</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.start_datetime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(event.start_datetime).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>Event Location</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Ticket × {queuePosition.requested_quantity}</span>
                    <span>RM {(subtotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service Fee</span>
                    <span>RM {(fees.serviceFee / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Processing Fee</span>
                    <span>RM {(fees.processingFee / 100).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>RM {(totalAmount / 100).toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

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
      </CheckoutLayout>
    );
  }

export default function CartPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CartContent />
    </Suspense>
  );
}
