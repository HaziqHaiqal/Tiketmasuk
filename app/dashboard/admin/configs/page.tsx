"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ConfigurationManager from "@/components/admin/ConfigurationManager";
import { Card, CardContent } from "@/components/ui/card";
import Spinner from "@/components/Spinner";

export default function AdminConfigsPage() {
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);
  const userRoles = useQuery(api.users.getUserRoles, {});

  const isAdmin = userRoles?.some(role => role.role === "admin") || false;

  useEffect(() => {
    if (currentUser === null) {
      // User is not authenticated
      router.push("/");
    } else if (currentUser && userRoles && !isAdmin) {
      // User is authenticated but not an admin
      router.push("/dashboard");
    }
  }, [currentUser, userRoles, isAdmin, router]);

  if (currentUser === undefined || userRoles === undefined) {
    return <Spinner fullScreen />;
  }

  if (currentUser === null) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <p>Please log in to access this page.</p>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <p>Access denied. Admin privileges required.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ConfigurationManager />
    </div>
  );
} 