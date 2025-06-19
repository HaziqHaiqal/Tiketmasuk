"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, AlertTriangle, Shield, Users, Calendar, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import Spinner from "./Spinner";

export default function AdminDashboard() {
  const moderationStats = useQuery(api.events.getModerationStats);
  const pendingEvents = useQuery(api.events.getPendingReview);
  
  const adminApprove = useMutation(api.events.adminApprove);
  const adminReject = useMutation(api.events.adminReject);
  
  const [selectedEvent, setSelectedEvent] = useState<Id<"events"> | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);

  const handleApprove = async () => {
    if (!selectedEvent) return;
    
    try {
      await adminApprove({
        event_id: selectedEvent,
        notes: approvalNotes || undefined,
      });
      toast({
        title: "Event Approved",
        description: "The event has been approved and is now live.",
      });
      setIsApprovalDialogOpen(false);
      setApprovalNotes("");
      setSelectedEvent(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedEvent || !rejectionReason) return;
    
    try {
      await adminReject({
        event_id: selectedEvent,
        reason: rejectionReason,
        notes: rejectionNotes || undefined,
      });
      toast({
        title: "Event Rejected",
        description: "The event has been rejected and the organizer will be notified.",
      });
      setIsRejectionDialogOpen(false);
      setRejectionReason("");
      setRejectionNotes("");
      setSelectedEvent(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-MY", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRiskBadgeColor = (score: number) => {
    if (score <= 20) return "bg-green-100 text-green-800";
    if (score <= 40) return "bg-yellow-100 text-yellow-800";
    if (score <= 60) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  if (!moderationStats || !pendingEvents) {
    return <Spinner fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage events and monitor platform security</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{moderationStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Events awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{moderationStats.approved}</div>
            <p className="text-xs text-muted-foreground">
              Events approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{moderationStats.rejected}</div>
            <p className="text-xs text-muted-foreground">
              Events rejected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{moderationStats.total}</div>
            <p className="text-xs text-muted-foreground">
              All events processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Events for Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Events Pending Review
          </CardTitle>
          <CardDescription>
            Review and moderate events before they go live
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingEvents.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
              <p className="text-gray-600">No events pending review at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingEvents.map((event) => (
                <div key={event._id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{event.description}</p>
                      {event.start_datetime && (
                        <p className="text-sm text-gray-500 mt-2">
                          📅 {formatDate(event.start_datetime)}
                        </p>
                      )}
                      {event.submitted_for_review_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          Submitted: {formatDate(event.submitted_for_review_at)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {event.fraud_score !== undefined && (
                        <Badge className={getRiskBadgeColor(event.fraud_score)}>
                          Risk: {event.fraud_score}%
                        </Badge>
                      )}
                      {event.event_category && (
                        <Badge variant="outline">
                          {event.event_category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {event.risk_factors && event.risk_factors.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Risk Factors:</strong> {event.risk_factors.join(", ")}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-3">
                    <Dialog open={isApprovalDialogOpen && selectedEvent === event._id} onOpenChange={setIsApprovalDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => setSelectedEvent(event._id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Approve Event</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to approve "{event.title}"? This will make it live and visible to users.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="approval-notes" className="text-sm font-medium">
                              Optional Notes
                            </label>
                            <Textarea
                              id="approval-notes"
                              placeholder="Add any notes about this approval..."
                              value={approvalNotes}
                              onChange={(e) => setApprovalNotes(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleApprove}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve Event
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isRejectionDialogOpen && selectedEvent === event._id} onOpenChange={setIsRejectionDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => setSelectedEvent(event._id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Event</DialogTitle>
                          <DialogDescription>
                            Please provide a reason for rejecting "{event.title}". The organizer will be notified.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="rejection-reason" className="text-sm font-medium">
                              Rejection Reason *
                            </label>
                            <select
                              id="rejection-reason"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select a reason...</option>
                              <option value="inappropriate_content">Inappropriate Content</option>
                              <option value="misleading_information">Misleading Information</option>
                              <option value="potential_scam">Potential Scam</option>
                              <option value="illegal_activity">Illegal Activity</option>
                              <option value="spam">Spam</option>
                              <option value="copyright_violation">Copyright Violation</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="rejection-notes" className="text-sm font-medium">
                              Additional Notes
                            </label>
                            <Textarea
                              id="rejection-notes"
                              placeholder="Provide more details about the rejection..."
                              value={rejectionNotes}
                              onChange={(e) => setRejectionNotes(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsRejectionDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleReject}
                            variant="destructive"
                            disabled={!rejectionReason}
                          >
                            Reject Event
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 