"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Calendar } from "lucide-react";
import { usePathname } from "next/navigation";
import logo from "@/images/tiketmasuk-logo-dark.png";
import { UserMenu } from "./UserMenu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

const LOGO_CONFIG = {
  width: 224,
  height: 224,
} as const;

const Header = () => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
        <div className="flex justify-between items-center h-16" suppressHydrationWarning>
          {/* Logo */}
          <Link 
            href="/" 
            className={`flex items-center space-x-2 transition-opacity ${
              isActive("/") ? "opacity-100" : "opacity-90 hover:opacity-100"
            }`}
          >
            <Image
              src={logo}
              alt="Tiketmasuk Logo"
              width={LOGO_CONFIG.width}
              height={LOGO_CONFIG.height}
              className="h-8 w-auto object-contain"
              quality={100}
              priority
            />
          </Link>

                    {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8" suppressHydrationWarning>
            <Link 
              href="/events" 
              className={`transition-colors ${
                isActive("/events") 
                  ? "text-blue-600 font-medium border-b-2 border-blue-600" 
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Events
            </Link>
            <Link 
              href="/organizers" 
              className={`transition-colors ${
                isActive("/organizers") 
                  ? "text-blue-600 font-medium border-b-2 border-blue-600" 
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Organizers
            </Link>
            <Link 
              href="/products" 
              className={`transition-colors ${
                isActive("/products") 
                  ? "text-blue-600 font-medium border-b-2 border-blue-600" 
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Products
            </Link>
            <Link 
              href="/about" 
              className={`transition-colors ${
                isActive("/about") 
                  ? "text-blue-600 font-medium border-b-2 border-blue-600" 
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              About
            </Link>
            <Link 
              href="/contact" 
              className={`transition-colors ${
                isActive("/contact") 
                  ? "text-blue-600 font-medium border-b-2 border-blue-600" 
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* User Menu - Desktop */}
          <div className="hidden md:flex items-center space-x-4" suppressHydrationWarning>
            <UserMenu />
          </div>

          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="mt-6">
                <div className="flex flex-col space-y-4">
                  <Link
                    href="/events"
                    className={`block px-3 py-2 rounded-md transition-colors ${
                      isActive("/events")
                        ? "text-blue-600 font-medium bg-blue-50 border-l-4 border-blue-600"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                  >
                    Events
                  </Link>
                  <Link
                    href="/organizers"
                    className={`block px-3 py-2 rounded-md transition-colors ${
                      isActive("/organizers")
                        ? "text-blue-600 font-medium bg-blue-50 border-l-4 border-blue-600"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                  >
                    Organizers
                  </Link>
                  <Link
                    href="/about"
                    className={`block px-3 py-2 rounded-md transition-colors ${
                      isActive("/about")
                        ? "text-blue-600 font-medium bg-blue-50 border-l-4 border-blue-600"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                  >
                    About
                  </Link>
                  <Link
                    href="/contact"
                    className={`block px-3 py-2 rounded-md transition-colors ${
                      isActive("/contact")
                        ? "text-blue-600 font-medium bg-blue-50 border-l-4 border-blue-600"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                  >
                    Contact
                  </Link>
                </div>
              </nav>
              
              {/* Mobile User Menu */}
              <div className="pt-4 border-t mt-6">
                <UserMenu />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;