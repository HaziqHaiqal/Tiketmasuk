"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
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
  mobileWidth: 180, // Reduced from 224 to 180px for better mobile appearance
  desktopWidth: 200, // w-50 = 12.5rem = 200px
} as const;

const navigationItems = [
  { href: "/event", label: "Events" },
  { href: "/organiser", label: "Organizers" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function Header() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Layout: Hamburger (Left) - Logo (Center) - User Menu (Right) */}
          <div className="md:hidden flex items-center justify-between w-full">
            {/* Mobile Menu Button - Left */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <nav className="mt-6">
                  <div className="flex flex-col space-y-4">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`px-3 py-2 text-base font-medium transition-colors duration-200 rounded-md ${
                          isActive(item.href)
                            ? "bg-blue-100 text-blue-700 border-l-4 border-blue-600"
                            : "text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo - Center */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <Link href="/" className="font-bold" aria-label="Home">
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
            </div>

            {/* User Menu - Right */}
            <UserMenu />
          </div>

          {/* Desktop Layout: Logo - Navigation - User Menu */}
          <div className="hidden md:flex items-center justify-between w-full">
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

            {/* Desktop Navigation Tabs */}
            <nav className="flex space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
                    isActive(item.href)
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-700 hover:text-blue-600 border-transparent hover:border-blue-600"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex-shrink-0">
              <UserMenu />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;