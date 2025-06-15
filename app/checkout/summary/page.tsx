"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  User,
  CreditCard,
  Shield,
  CheckCircle,
  FileText,
} from "lucide-react";
import { useStorageUrl } from "@/lib/utils";
import { clearCheckoutSessionData } from "@/lib/utils";
import Image from "next/image";
import Spinner from "@/components/Spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMinPrice } from "@/lib/eventUtils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
interface TicketHolderData {
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  icPassport: string;
  dateOfBirth: string;
  gender: string;
  country: string;
  state: string;
  address: string;
  postcode: string;
  ticketType: string;
}

interface PurchaseFormData {
  buyerFullName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerCountryCode: string;
  ticketHolders: TicketHolderData[];
  specialRequests: string;
  marketingEmails: boolean;
  eventUpdates: boolean;
}

function SummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  
  const eventId = searchParams.get("eventId") as Id<"events">;
  const waitingListId = searchParams.get("waitingListId") as Id<"waiting_list">;
  const userType = searchParams.get("userType");
  
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [formData, setFormData] = useState<PurchaseFormData | null>(null);
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

  // Handle timer expiration
  useEffect(() => {
    if (hasValidOffer && isExpired) {
      // Clear all session storage data when timer expires
      clearCheckoutSessionData();
      // Redirect to event page when timer expires
      router.push(`/event/${eventId}`);
    }
  }, [hasValidOffer, isExpired, eventId, router]);

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

  // Load form data from session storage
  useEffect(() => {
    const storedData = sessionStorage.getItem('checkoutData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as PurchaseFormData;
        setFormData(data);
      } catch {
        // Redirect back to details if no data
        router.push(`/checkout/details?eventId=${eventId}&waitingListId=${waitingListId}&userType=${userType}`);
      }
    } else {
      // Redirect back to details if no data
      router.push(`/checkout/details?eventId=${eventId}&waitingListId=${waitingListId}&userType=${userType}`);
    }
  }, [eventId, waitingListId, router, userType]);

  // Use the Convex mutation instead of server action
  const createCheckoutSession = useMutation(api.payments.createToyyibPayCheckoutSession);

  const handleProceedToPayment = async () => {
    if (!event || !formData || !acceptTerms || !acceptPrivacy) return;

    setIsLoading(true);

    try {
      const response = await createCheckoutSession({
        eventId,
        waitingListId,
        formData,
        waiver: {
          acceptTerms,
          acceptPrivacy
        }
      });

      // For now, we'll need to handle ToyyibPay integration client-side
      // This is a simplified version - you'll need to implement the full ToyyibPay flow
      alert(`Booking created successfully! Booking Reference: ${response.bookingReference}`);
      
      // Clear stored data since we're proceeding to payment
      clearCheckoutSessionData();
      
      // Redirect to acknowledgement page
      router.push(`/checkout/acknowledgement/${response.bookingReference}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to proceed to payment");
      setIsLoading(false);
    }
  };

  const handleBackToDetails = () => {
    router.push(
      `/checkout/details?eventId=${eventId}&waitingListId=${waitingListId}&userType=${userType}`
    );
  };

  // Wait for auth to load
  if (authLoading) {
    return <Spinner />;
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    window.location.href = '/auth-test';
    return <Spinner />;
  }

  if (!event || !formData) {
    return <Spinner />;
  }

  // Redirect if user doesn't have valid offer
  if (!queuePosition || queuePosition.status !== "offered" || isExpired) {
    return <Spinner />;
  }

  const totalQuantity = formData.ticketHolders.length;
  const totalPrice = getMinPrice(event) * totalQuantity / 100; // Convert from cents

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Order Summary</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Review your information and complete your purchase
          </p>
          {hasValidOffer && (
            <Badge variant="secondary" className="mt-3 bg-amber-100 text-amber-800 hover:bg-amber-100">
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
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-blue-600">Cart</span>
              </div>
              <div className="flex-1 h-0.5 bg-blue-200 mx-4"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mb-2">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-blue-600">Details</span>
              </div>
              <div className="flex-1 h-0.5 bg-blue-200 mx-4"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mb-2">
                  3
                </div>
                <span className="text-sm font-medium text-blue-600">Summary</span>
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
          {/* Summary Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Buyer Information Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Buyer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                    <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                    <p className="text-gray-900">{formData.buyerFullName}</p>
                    </div>
                    <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="text-gray-900">{formData.buyerEmail}</p>
                  </div>
                    <div>
                    <Label className="text-sm font-medium text-gray-600">Phone</Label>
                    <p className="text-gray-900">+60{formData.buyerPhone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Holders Summary */}
            {formData.ticketHolders.map((holder, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Ticket Holder #{index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                      <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                      <p className="text-gray-900">{holder.fullName}</p>
                      </div>
                      <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-gray-900">{holder.email}</p>
                      </div>
                      <div>
                      <Label className="text-sm font-medium text-gray-600">Phone</Label>
                      <p className="text-gray-900">+60{holder.phone}</p>
                      </div>
                      <div>
                      <Label className="text-sm font-medium text-gray-600">IC/Passport</Label>
                      <p className="text-gray-900">{holder.icPassport}</p>
                      </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
                      <p className="text-gray-900">{holder.dateOfBirth ? new Date(holder.dateOfBirth).toLocaleDateString() : "Not provided"}</p>
                    </div>
                      <div>
                      <Label className="text-sm font-medium text-gray-600">Gender</Label>
                      <p className="text-gray-900">{holder.gender}</p>
                      </div>
                      <div>
                      <Label className="text-sm font-medium text-gray-600">Country</Label>
                      <p className="text-gray-900">{holder.country}</p>
                      </div>
                    {holder.country === "Malaysia" && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">State</Label>
                        <p className="text-gray-900">{holder.state}</p>
                      </div>
                    )}
                        <div>
                      <Label className="text-sm font-medium text-gray-600">Postcode</Label>
                      <p className="text-gray-900">{holder.postcode}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Address</Label>
                    <p className="text-gray-900">{holder.address}</p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Special Requests */}
            {formData.specialRequests && (
              <Card>
                <CardHeader>
                  <CardTitle>Special Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-900">{formData.specialRequests}</p>
                </CardContent>
              </Card>
            )}

            {/* Terms & Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Terms & Privacy
                </CardTitle>
                <CardDescription>
                  Please accept our terms and privacy policy to proceed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                                     <Checkbox
                    id="terms"
                     checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                   />
                  <Label htmlFor="terms" className="text-sm font-normal">
                    I accept the{" "}
                    <a href="/terms" className="text-blue-600 hover:underline">
                      Terms and Conditions
                    </a>
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                                     <Checkbox
                    id="privacy"
                     checked={acceptPrivacy}
                    onCheckedChange={(checked) => setAcceptPrivacy(checked === true)}
                   />
                  <Label htmlFor="privacy" className="text-sm font-normal">
                    I accept the{" "}
                    <a href="/privacy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>
                    </Label>
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
                {imageUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={event.name}
                      width={300}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
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
                    <span>Ticket × {totalQuantity}</span>
                    <span>RM {totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service Fee</span>
                    <span>RM 0.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>RM {totalPrice.toFixed(2)}</span>
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

                {/* Navigation Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={isLoading || !acceptTerms || !acceptPrivacy || !hasValidOffer || isExpired}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {isLoading ? (
                      "Processing..."
                    ) : (
                      <>
                        Proceed to Payment
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleBackToDetails}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <SummaryContent />
    </Suspense>
  );
} 