"use client";

import { useState, useEffect } from "react";
import { useConvexAuth } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { User, LogOut, LogIn, UserPlus, Settings, Ticket, Store } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AuthModalManager, AuthModalType } from "./auth/AuthModalManager";

export function UserMenu() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [authModal, setAuthModal] = useState<AuthModalType>(null);
  
  // Get current user profile using proper Convex Auth
  const userProfile = useQuery(api.users.getCurrentUserProfile);
  const trackLogin = useMutation(api.users.trackUserLogin);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Track login when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated && userProfile) {
      trackLogin({});
    }
  }, [isAuthenticated, userProfile, trackLogin]);

  return (
    <div suppressHydrationWarning>
      <Authenticated>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount suppressHydrationWarning>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                {userProfile?.user?.name && (
                  <p className="font-medium">{userProfile.user.name}</p>
                )}
                {userProfile?.user?.email && (
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {userProfile.user.email}
                  </p>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/tickets">
                <Ticket className="mr-2 h-4 w-4" />
                My Tickets
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <Store className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Authenticated>

      <Unauthenticated>
        <div className="flex items-center space-x-2" suppressHydrationWarning>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAuthModal("login")}
            className="text-sm"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
          <Button
            size="sm"
            onClick={() => setAuthModal("register")}
            className="text-sm"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Sign Up
          </Button>
        </div>
      </Unauthenticated>

      <AuthModalManager
        open={authModal}
        onOpenChange={setAuthModal}
      />
    </div>
  );
} 