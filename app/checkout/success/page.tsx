"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Ticket, 
  Clock, 
  ArrowRight,
  Download,
  Mail,
  Home
} from "lucide-react";
import { useStorageUrl } from "@/lib/utils";
import Image from "next/image";
import Spinner from "@/components/Spinner";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  
  const billCode = searchParams.get("billCode");
  const statusId = searchParams.get("status_id");
  const orderId = searchParams.get("order_id");
  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // For authenticated users, get their latest ticket
  const userTickets = useQuery(api.events.getUserTickets, { 
    userId: user?.id ?? "" 
  });
  const latestTicket = userTickets?.[userTickets.length - 1];

  const event = useQuery(api.events.getById, latestTicket?.eventId ? { 
    eventId: latestTicket.eventId
  } : "skip");
  
  const imageUrl = useStorageUrl(event?.imageStorageId);

  const isAuthenticated = !!user;

  if (isLoading) {
    return <Spinner />;
  }

  // If authenticated user but no ticket found, redirect
  if (isAuthenticated && !latestTicket) {
    router.push("/");
    return null;
  }

  const displayEvent = event;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-white text-center">
            <div className="mb-4 flex justify-center">
              <CheckCircle className="w-20 h-20" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-green-100 text-lg">
              Your ticket has been confirmed and is ready to use
            </p>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Order Confirmation
          </h2>
          
          {displayEvent && (
            <div className="space-y-6">
              {/* Event Information */}
              <div className="flex gap-4">
                {imageUrl && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={imageUrl}
                      alt={displayEvent.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {displayEvent.name}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(displayEvent.eventDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(displayEvent.eventDate).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{displayEvent.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">Amount Paid</div>
                  <div className="text-xl font-bold text-gray-900">
                    RM {displayEvent.price.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            What's Next?
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>A confirmation email has been sent to {user?.emailAddresses[0]?.emailAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              <span>Present this confirmation or your email at the event entrance</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Please arrive 30 minutes before the event starts</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {isAuthenticated && latestTicket ? (
            <>
              <button
                onClick={() => router.push(`/tickets/${latestTicket._id}`)}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Ticket className="w-5 h-5" />
                View Your Ticket
              </button>
              
              <button
                onClick={() => router.push("/tickets")}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                All My Tickets
              </button>
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-amber-900 mb-2">Want to manage your tickets?</h4>
              <p className="text-sm text-amber-800 mb-3">
                Create an account to easily manage and view all your tickets in one place.
              </p>
              <button
                onClick={() => router.push("/sign-up")}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors text-sm"
              >
                Create Account
              </button>
            </div>
          )}
          
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to Events
          </button>
        </div>

        {/* Payment Information */}
        {billCode && (
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Bill Code: {billCode} • Order ID: {orderId}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <SuccessContent />
    </Suspense>
  );
} 