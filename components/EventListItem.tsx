"use client";

import Link from "next/link";
import { Edit, Calendar, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useStorageUrl } from "@/lib/utils";
import Image from "next/image";
import CancelEventButton from "./CancelEventButton";
import { Doc } from "@/convex/_generated/dataModel";
import { getTotalTickets } from "@/lib/eventUtils";

interface EventListItemProps {
  event: Doc<"events">;
}

export default function EventListItem({ event }: EventListItemProps) {
  const imageUrl = useStorageUrl(event.featured_image_storage_id);
  const isPastEvent = event.start_datetime < Date.now();

  return (
    <div className="bg-white rounded-lg shadow-md border overflow-hidden">
      <div className="flex">
        {/* Image */}
        <div className="w-32 h-32 flex-shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={event.title}
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{event.title}</h3>
                {event.status === "cancelled" && (
                  <Badge variant="destructive">Cancelled</Badge>
                )}
                {event.status === "draft" && (
                  <Badge variant="secondary">Draft</Badge>
                )}
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(event.start_datetime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(event.start_datetime).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>
                    {event.max_attendees ? `${event.current_attendees || 0} / ${event.max_attendees} attendees` : "No limit"}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-700 mt-2 line-clamp-2">
                {event.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              <Link
                href={`/dashboard/organizer/events/${event._id}/edit`}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </Link>
              
              {!isPastEvent && event.status !== "cancelled" && (
                <CancelEventButton 
                  eventId={event._id}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 