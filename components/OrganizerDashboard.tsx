"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, Users, DollarSign, TrendingUp } from "lucide-react";

export default function OrganizerDashboard() {
  const router = useRouter();


  const handleCreateEvent = () => {
    router.push("/dashboard/organizer/events/create");
  };

  const handleViewEvents = () => {
    router.push("/dashboard/organizer/events");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Organizer Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your events and track your success
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleCreateEvent}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Create Event</CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">New</div>
              <p className="text-xs text-muted-foreground">
                Start planning your next event
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleViewEvents}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">View All</div>
              <p className="text-xs text-muted-foreground">
                Manage your existing events
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Total Ticket Holders</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Across all events
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">RM 0</div>
              <p className="text-xs text-muted-foreground">
                Total earnings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Getting Started
            </CardTitle>
            <CardDescription>
              Welcome to Tiketmasuk! Here&apos;s how to get started with your first event.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold mb-2">1. Create Your Event</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Set up your event details, categories, and pricing tiers.
                </p>
                <Button onClick={handleCreateEvent} size="sm">
                  Create Event
                </Button>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold mb-2">2. Publish & Share</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Make your event live and share it with your audience.
                </p>
                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold mb-2">3. Track Sales</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Monitor ticket sales and manage attendees.
                </p>
                <Button variant="outline" size="sm" disabled>
                  View Analytics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest events and transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Create your first event to get started!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 