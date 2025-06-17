"use client";

import { useState } from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/images/tiketmasuk-logo-dark.png";
import SearchBar from "./SearchBar";
import { AuthModalManager, AuthModalType } from "./auth/AuthModalManager";

const LOGO_CONFIG = {
  width: 224,
  height: 224,
  mobileWidth: 180, // Reduced from 224 to 180px for better mobile appearance
  desktopWidth: 200, // w-50 = 12.5rem = 200px
} as const;

function Header() {
  const { signOut } = useAuthActions();
  const [authModal, setAuthModal] = useState<AuthModalType>(null);

  return (
    <header className="border-b">
      <div className="flex flex-col lg:flex-row items-center gap-4 p-4">
        <div className="flex items-center justify-between w-full lg:w-auto">
          <Link href="/" className="font-bold shrink-0" aria-label="Home">
            <Image
              src={logo}
              alt="Tiketmasuk Logo"
              width={LOGO_CONFIG.width}
              height={LOGO_CONFIG.height}
              className="w-44 lg:w-48 object-contain rounded-lg"
              quality={100}
              priority
              sizes={`(max-width: 768px) ${LOGO_CONFIG.mobileWidth}px, ${LOGO_CONFIG.desktopWidth}px`}
            />
          </Link>

          <div className="lg:hidden">
            <Authenticated>
              <button
                onClick={() => signOut()}
                className="bg-red-100 text-red-800 px-3 py-1.5 text-sm rounded-lg hover:bg-red-200 transition border border-red-300"
              >
                Sign Out
              </button>
            </Authenticated>
            <Unauthenticated>
              <div className="flex gap-2">
                <button 
                  onClick={() => setAuthModal("login")}
                  className="bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => setAuthModal("register")}
                  className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition"
                >
                  Sign Up
                </button>
              </div>
            </Unauthenticated>
          </div>
        </div>

        {/* Search Bar - Full width on mobile */}
        <div className="w-full lg:max-w-2xl">
          <SearchBar />
        </div>

        <div className="hidden lg:block ml-auto">
          <Authenticated>
            <div className="flex items-center gap-3">
              <Link href="/organiser">
                <button className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition">
                  Sell Tickets
                </button>
              </Link>

              <Link href="/tickets">
                <button className="bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300">
                  My Tickets
                </button>
              </Link>
              
              <button
                onClick={() => signOut()}
                className="bg-red-100 text-red-800 px-3 py-1.5 text-sm rounded-lg hover:bg-red-200 transition border border-red-300"
              >
                Sign Out
              </button>
            </div>
          </Authenticated>

          <Unauthenticated>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setAuthModal("login")}
                className="bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300"
              >
                Sign In
              </button>
              <button 
                onClick={() => setAuthModal("register")}
                className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition"
              >
                Sign Up
              </button>
            </div>
          </Unauthenticated>
        </div>

        {/* Mobile Action Buttons */}
        <div className="lg:hidden w-full flex justify-center gap-3">
          <Authenticated>
            <Link href="/organiser" className="flex-1">
              <button className="w-full bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition">
                Sell Tickets
              </button>
            </Link>

            <Link href="/tickets" className="flex-1">
              <button className="w-full bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300">
                My Tickets
              </button>
            </Link>
          </Authenticated>
        </div>
      </div>

      {/* Auth Modals */}
      <AuthModalManager 
        open={authModal} 
        onOpenChange={setAuthModal} 
      />
    </header>
  );
}

export default Header;