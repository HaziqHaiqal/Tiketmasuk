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

    // Handle different payment statuses
    if (statusId === "1") {
      // Status 1: Successful payment - update payment and booking status
      try {
        await convex.mutation(api.payments.updatePaymentStatus, {
          bill_code: billCode,
          status: "completed",
          transaction_reference: transactionId || orderId || billCode,
          provider_response: {
            billcode: billCode,
            status_id: statusId,
            order_id: orderId,
            msg: msg,
            transaction_id: transactionId
          }
        });

        // Get the payment to find the booking
        const payment = await convex.query(api.payments.getPaymentByBillCode, {
          bill_code: billCode
        });

        if (payment) {
          // Update booking status to completed
          await convex.mutation(api.bookings.updateStatus, {
            booking_id: payment.booking_id,
            status: "completed"
          });
        }
      } catch (error) {
        console.error("Error processing successful payment:", error);
        return new Response("Error processing payment", { status: 500 });
      }
    } else {
      // Status 0, 2, 3: Failed, cancelled, or other unsuccessful statuses
      try {
        await convex.mutation(api.payments.updatePaymentStatus, {
          bill_code: billCode,
          status: "failed",
          provider_response: {
            billcode: billCode,
            status_id: statusId,
            order_id: orderId,
            msg: msg,
            transaction_id: transactionId
          }
        });

        // Get the payment to find the booking
        const payment = await convex.query(api.payments.getPaymentByBillCode, {
          bill_code: billCode
        });

        if (payment) {
          // Update booking status to cancelled
          await convex.mutation(api.bookings.updateStatus, {
            booking_id: payment.booking_id,
            status: "cancelled"
          });
        }
      } catch (error) {
        console.error("Error updating payment status:", error);
        return new Response("Error updating payment", { status: 500 });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
} 