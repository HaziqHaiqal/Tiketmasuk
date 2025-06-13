"use server";

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function refundEventTickets(eventId: Id<"events">) {
  try {
    // Get all tickets for the event
    const allTickets = await convex.query(api.tickets.getByEvent, {
      event_id: eventId,
    });

    // Filter for valid tickets only
    const validTickets = allTickets.filter(ticket => 
      ticket.status === "issued" || ticket.status === "valid"
    );

    // Update each ticket status to "refunded"
    const refundPromises = validTickets.map((ticket) =>
      convex.mutation(api.tickets.updateStatus, {
        ticket_id: ticket._id,
        status: "refunded",
      })
    );

    await Promise.all(refundPromises);

    return { success: true, refundedCount: validTickets.length };
  } catch (error) {
    console.error("Error refunding event tickets:", error);
    throw new Error("Failed to refund event tickets");
  }
} 