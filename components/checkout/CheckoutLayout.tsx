"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { clearCheckoutSessionData } from "@/lib/utils";

interface CheckoutLayoutProps {
  children: React.ReactNode;
  currentStep: 1 | 2 | 3 | 4;
  offerExpiresAt?: number;
  hasValidOffer?: boolean;
  redirectPath?: string;
  title: string;
  description: string;
}

const CHECKOUT_STEPS = [
  { number: 1, label: "Cart" },
  { number: 2, label: "Details" },
  { number: 3, label: "Summary" },
  { number: 4, label: "Payment" },
];

export default function CheckoutLayout({
  children,
  currentStep,
  offerExpiresAt,
  hasValidOffer = false,
  redirectPath = "/",
  title,
  description,
}: CheckoutLayoutProps) {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState("");

  const isExpired = offerExpiresAt ? Date.now() > offerExpiresAt : false;

  useEffect(() => {
    if (!hasValidOffer || !offerExpiresAt || isExpired) return;

    const calculateTimeRemaining = () => {
      const diff = offerExpiresAt - Date.now();
      if (diff <= 0) {
        setTimeRemaining("Expired");
        // Clear all session storage data when timer reaches zero
        clearCheckoutSessionData();
        // Redirect when timer reaches zero
        router.push(redirectPath);
        return;
      }

      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [offerExpiresAt, hasValidOffer, isExpired, redirectPath, router]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 text-lg">{description}</p>
          {hasValidOffer && !isExpired && (
            <Badge variant="secondary" className="mt-3 bg-blue-100 text-blue-800 hover:bg-blue-100">
              <Clock className="w-3 h-3 mr-1" />
              Reserved • Expires in {timeRemaining}
            </Badge>
          )}
        </div>

        {/* Progress Indicator */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              {CHECKOUT_STEPS.map((step, index) => (
                <>
                  <div key={step.number} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                      step.number <= currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}>
                      {step.number}
                    </div>
                    <span className={`text-sm font-medium ${
                      step.number <= currentStep ? "text-blue-600" : "text-gray-400"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {index < CHECKOUT_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      step.number < currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}></div>
                  )}
                </>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Checkout Timer - Global Warning */}
        {hasValidOffer && !isExpired && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm text-red-700 mb-1">Your reservation expires in</div>
                <div className="text-lg font-bold text-red-900">{timeRemaining}</div>
                <p className="text-xs text-red-600 mt-1">
                  Complete your purchase before the timer expires to secure your tickets
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {children}
      </div>
    </div>
  );
} 