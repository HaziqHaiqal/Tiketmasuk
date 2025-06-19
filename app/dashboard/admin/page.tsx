"use client";

import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import Spinner from "@/components/Spinner";
import AdminDashboard from "@/components/AdminDashboard";

export default function AdminDashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  if (authLoading) {
    return <Spinner fullScreen />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">You need to be authenticated to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminDashboard />;
} 