"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import TicketCard from "@/components/TicketCard";
import Spinner from "@/components/Spinner";
import { Receipt, Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function MyBookingsPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  
  // Get current user and their bookings with event data
  const currentUser = useQuery(api.users.getCurrentUser);
  const bookingsWithEvents = useQuery(
    api.bookings.getBookingsByUserWithEvents,
    isAuthenticated && currentUser ? {
      customer_id: currentUser._id,
    } : "skip"
  );

  // Component-level loading for authentication
  if (isLoading) {
    return <Spinner fullScreen />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Please sign in</h3>
          <p className="text-gray-600 mt-1">
            Sign in to view your bookings and tickets
          </p>
        </div>
      </div>
    );
  }

  // Component-level loading for data
  if (!bookingsWithEvents) {
    return <Spinner fullScreen />;
  }

  // Categorize bookings by status
  const confirmedBookings = bookingsWithEvents.filter((b) => b.status === "confirmed");
  const pendingBookings = bookingsWithEvents.filter((b) => b.status === "pending");
  const cancelledBookings = bookingsWithEvents.filter((b) => b.status === "cancelled" || b.status === "refunded");

  // Categorize confirmed bookings by event date
  const now = Date.now();
  const upcomingBookings = confirmedBookings.filter((b) => b.event && b.event.start_datetime > now);
  const pastBookings = confirmedBookings.filter((b) => b.event && b.event.start_datetime <= now);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="mt-2 text-gray-600">
              Manage and view all your event bookings in one place
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-600">
              <Receipt className="w-5 h-5" />
              <span className="font-medium">
                {bookingsWithEvents.length} Total Booking{bookingsWithEvents.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Confirmed</p>
                <p className="text-2xl font-bold text-gray-900">{confirmedBookings.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingBookings.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <Receipt className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">{cancelledBookings.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Bookings */}
        {pendingBookings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Pending Payment ({pendingBookings.length})
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              Complete your payment to confirm these bookings
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingBookings.map((booking) => (
                <TicketCard key={booking._id} bookingId={booking._id} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingBookings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upcoming Events ({upcomingBookings.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingBookings.map((booking) => (
                <TicketCard key={booking._id} bookingId={booking._id} />
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastBookings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Past Events ({pastBookings.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastBookings.map((booking) => (
                <TicketCard key={booking._id} bookingId={booking._id} />
              ))}
            </div>
          </div>
        )}

        {/* Cancelled/Refunded Bookings */}
        {cancelledBookings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Cancelled & Refunded ({cancelledBookings.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cancelledBookings.map((booking) => (
                <TicketCard key={booking._id} bookingId={booking._id} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {bookingsWithEvents.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No bookings yet
            </h3>
            <p className="text-gray-600 mt-1">
              When you book tickets for events, they&apos;ll appear here
            </p>
            <div className="mt-6">
              <Link
                href="/events"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse Events
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
