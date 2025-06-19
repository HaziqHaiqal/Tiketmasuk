"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
  CalendarDays,
  IdCard,
  MapPin,
  Ticket as TicketIcon,
  User,
  Clock,
  Building,
  Receipt,
} from "lucide-react";
import QRCode from "react-qr-code";
import Spinner from "./Spinner";

import { useStorageUrl } from "@/lib/utils";
import Image from "next/image";

export default function Ticket({ bookingId }: { bookingId: Id<"bookings"> }) {
  const bookingData = useQuery(api.bookings.getBookingWithDetails, { booking_id: bookingId });
  const imageUrl = useStorageUrl(bookingData?.event?.featured_image_storage_id);

  if (!bookingData || !bookingData.event || !bookingData.booking) {
    return <Spinner />;
  }

  const { booking, event, organizer, ticket_items } = bookingData;
  const isCancelled = event.status === "cancelled" || booking.status === "cancelled";

  // Calculate total tickets
  const totalTickets = ticket_items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden shadow-xl border ${isCancelled ? "border-red-200" : "border-gray-100"}`}
    >
      {/* Event Header with Image */}
      <div className="relative">
        {imageUrl && (
          <div className="relative w-full aspect-[21/9]">
            <Image
              src={imageUrl}
              alt={event.title}
              fill
              className={`object-cover object-center ${isCancelled ? "opacity-50" : ""}`}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/90" />
          </div>
        )}
        <div
          className={`px-6 py-4 ${imageUrl ? "absolute bottom-0 left-0 right-0" : isCancelled ? "bg-red-600" : "bg-blue-600"} `}
        >
          <h2
            className={`text-2xl font-bold ${imageUrl || !imageUrl ? "text-white" : "text-black"}`}
          >
            {event.title}
          </h2>
          {isCancelled && (
            <p className="text-red-300 mt-1">This event has been cancelled</p>
          )}
        </div>
      </div>

      {/* Booking Content */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Event & Booking Details */}
          <div className="space-y-4">
            <div className="flex items-center text-gray-600">
              <CalendarDays
                className={`w-5 h-5 mr-3 ${isCancelled ? "text-red-600" : "text-blue-600"}`}
              />
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium">
                  {new Date(event.start_datetime).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(event.start_datetime).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {event.location_type === "physical" && (
              <div className="flex items-center text-gray-600">
                <MapPin
                  className={`w-5 h-5 mr-3 ${isCancelled ? "text-red-600" : "text-blue-600"}`}
                />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">Physical Event</p>
                  <p className="text-sm text-gray-500">Check event details for venue</p>
                </div>
              </div>
            )}

            {event.location_type === "online" && (
              <div className="flex items-center text-gray-600">
                <Building
                  className={`w-5 h-5 mr-3 ${isCancelled ? "text-red-600" : "text-blue-600"}`}
                />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">Online Event</p>
                  {event.online_platform && (
                    <p className="text-sm text-gray-500">
                      Platform: {event.online_platform.platform}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center text-gray-600">
              <User
                className={`w-5 h-5 mr-3 ${isCancelled ? "text-red-600" : "text-blue-600"}`}
              />
              <div>
                <p className="text-sm text-gray-500">Booked By</p>
                <p className="font-medium">{booking.contact_info.first_name} {booking.contact_info.last_name}</p>
                <p className="text-sm text-gray-500">{booking.contact_info.email}</p>
              </div>
            </div>

            <div className="flex items-center text-gray-600">
              <Receipt
                className={`w-5 h-5 mr-3 ${isCancelled ? "text-red-600" : "text-blue-600"}`}
              />
              <div>
                <p className="text-sm text-gray-500">Booking Reference</p>
                <p className="font-medium break-all">{booking.booking_number}</p>
              </div>
            </div>

            <div className="flex items-center text-gray-600">
              <TicketIcon
                className={`w-5 h-5 mr-3 ${isCancelled ? "text-red-600" : "text-blue-600"}`}
              />
              <div>
                <p className="text-sm text-gray-500">Tickets & Total</p>
                <p className="font-medium">{totalTickets} ticket{totalTickets > 1 ? 's' : ''}</p>
                <p className="text-sm text-gray-500">RM {(booking.total_amount / 100).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Right Column - QR Code */}
          <div className="flex flex-col items-center justify-center border-l border-gray-200 pl-6">
            <div
              className={`bg-gray-100 p-4 rounded-lg ${isCancelled ? "opacity-50" : ""}`}
            >
              <QRCode value={booking._id} className="w-32 h-32" />
            </div>
            <p className="mt-2 text-sm text-gray-500 break-all text-center max-w-[200px] md:max-w-full">
              Booking ID: {booking._id}
            </p>
          </div>
        </div>

        {/* Ticket Items Breakdown */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Ticket Details
          </h3>
          <div className="space-y-2">
            {ticket_items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{item.ticket_category?.name || 'General Admission'}</p>
                  <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">RM {(item.unit_price / 100).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">each</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendees List (if available) */}
        {booking.attendees && booking.attendees.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Attendees ({booking.attendees.length})
            </h3>
            <div className="space-y-2">
              {booking.attendees.map((attendee, index) => (
                <div key={index} className="flex items-center py-2 px-3 bg-blue-50 rounded-lg">
                  <User className="w-4 h-4 text-blue-600 mr-2" />
                  <div>
                    <p className="font-medium text-sm">{attendee.first_name} {attendee.last_name}</p>
                    {attendee.email && (
                      <p className="text-xs text-gray-500">{attendee.email}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Important Information
          </h3>
          {isCancelled ? (
            <p className="text-sm text-red-600">
              This event has been cancelled. A refund will be processed if it
              hasn&apos;t been already.
            </p>
          ) : (
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Please arrive at least 30 minutes before the event</li>
              <li>• Have your booking QR code ready for scanning</li>
              <li>• Bring a valid ID for verification</li>
              <li>• Contact support if you have any issues</li>
            </ul>
          )}
        </div>
      </div>

      {/* Booking Footer */}
      <div
        className={`${isCancelled ? "bg-red-50" : "bg-gray-50"} px-6 py-4 flex justify-between items-center`}
      >
        <span className="text-sm text-gray-500">
          Booking Date: {new Date(booking.created_at).toLocaleString()}
        </span>
        <div className="flex items-center space-x-4">
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            booking.status === "confirmed" ? "bg-green-100 text-green-800" :
            booking.status === "pending" ? "bg-yellow-100 text-yellow-800" :
            booking.status === "cancelled" ? "bg-red-100 text-red-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
          <span
            className={`text-sm font-medium ${isCancelled ? "text-red-600" : "text-blue-600"}`}
          >
            {isCancelled ? "Cancelled" : "Valid Booking"}
          </span>
        </div>
      </div>
    </div>
  );
}
