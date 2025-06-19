"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, Mail, Ticket, Home } from "lucide-react";
import Spinner from "@/components/Spinner";


export default function PaymentAcknowledgementPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get payment status from URL params (ToyyibPay callback)
  const billCode = searchParams.get("billcode");
  const statusId = searchParams.get("status_id");
  const orderId = searchParams.get("order_id");
  const transactionId = searchParams.get("transaction_id");
  const msg = searchParams.get("msg");

  // Get booking by payment reference (using billCode as booking number)
  const booking = useQuery(
    api.bookings.getByPaymentReference,
    billCode ? { payment_reference: billCode } : "skip"
  );

  // Get booking details with event and organizer info
  const bookingDetails = useQuery(
    api.bookings.getBookingWithDetails,
    booking ? { booking_id: booking._id } : "skip"
  );

  // Determine payment status
  const isSuccess = statusId === "1" || booking?.payment_status === "paid";
  const isFailure = statusId === "0" || statusId === "2" || statusId === "3" || booking?.payment_status === "failed";
  const isPending = booking?.payment_status === "pending";

  const getErrorMessage = () => {
    switch (statusId) {
      case "0":
        return "Your payment was declined by your bank or card issuer. This could be due to insufficient funds, card restrictions, or security measures.";
      case "2":
        return "Your payment session expired before completion. This usually happens when the payment page is left open for too long.";
      case "3":
        return "There was a technical issue processing your payment. This could be due to network connectivity or system maintenance.";
      default:
        return "Your payment could not be processed. Please try again or contact support.";
    }
  };

  // Show loading until we have data
  if (!billCode || booking === undefined) {
    return <Spinner fullScreen />;
  }

  // Show error if booking not found
  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t find a booking with this reference. Please check your email or contact support.
          </p>
          {billCode && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6 text-sm">
              <p className="font-medium text-gray-700">Reference: {billCode}</p>
            </div>
          )}
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  // SUCCESS: Payment confirmed
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">
              Booking Confirmed!
            </h1>
            <p className="mt-2 text-gray-600">
              Your payment was successful and your booking is confirmed. We&apos;ve sent confirmation details to your email.
            </p>
          </div>

          {/* Booking Details */}
          {bookingDetails && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking Number:</span>
                  <span className="font-mono font-medium">{booking.booking_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Event:</span>
                  <span className="font-medium">{bookingDetails.event?.title || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>{bookingDetails.event ? new Date(bookingDetails.event.start_datetime).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold">{booking.currency} {(booking.total_amount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className="font-medium text-green-600">Paid</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">
              Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700 font-medium">Transaction ID:</span>
                <div className="font-mono text-green-900 mt-1">{transactionId || orderId || 'N/A'}</div>
              </div>
              <div>
                <span className="text-green-700 font-medium">Booking Reference:</span>
                <div className="font-mono text-green-900 mt-1">{booking.booking_number}</div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              What&apos;s Next?
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>A confirmation email has been sent to {booking.contact_info.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                <span>Your booking confirmation can be used for event entry</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Please arrive 30 minutes before the event starts</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push("/tickets")}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Ticket className="w-5 h-5" />
              View My Bookings
            </button>
            
            <button
              onClick={() => router.push("/")}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              <Home className="w-5 h-5" />
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FAILURE: Payment failed
  if (isFailure) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">
              Payment Failed
            </h1>
            <p className="mt-2 text-gray-600">
              Unfortunately, your payment could not be processed.
            </p>
          </div>

          {/* Error Details */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-900 mb-3">
              What happened?
            </h3>
            <p className="text-red-800 text-sm">
              {getErrorMessage()}
            </p>
            {msg && (
              <div className="mt-3 text-xs text-red-600">
                <span className="font-medium">Technical details:</span> {msg}
              </div>
            )}
          </div>

          {/* Booking Information */}
          {bookingDetails && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking Number:</span>
                  <span className="font-mono font-medium">{booking.booking_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Event:</span>
                  <span className="font-medium">{bookingDetails.event?.title || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span>{booking.currency} {(booking.total_amount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-red-600">Payment Failed</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
                              onClick={() => router.push(`/events/${booking.event_id}`)}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            
            <button
              onClick={() => router.push("/")}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              <Home className="w-5 h-5" />
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PENDING: Payment still processing
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Processing
        </h1>
        <p className="text-gray-600 mb-6">
          Your payment is still being processed. Please check back in a few minutes.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
} 