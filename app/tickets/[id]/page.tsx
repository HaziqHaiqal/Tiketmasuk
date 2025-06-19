"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { redirect, useParams } from "next/navigation";
import Ticket from "@/components/Ticket";
import Link from "next/link";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { useEffect } from "react";

export default function TicketPage() {
  const params = useParams();
  const { isAuthenticated } = useConvexAuth();
  const bookingData = useQuery(api.bookings.getBookingWithDetails, {
    booking_id: params.id as Id<"bookings">,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      redirect("/");
    }

    // Note: User ownership validation will be handled by the backend
    // since Convex Auth doesn't provide the same user profile structure as Clerk

    if (!bookingData?.event) {
      redirect("/tickets");
    }
  }, [isAuthenticated, bookingData]);

  if (!bookingData || !bookingData.event || !bookingData.booking) {
    return null;
  }

  const { booking, event } = bookingData;
  const isCancelled = event.status === "cancelled" || booking.status === "cancelled";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 space-y-8">
          {/* Navigation and Actions */}
          <div className="flex items-center justify-between">
            <Link
              href="/tickets"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Bookings
            </Link>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
                <Download className="w-4 h-4" />
                <span className="text-sm">Save</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
                <Share2 className="w-4 h-4" />
                <span className="text-sm">Share</span>
              </button>
            </div>
          </div>

          {/* Event Info Summary */}
          <div
            className={`bg-white p-6 rounded-lg shadow-sm border ${isCancelled ? "border-red-200" : "border-gray-100"}`}
          >
            <h1 className="text-2xl font-bold text-gray-900">
              {event.title}
            </h1>
            <p className="mt-1 text-gray-600">
              {new Date(event.start_datetime).toLocaleDateString()} at{" "}
              {new Date(event.start_datetime).toLocaleTimeString()}
            </p>
            <p className="text-gray-600">
              {event.location_type === "physical" ? "Physical Event" : 
               event.location_type === "online" ? "Online Event" : "Hybrid Event"}
            </p>
            <div className="mt-4 flex items-center gap-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isCancelled
                    ? "bg-red-50 text-red-700"
                    : booking.status === "confirmed"
                    ? "bg-green-50 text-green-700"
                    : "bg-yellow-50 text-yellow-700"
                }`}
              >
                {isCancelled ? "Cancelled" : 
                 booking.status === "confirmed" ? "Confirmed Booking" :
                 booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
              <span className="text-sm text-gray-500">
                Booked on {new Date(booking.created_at).toLocaleDateString()}
              </span>
              <span className="text-sm text-gray-500">
                #{booking.booking_number}
              </span>
            </div>
            {isCancelled && (
              <p className="mt-4 text-sm text-red-600">
                {event.status === "cancelled" 
                  ? "This event has been cancelled. A refund will be processed if it hasn't been already."
                  : "This booking has been cancelled. Please contact support if you need assistance."
                }
              </p>
            )}
            {booking.payment_status !== "paid" && (
              <p className="mt-4 text-sm text-yellow-600">
                Payment Status: {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                {booking.payment_status === "pending" && " - Please complete your payment to confirm your booking."}
              </p>
            )}
          </div>
        </div>

        {/* Booking/Ticket Component */}
        <Ticket bookingId={booking._id} />

        {/* Additional Information */}
        <div
          className={`mt-8 rounded-lg p-4 ${
            isCancelled
              ? "bg-red-50 border-red-100 border"
              : "bg-blue-50 border-blue-100 border"
          }`}
        >
          <h3
            className={`text-sm font-medium ${
              isCancelled ? "text-red-900" : "text-blue-900"
            }`}
          >
            Need Help?
          </h3>
          <p
            className={`mt-1 text-sm ${
              isCancelled ? "text-red-700" : "text-blue-700"
            }`}
          >
            {isCancelled
              ? "For questions about refunds or cancellations, please contact our support team at support@tiketmasuk.com"
              : "If you have any issues with your booking, please contact our support team at support@tiketmasuk.com"}
          </p>
        </div>
      </div>
    </div>
  );
}
