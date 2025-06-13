"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Return() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to organiser dashboard since we no longer use Stripe Connect
    router.push("/organiser");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to organiser dashboard...</p>
      </div>
    </div>
  );
}
