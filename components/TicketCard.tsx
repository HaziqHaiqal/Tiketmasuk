"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
  CalendarDays,
  MapPin,
  ArrowRight,
  Clock,
  AlertTriangle,
  Users,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import Spinner from "./Spinner";


export default function TicketCard({ bookingId }: { bookingId: Id<"bookings"> }) {
  const bookingData = useQuery(api.bookings.getBookingWithDetails, { booking_id: bookingId });

  if (!bookingData || !bookingData.event || !bookingData.booking) return <Spinner fullScreen />;

  const { booking, event, ticket_items } = bookingData;
  const isPastEvent = event.start_datetime < Date.now();
  const isCancelled = event.status === "cancelled" || booking.status === "cancelled";

  // Calculate total tickets
  const totalTickets = ticket_items.reduce((sum, item) => sum + item.quantity, 0);

  const statusColors = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-100",
    confirmed: isPastEvent
      ? "bg-gray-50 text-gray-600 border-gray-200"
      : "bg-green-50 text-green-700 border-green-100",
    cancelled: "bg-red-50 text-red-700 border-red-100",
    refunded: "bg-red-50 text-red-700 border-red-100",
    no_show: "bg-gray-50 text-gray-600 border-gray-200",
  };

  const statusText = {
    pending: "Pending",
    confirmed: isPastEvent ? "Ended" : "Confirmed",
    cancelled: "Cancelled",
    refunded: "Refunded",
    no_show: "No Show",
  };

  return (
    <Link
      href={`/tickets/${bookingId}`}
      className={`block bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border ${isCancelled ? "border-red-200" : "border-gray-100"
        } overflow-hidden ${isPastEvent ? "opacity-75 hover:opacity-100" : ""}`}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {event.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Booked on {new Date(booking.created_at).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Receipt className="w-3 h-3" />
              {booking.booking_number}
            </p>
            {isCancelled && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {event.status === "cancelled" ? "Event Cancelled" : "Booking Cancelled"}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${isCancelled
                  ? "bg-red-50 text-red-700 border-red-100"
                  : statusColors[booking.status]
                }`}
            >
              {isCancelled
                ? "Cancelled"
                : statusText[booking.status]}
            </span>
            {isPastEvent && !isCancelled && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                Past Event
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-gray-600">
            <CalendarDays
              className={`w-4 h-4 mr-2 ${isCancelled ? "text-red-600" : ""}`}
            />
            <span className="text-sm">
              {new Date(event.start_datetime).toLocaleDateString()}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {new Date(event.start_datetime).toLocaleTimeString()}
            </span>
          </div>

          <div className="flex items-center text-gray-600">
            <MapPin
              className={`w-4 h-4 mr-2 ${isCancelled ? "text-red-600" : ""}`}
            />
            <span className="text-sm">
              {event.location_type === "physical" ? "Physical Event" :
                event.location_type === "online" ? "Online Event" : "Hybrid Event"}
            </span>
          </div>

          <div className="flex items-center text-gray-600">
            <Users
              className={`w-4 h-4 mr-2 ${isCancelled ? "text-red-600" : ""}`}
            />
            <span className="text-sm">
              {totalTickets} ticket{totalTickets > 1 ? 's' : ''}
              {booking.attendees && booking.attendees.length > 0 &&
                ` • ${booking.attendees.length} attendee${booking.attendees.length > 1 ? 's' : ''}`
              }
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span
            className={`font-medium ${isCancelled
                ? "text-red-600"
                : isPastEvent
                  ? "text-gray-600"
                  : "text-blue-600"
              }`}
          >
            RM {(booking.total_amount / 100).toFixed(2)}
          </span>
          <span className="text-gray-600 flex items-center">
            View Booking <ArrowRight className="w-4 h-4 ml-1" />
          </span>
        </div>

        {/* Payment status indicator */}
        {booking.payment_status !== "paid" && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className={`text-xs px-2 py-1 rounded-full ${booking.payment_status === "pending" ? "bg-yellow-50 text-yellow-700" :
                booking.payment_status === "failed" ? "bg-red-50 text-red-700" :
                  "bg-gray-50 text-gray-700"
              }`}>
              Payment: {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
