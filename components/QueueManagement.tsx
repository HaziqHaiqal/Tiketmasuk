"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Users, CheckCircle, XCircle, AlertCircle, Timer } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface QueueManagementProps {
  eventId: Id<"events">;
  ticketCategoryId: Id<"ticket_categories">;
  userId?: string;
}

export default function QueueManagement({ eventId, ticketCategoryId, userId }: QueueManagementProps) {
  const { toast } = useToast();
  const availableTickets = useQuery(api.events.getAvailableTickets, {
    event_id: eventId,
    ticket_category_id: ticketCategoryId,
  });

  // Get user's queue entry if they exist
  const queueEntry = useQuery(api.waitingList.getUserQueueEntry, 
    userId ? {
      event_id: eventId,
      ticket_category_id: ticketCategoryId,
      user_id: userId as Id<"users">
    } : "skip"
  );

  // Get current user profile for email
  const currentUser = useQuery(api.users.current);

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Mutations for queue actions
  const joinQueue = useMutation(api.waitingList.joinQueue);
  const acceptOffer = useMutation(api.waitingList.acceptOffer);
  const leaveQueue = useMutation(api.waitingList.leaveWaitingList);

  useEffect(() => {
    if (queueEntry?.offer_expires_at) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, queueEntry.offer_expires_at! - Date.now());
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [queueEntry?.offer_expires_at]);

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleJoinQueue = async () => {
    if (!userId) {
      toast({
        title: "Login Required",
        description: "Please log in to join the queue.",
        variant: "destructive",
      });
      return;
    }

    try {
      await joinQueue({
        event_id: eventId,
        ticket_category_id: ticketCategoryId,
        requested_quantity: 1,
        email: currentUser?.email || "",
      });
      
      toast({
        title: "Joined Queue",
        description: "You've been added to the waiting list. We'll notify you when tickets become available.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join the queue. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptOffer = async () => {
    if (!queueEntry) return;
    
    try {
      await acceptOffer({
        waiting_list_id: queueEntry._id,
      });
      
      toast({
        title: "Offer Accepted",
        description: "Redirecting to checkout...",
      });
      
      // Redirect to checkout with reserved tickets
      window.location.href = `/checkout/details?waiting_list_id=${queueEntry._id}`;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept offer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeclineOffer = async () => {
    if (!queueEntry) return;
    
    try {
      await leaveQueue({
        waiting_list_id: queueEntry._id,
      });
      
      toast({
        title: "Offer Declined",
        description: "You've declined the ticket offer. You can rejoin the queue if you change your mind.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline offer. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (availableTickets === undefined) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show regular purchase if tickets are available
  if (availableTickets > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Tickets Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Available now:</span>
              <Badge className="bg-green-100 text-green-800">
                {availableTickets} tickets
              </Badge>
            </div>
            <Button className="w-full">
              Purchase Tickets
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If user is not in queue, show join option
  if (!queueEntry) {
    return (
      <div className="space-y-4">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Event Sold Out</strong> - Join the waiting list to be notified if tickets become available.
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>Join Waiting List</CardTitle>
            <CardDescription>
              Be the first to know when tickets become available for this event.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleJoinQueue} className="w-full">
              Join Waiting List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show queue status based on user's entry
  return (
    <div className="space-y-4">
      {/* Sold Out Alert */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Event Sold Out</strong> - You're in the waiting list.
        </AlertDescription>
      </Alert>

      {/* Queue Status - Waiting */}
      {queueEntry.status === "waiting" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Queue Position #{queueEntry.position}
            </CardTitle>
            <CardDescription>
              You're in line for {queueEntry.requested_quantity} ticket(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Position in queue</span>
                <span className="font-medium">#{queueEntry.position}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Requested quantity</span>
                <span className="font-medium">{queueEntry.requested_quantity} tickets</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Queue Progress</span>
                <span>{Math.max(0, 100 - queueEntry.position * 2)}%</span>
              </div>
              <Progress value={Math.max(0, 100 - queueEntry.position * 2)} className="h-2" />
            </div>

            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                We'll notify you via email when it's your turn to purchase. Keep this page open for real-time updates.
              </AlertDescription>
            </Alert>

            <Button 
              variant="outline" 
              onClick={() => handleDeclineOffer()}
              className="w-full"
            >
              Leave Queue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Offer Available */}
      {queueEntry.status === "offered" && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Tickets Available for You!
            </CardTitle>
            <CardDescription>
              You have {queueEntry.offered_quantity || queueEntry.requested_quantity} ticket(s) reserved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {timeRemaining !== null && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Timer className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Time remaining:</strong> {formatTimeRemaining(timeRemaining)}
                  <br />
                  <span className="text-sm">Complete your purchase before the offer expires.</span>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Offered quantity</span>
                <span className="font-medium">{queueEntry.offered_quantity || queueEntry.requested_quantity} tickets</span>
              </div>
              {timeRemaining !== null && (
                <div className="flex justify-between text-sm">
                  <span>Time to complete</span>
                  <span className="font-medium text-red-600">
                    {formatTimeRemaining(timeRemaining)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAcceptOffer} className="flex-1">
                Accept & Purchase
              </Button>
              <Button variant="outline" onClick={handleDeclineOffer}>
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Currently Purchasing */}
      {queueEntry.status === "purchasing" && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Timer className="h-5 w-5" />
              Purchase in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Your tickets are reserved. Complete your purchase to secure them.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Expired */}
      {queueEntry.status === "expired" && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Offer Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                Your ticket offer has expired. You can rejoin the queue if you'd like to try again.
              </AlertDescription>
            </Alert>
            <Button onClick={handleJoinQueue} className="w-full mt-4">
              Rejoin Queue
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 