"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Ticket, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle 
} from "lucide-react";
import TicketTypeSelector from "./TicketTypeSelector";
import { getAvailableTickets } from "@/lib/eventUtils";

type Event = Doc<"events">;
type EventCategory = Event["categories"][0];

interface ProductSelection {
  product_id: Id<"products">;
  selected_variants: Array<{
    variant_id: string;
    option_id: string;
  }>;
  quantity: number;
}

interface EnhancedJoinQueueProps {
  eventId: Id<"events">;
  userId: string;
}

export default function EnhancedJoinQueue({ eventId, userId }: EnhancedJoinQueueProps) {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
  const [quantity] = useState(1);
  const [productSelections] = useState<ProductSelection[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  
  const router = useRouter();
  
  const event = useQuery(api.events.getById, { event_id: eventId });
  const queuePosition = useQuery(api.waitingList.getQueuePosition, {
    event_id: eventId,
    user_id: userId,
  });
  const joinWaitingList = useMutation(api.waitingList.joinWaitingList);

  const handleCategorySelect = (category: EventCategory) => {
    setSelectedCategory(category);
  };

  const handleJoinQueue = async () => {
    if (!selectedCategory) {
      console.log("Please select a category");
      return;
    }

    setIsJoining(true);
    
    try {
      await joinWaitingList({
        event_id: eventId,
        user_id: userId,
        category_id: selectedCategory.id,
        quantity,
        product_selections: productSelections.length > 0 ? productSelections : undefined,
      });
      
      console.log("Successfully joined the queue!");
    } catch (error) {
      console.error("Error joining queue:", error);
      console.log(error instanceof Error ? error.message : "Failed to join queue");
    } finally {
      setIsJoining(false);
    }
  };

  const handlePurchase = () => {
    router.push(`/checkout/cart?event=${eventId}`);
  };

  if (!event) {
    return <div>Loading...</div>;
  }

  // Check if user has an active queue position
  if (queuePosition) {
    const selectedCategoryObj = event.categories.find(cat => cat.id === queuePosition.category_id);
    
    if (queuePosition.status === "offered") {
      // Get the best price from the category
      const bestPrice = selectedCategoryObj?.pricing_tiers
        .filter(tier => tier.is_active)
        .sort((a, b) => a.price - b.price)[0];
        
      return (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Tickets Offered!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="font-medium">{selectedCategoryObj?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span className="font-medium">{queuePosition.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-bold text-lg">
                  RM {((bestPrice?.price || 0) * queuePosition.quantity / 100).toFixed(2)}
                </span>
              </div>
              {queuePosition.offer_expires_at && (
                <div className="text-sm text-amber-600">
                  Offer expires: {new Date(queuePosition.offer_expires_at).toLocaleString()}
                </div>
              )}
            </div>
            
            <Button 
              onClick={handlePurchase}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Ticket className="w-4 h-4 mr-2" />
              Purchase Your Tickets Now
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (queuePosition.status === "waiting") {
      return (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Clock className="w-5 h-5" />
              You&apos;re in Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Position:</span>
                <Badge className="bg-blue-600">#{queuePosition.position}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="font-medium">{selectedCategoryObj?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span className="font-medium">{queuePosition.quantity}</span>
              </div>
            </div>
            
            <Alert>
              <Users className="w-4 h-4" />
              <AlertDescription>
                You&apos;ll be notified when tickets become available. 
                {queuePosition.position <= 5 && " You&apos;re near the front of the line!"}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }
  }

  // Check if any tickets are available
  const hasAvailableTickets = getAvailableTickets(event) > 0;

  if (!hasAvailableTickets) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            Sold Out
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">
            All categories for this event are currently sold out.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Reserve Your Tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <TicketTypeSelector
          eventId={eventId}
          selectedCategoryId={selectedCategory?.id || null}
          onCategorySelect={handleCategorySelect}
        />
        
        {selectedCategory && (
          <Button
            onClick={handleJoinQueue}
            disabled={isJoining}
            className="w-full"
            size="lg"
          >
            {isJoining ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Joining Queue...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Join Queue ({quantity} ticket{quantity > 1 ? 's' : ''})
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 