"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import Spinner from "./Spinner";
import { Clock, OctagonXIcon, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConvexError } from "convex/values";
import { WAITING_LIST_STATUS } from "@/convex/constants";
import { useState } from "react";

export default function JoinQueue({
  eventId,
  userId,
}: {
  eventId: Id<"events">;
  userId: string;
}) {
  const { toast } = useToast();
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isJoining, setIsJoining] = useState(false);
  
  const joinWaitingList = useMutation(api.waitingList.joinWaitingList);
  const queuePosition = useQuery(api.waitingList.getQueuePosition, {
    event_id: eventId,
    user_id: userId,
  });
  const userTicket = useQuery(api.tickets.getUserTicketForEvent, {
    event_id: eventId,
    user_id: userId,
  });
  const availability = useQuery(api.events.getEventAvailability, { event_id: eventId });
  const event = useQuery(api.events.getById, { event_id: eventId });

  // For now, disable event ownership check since we removed userId from events
  const isEventOwner = false;

  const handleJoinQueue = async () => {
    setIsJoining(true);
    try {
      const result = await joinWaitingList({ 
        event_id: eventId, 
        user_id: userId,
        quantity: selectedQuantity
      });
      if (result.success) {
        console.log("Successfully joined waiting list");
      }
    } catch (error) {
      if (
        error instanceof ConvexError &&
        (error.message.includes("joined the waiting list too many times") ||
         error.message.includes("already have an active request"))
      ) {
        toast({
          variant: "destructive",
          title: "Already in queue!",
          description: error.message,
          duration: 5000,
        });
      } else {
        console.error("Error joining waiting list:", error);
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: error instanceof Error ? error.message : "Failed to join queue. Please try again later.",
        });
      }
    } finally {
      setIsJoining(false);
    }
  };

  const increaseQuantity = () => {
    if (availability && selectedQuantity < availability.totalTickets - availability.purchasedCount) {
      setSelectedQuantity(prev => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (selectedQuantity > 1) {
      setSelectedQuantity(prev => prev - 1);
    }
  };

  if (queuePosition === undefined || availability === undefined || !event) {
    return <Spinner />;
  }

  if (userTicket) {
    return null;
  }

  const isPastEvent = event.event_date < Date.now();

  return (
    <div>
      {(!queuePosition ||
        queuePosition.status === WAITING_LIST_STATUS.EXPIRED ||
        (queuePosition.status === WAITING_LIST_STATUS.OFFERED &&
          queuePosition.offer_expires_at &&
          queuePosition.offer_expires_at <= Date.now())) && (
          <>
            {isEventOwner ? (
              <div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg">
                <OctagonXIcon className="w-5 h-5" />
                <span>You cannot buy a ticket for your own event</span>
              </div>
            ) : isPastEvent ? (
              <div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed">
                <Clock className="w-5 h-5" />
                <span>Event has ended</span>
              </div>
            ) : availability.purchasedCount >= availability?.totalTickets ? (
              <div className="text-center p-4">
                <p className="text-lg font-semibold text-red-600">
                  Sorry, this event is sold out
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Quantity Selector */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Number of Tickets
                  </label>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={decreaseQuantity}
                      disabled={selectedQuantity <= 1}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900 min-w-[3ch] text-center">
                        {selectedQuantity}
                      </span>
                      <span className="text-sm text-gray-600">
                        ticket{selectedQuantity !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <button
                      onClick={increaseQuantity}
                      disabled={!availability || selectedQuantity >= (availability.totalTickets - availability.purchasedCount)}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="text-center mt-2 text-sm text-gray-500">
                    {availability && (
                      <>
                        {availability.totalTickets - availability.purchasedCount} tickets available
                        {selectedQuantity > 1 && (
                          <div className="mt-1 font-medium text-gray-700">
                            Total: RM {(event!.price * selectedQuantity).toFixed(2)}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Buy Button */}
                <button
                  onClick={handleJoinQueue}
                  disabled={isPastEvent || isEventOwner || isJoining}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isJoining ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    `Buy ${selectedQuantity} Ticket${selectedQuantity !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            )}
          </>
        )}
    </div>
  );
}
