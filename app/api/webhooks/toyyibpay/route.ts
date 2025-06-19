import { ConvexHttpClient } from "convex/browser";
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

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Handle different payment statuses
    if (statusId === "1") {
      // Status 1: Successful payment - update booking payment status
      try {
        // Find booking by transaction reference (use billCode as booking number or payment reference)
        const booking = await convex.query(api.bookings.getByPaymentReference, {
          payment_reference: billCode
        });

        if (booking) {
          await convex.mutation(api.bookings.updatePaymentStatus, {
            booking_id: booking._id,
            payment_status: "paid",
            payment_details: {
              transaction_id: transactionId || orderId || billCode,
              payment_method: "toyyibpay",
              payment_response: JSON.stringify({
                billcode: billCode,
                status_id: statusId,
                order_id: orderId,
                msg: msg,
                transaction_id: transactionId
              })
            }
          });
        }
      } catch (error) {
        console.error("Error processing successful payment:", error);
        return new Response("Error processing payment", { status: 500 });
      }
    } else {
      // Status 0, 2, 3: Failed, cancelled, or other unsuccessful statuses
      try {
        // Find booking by transaction reference (use billCode as booking number or payment reference)
        const booking = await convex.query(api.bookings.getByPaymentReference, {
          payment_reference: billCode
        });

        if (booking) {
          await convex.mutation(api.bookings.updatePaymentStatus, {
            booking_id: booking._id,
            payment_status: "failed",
            payment_details: {
              payment_method: "toyyibpay",
              payment_response: JSON.stringify({
                billcode: billCode,
                status_id: statusId,
                order_id: orderId,
                msg: msg,
                transaction_id: transactionId
              })
            }
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