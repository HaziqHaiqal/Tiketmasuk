"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "@/images/tiketmasuk-logo-dark.png";
import SearchBar from "./SearchBar";
import { UserMenu } from "./UserMenu";

const LOGO_CONFIG = {
  width: 224,
  height: 224,
  mobileWidth: 180, // Reduced from 224 to 180px for better mobile appearance
  desktopWidth: 200, // w-50 = 12.5rem = 200px
} as const;

function Header() {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="font-bold" aria-label="Home">
              <Image
                src={logo}
                alt="Tiketmasuk Logo"
                width={LOGO_CONFIG.width}
                height={LOGO_CONFIG.height}
                className="h-10 w-auto object-contain"
                quality={100}
                priority
              />
            </Link>
          </div>

          {/* Search Bar - Hidden on mobile, shown on desktop */}
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <SearchBar />
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            <UserMenu />
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}

export default Header;