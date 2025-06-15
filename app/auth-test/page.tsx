"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { AuthForm } from "@/components/AuthForm";

export default function AuthTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Convex Auth Test</h1>
      
      <AuthLoading>
        <div className="text-center">Loading authentication...</div>
      </AuthLoading>
      
      <Authenticated>
        <div className="max-w-md mx-auto p-6 bg-green-50 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-green-800">
            Welcome! You are signed in.
          </h2>
          <p className="text-sm text-green-600">
            Convex Auth is working correctly!
          </p>
        </div>
      </Authenticated>
      
      <Unauthenticated>
        <div>
          <p className="text-center mb-6 text-gray-600">
            You are not signed in. Please sign in or create an account.
          </p>
          <AuthForm />
        </div>
      </Unauthenticated>
    </div>
  );
} 