"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import Spinner from "./Spinner";
import EventCategorySelector from "./EventCategorySelector";
import { Clock, OctagonXIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConvexError } from "convex/values";
import { WAITING_LIST_STATUS } from "@/convex/constants";
import { useState } from "react";

interface CategorySelection {
  category_id: string;
  pricing_tier_id: string;
  quantity: number;
}

export default function JoinQueue({
  eventId,
  userId,
}: {
  eventId: Id<"events">;
  userId: string;
}) {
  const { toast } = useToast();
  const [selectedSelections, setSelectedSelections] = useState<CategorySelection[]>([]);
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
  const event = useQuery(api.events.getById, { event_id: eventId });
  const isEventOwner = useQuery(api.events.isUserEventOwner, {
    event_id: eventId,
    user_id: userId,
  });

  const handleJoinQueue = async () => {
    if (selectedSelections.length === 0) {
      toast({
        variant: "destructive",
        title: "Please select categories",
        description: "You need to choose at least one category before proceeding.",
      });
      return;
    }

    setIsJoining(true);
    try {
      // Join queue for each selected category
      const results = await Promise.all(
        selectedSelections.map(selection =>
          joinWaitingList({
            event_id: eventId,
            user_id: userId,
            category_id: selection.category_id,
            quantity: selection.quantity
          })
        )
      );

      const successfulJoins = results.filter(result => result);
      
      if (successfulJoins.length > 0) {
        toast({
          title: "Joined queue successfully!",
          description: `You're in line for ${successfulJoins.length} categor${successfulJoins.length !== 1 ? 'ies' : 'y'}.`,
        });
        
        // Clear selections after successful join
        setSelectedSelections([]);
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

  const getTotalAmount = () => {
    if (!event || selectedSelections.length === 0) return 0;
    
    return selectedSelections.reduce((total, selection) => {
      const category = event.categories?.find(cat => cat.id === selection.category_id);
      if (!category) return total;
      
      const tier = category.pricing_tiers.find(tier => tier.id === selection.pricing_tier_id);
      if (!tier) return total;
      
      return total + (tier.price * selection.quantity);
    }, 0);
  };

  const getTotalTickets = () => {
    return selectedSelections.reduce((total, selection) => total + selection.quantity, 0);
  };

  if (queuePosition === undefined || !event || isEventOwner === undefined) {
    return <Spinner />;
  }

  if (userTicket) {
    return null;
  }

  const isPastEvent = event.event_date < Date.now();

  return (
    <div className="space-y-6">
      {(!queuePosition ||
        queuePosition.status === WAITING_LIST_STATUS.EXPIRED ||
        (queuePosition.status === WAITING_LIST_STATUS.OFFERED &&
          queuePosition.offer_expires_at &&
          queuePosition.offer_expires_at <= Date.now())) && (
          <>
            {isEventOwner ? (
              <div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg">
                <OctagonXIcon className="w-5 h-5" />
                <span>You cannot buy tickets for your own event</span>
              </div>
            ) : isPastEvent ? (
              <div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed">
                <Clock className="w-5 h-5" />
                <span>Event has ended</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Category Selector */}
                <EventCategorySelector
                  eventId={eventId}
                  selectedSelections={selectedSelections}
                  onSelectionChange={setSelectedSelections}
                  disabled={isJoining}
                />

                {/* Cart Summary */}
                {selectedSelections.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">
                      Selected Categories
                    </h4>
                    <div className="space-y-2">
                      {selectedSelections.map((selection, index) => {
                        const category = event.categories?.find(cat => cat.id === selection.category_id);
                        const tier = category?.pricing_tiers.find(tier => tier.id === selection.pricing_tier_id);
                        
                        return (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <div>
                              <span className="font-medium">{category?.name}</span>
                              <span className="text-blue-700 mx-2">•</span>
                              <span className="text-blue-600">{tier?.name}</span>
                              <span className="text-gray-600 ml-2">x{selection.quantity}</span>
                            </div>
                            <div className="font-semibold text-blue-900">
                              RM {tier ? ((tier.price * selection.quantity) / 100).toFixed(2) : '0.00'}
                            </div>
                          </div>
                        );
                      })}
                      <hr className="border-blue-200" />
                      <div className="flex justify-between items-center font-bold text-blue-900">
                        <span>Total ({getTotalTickets()} ticket{getTotalTickets() !== 1 ? 's' : ''})</span>
                        <span>RM {(getTotalAmount() / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Join Queue Button */}
                {selectedSelections.length > 0 && (
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
                      `Join Queue for ${getTotalTickets()} Ticket${getTotalTickets() !== 1 ? 's' : ''} - RM ${(getTotalAmount() / 100).toFixed(2)}`
                    )}
                  </button>
                )}

                {/* Instructions when no categories selected */}
                {selectedSelections.length === 0 && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-700 font-medium">
                      Please select event categories to continue
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      {/* Queue Status Display */}
      {queuePosition && 
       queuePosition.status !== WAITING_LIST_STATUS.EXPIRED && 
       !(queuePosition.status === WAITING_LIST_STATUS.OFFERED && 
         queuePosition.offer_expires_at && 
         queuePosition.offer_expires_at <= Date.now()) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Queue Status</h3>
          {queuePosition.status === WAITING_LIST_STATUS.WAITING && (
            <p className="text-yellow-700">
              You&apos;re #{queuePosition.position} in line for {queuePosition.quantity} ticket{queuePosition.quantity !== 1 ? 's' : ''}
            </p>
          )}
          {queuePosition.status === WAITING_LIST_STATUS.OFFERED && (
            <div className="space-y-2">
              <p className="text-yellow-700">
                Tickets are available for you! You have until{" "}
                {queuePosition.offer_expires_at 
                  ? new Date(queuePosition.offer_expires_at).toLocaleTimeString()
                  : "soon"} to complete your purchase.
              </p>
              <button className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors">
                Complete Purchase
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
