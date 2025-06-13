"use client";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import React from "react";
import { CalendarDays, Plus, Settings, CreditCard } from "lucide-react";
import Link from "next/link";

export default function OrganiserDashboard() {
  const router = useRouter();
  const { user } = useUser();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
          <h2 className="text-2xl font-bold">Organiser Dashboard</h2>
          <p className="text-blue-100 mt-2">
            Create and manage your events with ToyyibPay integration
          </p>
        </div>

        {/* Main Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Start Selling Event Tickets
            </h3>
            <p className="text-gray-600 mb-6">
              Create events and accept payments securely through ToyyibPay
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Create Event Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900">Create New Event</h4>
                  <p className="text-sm text-gray-600">Set up your next event</p>
                </div>
              </div>
              <Link
                href="/organiser/new-event"
                className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create Event
              </Link>
            </div>

            {/* Manage Events Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900">My Events</h4>
                  <p className="text-sm text-gray-600">View and manage events</p>
                </div>
              </div>
              <Link
                href="/organiser/events"
                className="block w-full bg-green-600 text-white text-center py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                View Events
              </Link>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-semibold text-gray-900">Payment Processing</h4>
                <p className="text-sm text-gray-600">Powered by ToyyibPay</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span>Secure payment processing for Malaysian events</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span>Support for online banking, credit/debit cards, and e-wallets</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span>Automatic payment confirmation and ticket delivery</span>
              </div>
            </div>
          </div>

          {/* Setup Note */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="ml-3">
                <h5 className="text-sm font-medium text-blue-900">ToyyibPay Setup</h5>
                <p className="text-sm text-blue-700 mt-1">
                  To start receiving payments, ensure your ToyyibPay account is configured in the system environment variables. 
                  Contact your administrator for setup assistance if needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
