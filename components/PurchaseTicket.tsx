"use client";

import { useState, useEffect } from "react";

import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import ReleaseTicket from "./ReleaseTicket";
import { getMinPrice } from "@/lib/eventUtils";

export default function PurchaseTicket({ eventId }: { eventId: Id<"events"> }) {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const queuePosition = useQuery(
    api.waitingList.getQueuePosition,
    isAuthenticated ? {
      event_id: eventId,
      user_id: "", // Will be handled by the backend using ctx.auth
    } : "skip"
  );
  
  const event = useQuery(api.events.getById, { event_id: eventId });

  const [timeRemaining, setTimeRemaining] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const offerExpiresAt = queuePosition?.offer_expires_at ?? 0;
  const isExpired = Date.now() > offerExpiresAt;

  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (isExpired) {
        setTimeRemaining("Expired");
        return;
      }

      const diff = offerExpiresAt - Date.now();
      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (minutes > 0) {
        setTimeRemaining(
          `${minutes} minute${minutes === 1 ? "" : "s"} ${seconds} second${
            seconds === 1 ? "" : "s"
          }`
        );
      } else {
        setTimeRemaining(`${seconds} second${seconds === 1 ? "" : "s"}`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [offerExpiresAt, isExpired]);

  const handlePurchaseAsUser = async () => {
    if (!isAuthenticated || !queuePosition) return;

    try {
      setIsLoading(true);
      // Navigate to cart with user authentication
      router.push(`/checkout/cart?eventId=${eventId}&waitingListId=${queuePosition._id}&userType=authenticated`);
    } catch (error) {
      console.error("Error navigating to cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || !queuePosition || queuePosition.status !== "offered") {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-amber-200">
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isAuthenticated ? `${queuePosition.quantity} Ticket${queuePosition.quantity > 1 ? 's' : ''} Reserved` : "Purchase Ticket"}
                </h3>
                {isAuthenticated && (
                  <p className="text-sm text-gray-500">
                    Expires in {timeRemaining}
                  </p>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-600 leading-relaxed">
              {isAuthenticated 
                ? `${queuePosition.quantity} ticket${queuePosition.quantity > 1 ? 's have' : ' has'} been reserved for you. Complete your purchase before the timer expires to secure your spot${queuePosition.quantity > 1 ? 's' : ''} at this event.`
                : "Purchase your ticket now to secure your spot at this event."
              }
            </div>
          </div>
        </div>

        {isAuthenticated ? (
          // Authenticated user flow
          <button
            onClick={handlePurchaseAsUser}
            disabled={isExpired || isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-4 rounded-lg font-bold shadow-md hover:from-amber-600 hover:to-amber-700 transform hover:scale-[1.02] transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
          >
            {isLoading
              ? "Proceeding to cart..."
              : `Purchase Your Ticket${queuePosition.quantity > 1 ? 's' : ''} Now (RM ${event ? ((getMinPrice(event) / 100) * queuePosition.quantity).toFixed(2) : '0.00'}) →`}
          </button>
        ) : null}

        {isAuthenticated && queuePosition && (
          <div className="mt-4">
            <ReleaseTicket eventId={eventId} waitingListId={queuePosition._id} />
          </div>
        )}
      </div>
    </div>
  );
}
