"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { 
  CheckCircle, 
  XCircle,
  Calendar, 
  MapPin, 
  Ticket, 
  Clock, 
  ArrowRight,
  Download,
  Mail,
  Home,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { clearCheckoutSessionData } from "@/lib/utils";
import Spinner from "@/components/Spinner";
import TicketComponent from "@/components/Ticket";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function AcknowledgementContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useUser();
  
  // Handle both URL formats:
  // 1. /acknowledgement/[billcode] - direct access
  // 2. /acknowledgement/payment-result?billcode=xxx&status_id=xxx - ToyyibPay redirect
  const billCodeFromParams = params.id as string;
  
  // Extract parameters, handling ToyyibPay's duplicate parameters issue
  const getAllParams = (paramName: string) => {
    const allValues = searchParams.getAll(paramName);
    return allValues.find(val => !val.includes('{') && !val.includes('%7B')) || allValues[0];
  };

  const billCodeFromQuery = getAllParams("billcode");
  const billCode = billCodeFromQuery || billCodeFromParams;
  const statusId = getAllParams("status_id");
  const orderId = getAllParams("order_id");
  const bookingRef = getAllParams("booking_ref");
  const transactionId = getAllParams("transaction_id");

  // Clear checkout session data when payment is complete (success or failure)
  useEffect(() => {
    clearCheckoutSessionData();
  }, []);

  // Get payment with booking and event by bill code
  const bookingWithEvent = useQuery(
    api.payments.getPaymentWithBookingAndEventByBillCode,
    billCode ? { bill_code: billCode } : "skip"
  );

  // Mutation to update payment status
  const updatePaymentStatus = useMutation(api.payments.updatePaymentStatus);

  // Get the final transaction ID - prefer from database if available, otherwise from URL
  const finalTransactionId = bookingWithEvent?.payment?.transaction_reference || transactionId;
  const finalBookingRef = bookingWithEvent?.booking?.booking_reference || bookingRef;

  // Debug logging to show clean data structure
  console.log("Payment References:", {
    billCode,                    // ToyyibPay's bill reference (from URL)
    transactionId,              // From URL params
    finalTransactionId,         // Final transaction ID (database preferred)
    orderId,                    // Our internal order reference
    bookingRef,                 // From URL params
    finalBookingRef,            // Final booking ref (database preferred)
    statusId,                   // Payment status (1=success, 0/2/3=failed)
    paymentData: bookingWithEvent?.payment // Clean payment data from payments table
  });

  // Determine success/failure status from URL params OR database status
  const isSuccess = statusId === "1" || bookingWithEvent?.payment?.status === "completed";
  const isFailure = statusId === "0" || statusId === "2" || statusId === "3" || bookingWithEvent?.payment?.status === "failed";
  const isPending = bookingWithEvent?.payment?.status === "pending";

  // Get specific error message based on status
  const getErrorMessage = () => {
    switch (statusId) {
      case "0":
        return "Your payment was declined by your bank or card issuer. This could be due to insufficient funds, card restrictions, or security measures.";
      case "2":
        return "Your payment session expired before completion. This usually happens when the payment page is left open for too long.";
      case "3":
        return "There was a technical issue processing your payment. This could be due to network connectivity or system maintenance.";
      default:
        if (bookingWithEvent?.payment?.status === "failed") {
          return "Your payment could not be processed. This might be due to card restrictions, insufficient funds, or network issues.";
        }
        return "Your payment encountered an unexpected issue and could not be completed.";
    }
  };

  // For successful payments, also get the actual ticket
  const tickets = useQuery(
    api.tickets.getByBooking,
    (isSuccess && bookingWithEvent?.booking) ? { booking_id: bookingWithEvent.booking._id } : "skip"
  );
  const ticket = tickets?.[0]; // Get the first ticket

  // Update payment status based on payment result from URL
  useEffect(() => {
    if (billCode && bookingWithEvent && statusId && bookingWithEvent.payment?.status === "pending") {
      const newStatus = statusId === "1" ? "completed" : "failed";
      
      updatePaymentStatus({
        bill_code: billCode,
        status: newStatus,
        transaction_reference: statusId === "1" ? (transactionId || orderId || billCode) : undefined,
        provider_response: {
          billcode: billCode,
          order_id: orderId,
          status_id: statusId,
          transaction_id: transactionId,
          booking_ref: bookingRef,
        }
      }).catch((error: any) => {
        console.error("Failed to update payment status:", error);
      });
    }
  }, [billCode, bookingWithEvent, statusId, orderId, transactionId, bookingRef, updatePaymentStatus]);

  // Show loading until we have booking data
  if (!billCode || bookingWithEvent === undefined) {
    return <Spinner />;
  }

  if (!bookingWithEvent) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Order Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn't find an order with this reference. Please check your email or contact support.
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

  // SUCCESS: Show content similar to /tickets/purchase-success
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="mb-6">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Ticket Purchase Successful!
            </h1>
            <p className="mt-2 text-gray-600">
              Your ticket has been confirmed and is ready to use
            </p>
          </div>

          {/* Show the actual ticket */}
          {ticket && <TicketComponent ticketId={ticket._id} />}

          {/* Payment Information */}
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">
              Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700 font-medium">Payment Reference:</span>
                <div className="font-mono text-green-900 mt-1">{finalTransactionId || 'N/A'}</div>
              </div>
              <div>
                <span className="text-green-700 font-medium">Booking Reference:</span>
                <div className="font-mono text-green-900 mt-1">{finalBookingRef || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
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
                <span>Present this ticket or your email at the event entrance</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Please arrive 30 minutes before the event starts</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={() => router.push("/tickets")}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Ticket className="w-5 h-5" />
              View All My Tickets
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

    // FAILURE: Show failure design
  if (isFailure) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600 max-w-lg mx-auto">
              {getErrorMessage()}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              No charges were made to your account
            </div>
          </div>

          {bookingWithEvent.event && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Event Header */}
              <div className="bg-gray-800 text-white p-6">
                <h2 className="text-2xl font-bold mb-2">{bookingWithEvent.event.name}</h2>
                <div className="flex items-center gap-4 text-gray-300">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(bookingWithEvent.event.event_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(bookingWithEvent.event.event_date).toLocaleTimeString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {bookingWithEvent.event.location}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Event Details */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-gray-600">Ticket × {bookingWithEvent.tickets?.length || 1}</span>
                          <span className="font-semibold text-gray-900">RM {(bookingWithEvent.event.price * (bookingWithEvent.tickets?.length || 1)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-gray-600">Status</span>
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                            <XCircle className="w-3 h-3" />
                            Payment Failed
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Amount Charged</span>
                          <span className="font-semibold text-gray-600">RM 0.00</span>
                        </div>
                      </div>
                    </div>

                    {/* Ticket Holder Details */}
                    {bookingWithEvent.tickets && bookingWithEvent.tickets.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Holder Details</h3>
                        <div className="space-y-4">
                          {bookingWithEvent.tickets.map((ticket, index) => (
                            <div key={ticket._id} className="bg-gray-50 rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-2">Ticket #{index + 1}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Name:</span>
                                  <div className="font-medium text-gray-900">{ticket.holder_name}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Email:</span>
                                  <div className="font-medium text-gray-900">{ticket.holder_email}</div>
                                </div>
                                {ticket.holder_phone && (
                                  <div>
                                    <span className="text-gray-600">Phone:</span>
                                    <div className="font-medium text-gray-900">+60{ticket.holder_phone}</div>
                                  </div>
                                )}
                                <div>
                                  <span className="text-gray-600">Status:</span>
                                  <div className="font-medium text-red-600">Cancelled</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Summary */}
                  <div className="lg:col-span-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Payment Reference</div>
                        <div className="font-mono text-sm text-gray-900">{finalTransactionId || 'N/A'}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Booking Reference</div>
                        <div className="font-mono text-sm text-gray-900">{finalBookingRef || 'N/A'}</div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Total Amount</div>
                        <div className="text-xl font-bold text-gray-900">RM {(bookingWithEvent.event.price * (bookingWithEvent.tickets?.length || 1)).toFixed(2)}</div>
                        <div className="text-xs text-gray-600 font-medium">Not charged to your account</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => router.push(`/event/${bookingWithEvent.event?._id}`)}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                  
                  <button
                    onClick={() => router.push("/")}
                    className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // PENDING status - payment still processing
  if (isPending || (!isSuccess && !isFailure)) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Processing
          </h1>
          <p className="text-gray-600 mb-6">
            Your payment is being processed. Please check back in a few minutes.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Status
            </button>
            <button
              onClick={() => router.push("/")}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  // This should not happen, but fallback to loading
  return <Spinner />;
}

export default function PaymentAcknowledgementPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AcknowledgementContent />
    </Suspense>
  );
} 