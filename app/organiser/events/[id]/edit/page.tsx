"use client";

import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import EventForm from "@/components/EventForm";

export default function EditEventPage() {
  const params = useParams();
  const eventId = params.id as Id<"events">;
  
  const event = useQuery(api.events.getById, {
    event_id: eventId,
  });

  if (event === undefined) {
    return <div>Loading...</div>;
  }

  if (!event) {
    return <div>Event not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Event</h1>
      <EventForm
        mode="edit"
        initialData={{
          _id: event._id,
          name: event.name,
          description: event.description,
          location: event.location,
          price: event.price,
          total_tickets: event.total_tickets,
          event_date: event.event_date,
          image_storage_id: event.image_storage_id,
          is_published: event.is_published,
        }}
      />
    </div>
  );
}
