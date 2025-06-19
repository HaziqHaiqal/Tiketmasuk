"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Clock, Users, CheckCircle } from "lucide-react";
import { WAITING_LIST_STATUS } from "@/convex/constants";
import Spinner from "./Spinner";


interface TicketSelection {
  ticket_category_id: Id<"ticket_categories">;
  quantity: number;
}

// Removed unused QueuePosition interface

interface TicketCategory {
  _id: Id<"ticket_categories">;
  name: string;
  description?: string;
  price: number;
  currency: string;
  total_quantity: number;
  sold_quantity?: number;
  reserved_quantity?: number;
  max_quantity_per_order?: number;
  is_active: boolean;
}

interface QueueEntry {
  _id: Id<"waiting_list">;
  event_id: Id<"events">;
  user_id: Id<"users">;
  ticket_category_id: Id<"ticket_categories">;
  status: string;
  requested_quantity: number;
  created_at: number;
  offer_expires_at?: number;
  position?: number;
}

interface Props {
  eventId: Id<"events">;
}

export default function JoinQueue({ eventId }: Props) {
  const [selectedSelections, setSelectedSelections] = useState<TicketSelection[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();

  // Get event data and ticket categories
  const event = useQuery(api.events.getById, { event_id: eventId });
  const ticketCategories = useQuery(api.events.getTicketCategories, { event_id: eventId });
  // Get current user profile using proper Convex Auth
  const userProfile = useQuery(api.users.getCurrentUserProfile);
  
  // Get queue positions for all categories this user is in
  const userQueueEntries = useQuery(api.waitingList.getUserQueueEntries);
  
  const joinQueue = useMutation(api.waitingList.joinQueue);

  const handleJoinQueue = async () => {
    if (!userProfile?.user?.email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please complete your profile with a valid email address.",
      });
      return;
    }

    setIsJoining(true);
    try {
      const results = await Promise.all(
        selectedSelections.map(selection =>
          joinQueue({
            event_id: eventId,
            ticket_category_id: selection.ticket_category_id,
            requested_quantity: selection.quantity,
            email: userProfile.user.email!,
            phone: userProfile.profile?.phone,
          })
        )
      );

      const successfulJoins = results.filter((result: unknown) => Boolean(result));
      
      if (successfulJoins.length > 0) {
        toast({
          title: "Joined queue successfully!",
          description: `You're in line for ${successfulJoins.length} categor${successfulJoins.length !== 1 ? 'ies' : 'y'}.`,
        });
        
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
    if (!ticketCategories) return 0;
    return selectedSelections.reduce((total, selection) => {
      const category = ticketCategories.find((c: TicketCategory) => c._id === selection.ticket_category_id);
      return total + (category ? category.price * selection.quantity : 0);
    }, 0);
  };

  const getTotalTickets = () => {
    return selectedSelections.reduce((total, selection) => total + selection.quantity, 0);
  };

  const handleCategorySelection = (categoryId: Id<"ticket_categories">, quantity: number) => {
    if (quantity === 0) {
      setSelectedSelections(prev => prev.filter(s => s.ticket_category_id !== categoryId));
    } else {
      setSelectedSelections(prev => {
        const existing = prev.find(s => s.ticket_category_id === categoryId);
        if (existing) {
          return prev.map(s => 
            s.ticket_category_id === categoryId 
              ? { ...s, quantity }
              : s
          );
        } else {
          return [...prev, { ticket_category_id: categoryId, quantity }];
        }
      });
    }
  };

  if (!event || !ticketCategories || !userQueueEntries) {
    return <Spinner fullScreen />;
  }

  const isPastEvent = event.start_datetime < Date.now();

  // Check if user has any active queue positions for this event
  const activeQueuePositions = userQueueEntries.filter((entry: QueueEntry) => 
    entry.event_id === eventId &&
    (entry.status === WAITING_LIST_STATUS.WAITING || entry.status === WAITING_LIST_STATUS.OFFERED)
  );

  return (
    <div className="space-y-6">
      {activeQueuePositions.length === 0 && (
        <>
          {isPastEvent ? (
            <div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed">
              <Clock className="w-5 h-5" />
              <span>Event has ended</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Ticket Category Selector */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Select Ticket Categories</h4>
                {ticketCategories
                  .filter((category: TicketCategory) => category.is_active)
                  .map((category: TicketCategory) => {
                    const selection = selectedSelections.find(s => s.ticket_category_id === category._id);
                    const availableQuantity = category.total_quantity - (category.sold_quantity || 0) - (category.reserved_quantity || 0);
                    const isAvailable = availableQuantity > 0;

                    return (
                      <div key={category._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-medium text-gray-900">{category.name}</h5>
                            {category.description && (
                              <p className="text-sm text-gray-600">{category.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              {category.currency} {(category.price / 100).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {availableQuantity} available
                            </div>
                          </div>
                        </div>
                        
                        {isAvailable ? (
                          <div className="flex items-center gap-2 mt-2">
                            <label className="text-sm font-medium text-gray-700">Quantity:</label>
                            <select
                              value={selection?.quantity || 0}
                              onChange={(e) => handleCategorySelection(category._id, parseInt(e.target.value))}
                              className="border rounded px-2 py-1 text-sm"
                              disabled={!isAvailable}
                            >
                              <option value={0}>0</option>
                              {Array.from({ length: Math.min(availableQuantity, category.max_quantity_per_order || 10) }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="mt-2 text-sm text-red-600">
                            Sold out - Join queue to be notified when available
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Cart Summary */}
              {selectedSelections.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">
                    Selected Categories
                  </h4>
                  <div className="space-y-2">
                                         {selectedSelections.map((selection) => {
                       const category = ticketCategories.find((c: TicketCategory) => c._id === selection.ticket_category_id);
                      if (!category) return null;
                      
                      return (
                        <div key={selection.ticket_category_id} className="flex justify-between items-center text-sm">
                          <div>
                            <span className="font-medium">{category.name}</span>
                            <span className="text-gray-600 ml-2">x{selection.quantity}</span>
                          </div>
                          <div className="font-semibold text-blue-900">
                            {category.currency} {((category.price * selection.quantity) / 100).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                    <hr className="border-blue-200" />
                    <div className="flex justify-between items-center font-bold text-blue-900">
                      <span>Total ({getTotalTickets()} ticket{getTotalTickets() !== 1 ? 's' : ''})</span>
                      <span>{ticketCategories[0]?.currency || 'RM'} {(getTotalAmount() / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Join Queue Button */}
              {selectedSelections.length > 0 && (
                <button
                  onClick={handleJoinQueue}
                  disabled={isPastEvent || isJoining}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isJoining ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    `Join Queue for ${getTotalTickets()} Ticket${getTotalTickets() !== 1 ? 's' : ''} - ${ticketCategories[0]?.currency || 'RM'} ${(getTotalAmount() / 100).toFixed(2)}`
                  )}
                </button>
              )}

              {/* Instructions when no categories selected */}
              {selectedSelections.length === 0 && (
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-700 font-medium">
                    Please select ticket categories to continue
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

             {/* Queue Status Display */}
       {activeQueuePositions.map((queuePosition: QueueEntry) => {
         const category = ticketCategories.find((c: TicketCategory) => c._id === queuePosition.ticket_category_id);
        
        return (
          <div key={queuePosition._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Queue Status - {category?.name}</h3>
                <p className="text-sm text-gray-600">Current position in line</p>
              </div>
            </div>

            {queuePosition.status === WAITING_LIST_STATUS.WAITING && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Position:</span>
                  <span className="font-semibold text-blue-600">#{queuePosition.position}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center gap-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    <Clock className="w-4 h-4" />
                    Waiting
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  You'll be notified when tickets become available.
                </p>
              </div>
            )}

            {queuePosition.status === WAITING_LIST_STATUS.OFFERED && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center gap-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Tickets Available
                  </span>
                </div>
                {queuePosition.offer_expires_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Expires:</span>
                    <span className="font-semibold text-red-600">
                      {new Date(queuePosition.offer_expires_at).toLocaleTimeString()}
                    </span>
                  </div>
                )}
                <p className="text-sm text-green-700 font-medium">
                  Your tickets are ready! Complete your purchase now.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
