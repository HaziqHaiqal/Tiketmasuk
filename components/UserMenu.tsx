"use client";

import { useState } from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
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
  const { signOut } = useAuthActions();
  const [authModal, setAuthModal] = useState<AuthModalType>(null);

  const handleSignOut = async () => {
    try {
      if (signOut) {
        await signOut();
      }
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative h-10 w-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 hover:border-blue-300 hover:from-blue-100 hover:to-indigo-200 transition-all duration-200"
          >
            <User className="h-5 w-5 text-blue-700" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-64 bg-white shadow-xl border border-gray-200 rounded-xl p-2" align="end" forceMount>
          <Authenticated>
            <div className="flex items-center justify-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-semibold text-sm text-gray-900">Welcome back!</p>
                <p className="text-xs text-gray-600">
                  Manage your account
                </p>
              </div>
            </div>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem asChild>
              <Link href="/organiser" className="cursor-pointer rounded-lg px-2 py-2 hover:bg-blue-50 transition-colors duration-200">
                <Store className="mr-3 h-4 w-4 text-blue-600" />
                <span className="font-medium">Sell Tickets</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link href="/tickets" className="cursor-pointer rounded-lg px-2 py-2 hover:bg-green-50 transition-colors duration-200">
                <Ticket className="mr-3 h-4 w-4 text-green-600" />
                <span className="font-medium">My Tickets</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer rounded-lg px-2 py-2 hover:bg-gray-50 transition-colors duration-200">
                <Settings className="mr-3 h-4 w-4 text-gray-600" />
                <span className="font-medium">Settings</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600 rounded-lg px-2 py-2 hover:bg-red-50 transition-colors duration-200"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span className="font-medium">Sign out</span>
            </DropdownMenuItem>
          </Authenticated>

          <Unauthenticated>
            <div className="flex items-center justify-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg mb-2">
              <div className="h-8 w-8 bg-gradient-to-br from-gray-400 to-blue-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-semibold text-sm text-gray-900">Welcome to Tiketmasuk</p>
                <p className="text-xs text-gray-600">
                  Sign in to get started
                </p>
              </div>
            </div>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              className="cursor-pointer rounded-lg px-2 py-2 hover:bg-blue-50 transition-colors duration-200"
              onClick={() => setAuthModal("login")}
            >
              <LogIn className="mr-3 h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-700">Sign in</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem
              className="cursor-pointer rounded-lg px-2 py-2 hover:bg-green-50 transition-colors duration-200"
              onClick={() => setAuthModal("register")}
            >
              <UserPlus className="mr-3 h-4 w-4 text-green-600" />
              <span className="font-medium text-green-700">Sign up</span>
            </DropdownMenuItem>
          </Unauthenticated>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Auth Modals */}
      <AuthModalManager 
        open={authModal} 
        onOpenChange={setAuthModal} 
      />
    </>
  );
} 