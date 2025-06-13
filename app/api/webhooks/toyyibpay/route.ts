import { headers } from "next/headers";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  console.log("ToyyibPay webhook received");

  try {
    const body = await req.text();
    console.log("Webhook body:", body);

    // Parse the form data from ToyyibPay
    const params = new URLSearchParams(body);
    const billCode = params.get('billcode');
    const statusId = params.get('status_id');
    const orderId = params.get('order_id');
    const msg = params.get('msg');
    const transactionId = params.get('transaction_id');

    console.log("Webhook data:", {
      billCode,
      statusId,
      orderId,
      msg,
      transactionId
    });

    if (!billCode || !statusId) {
      console.error("Missing required webhook parameters");
      return new Response("Missing required parameters", { status: 400 });
    }

    const convex = getConvexClient();

    // Find the pending ticket by bill code
    const ticket = await convex.query(api.tickets.getTicketByBillCode, {
      billCode: billCode,
    });

    if (!ticket) {
      console.error("Ticket not found for bill code:", billCode);
      return new Response("Ticket not found", { status: 404 });
    }

    // Status ID 1 means successful payment
    if (statusId === "1") {
      console.log("Processing successful payment for ticket:", ticket._id);
      
      try {
        // Parse the metadata to get the waiting list ID
        const metadata = JSON.parse(ticket.metadata || "{}");
        
        // Complete the pending ticket purchase
        await convex.mutation(api.tickets.completePendingTicketPurchase, {
          ticketId: ticket._id,
          paymentIntentId: transactionId || orderId || billCode,
          waitingListId: metadata.waitingListId,
        });

        console.log("Purchase completed successfully");
      } catch (error) {
        console.error("Error processing successful payment:", error);
        return new Response("Error processing payment", { status: 500 });
      }
    } else {
      console.log("Payment failed or cancelled, status:", statusId);
      // Update ticket status to cancelled
      await convex.mutation(api.tickets.updateTicketStatus, {
        ticketId: ticket._id,
        status: "cancelled",
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
} 