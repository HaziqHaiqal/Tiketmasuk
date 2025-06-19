"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, Calendar, ShoppingBag } from "lucide-react";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJhIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8cGF0aCBkPSJtMCAwaDQwdjQwaC00MHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0ibTAgMGg0MHY0MGgtNDB6IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3BhdHRlcm4+CjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPgo8L3N2Zz4=')] bg-repeat"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10" suppressHydrationWarning>
        <div className="text-center" suppressHydrationWarning>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Discover Amazing
            <span className="block text-blue-200">Events & Products</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Your one-stop marketplace for unforgettable experiences and unique products. 
            Connect with organizers and discover what's happening around you.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8" suppressHydrationWarning>
            <div className="relative" suppressHydrationWarning>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for events or organizers..."
                className="w-full pl-12 pr-4 py-4 text-gray-900 rounded-lg text-lg focus:ring-4 focus:ring-blue-300 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Link href={`/events?q=${encodeURIComponent(searchQuery)}`}>
                <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700">
                  Search
                </Button>
              </Link>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" suppressHydrationWarning>
            <Button size="lg" variant="secondary" asChild className="text-blue-700 bg-white hover:bg-gray-100">
              <Link href="/events" className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Browse Events
              </Link>
            </Button>
            <Button size="lg" className="text-white bg-green-600 hover:bg-green-700 border-2 border-green-600" asChild>
              <Link href="/products" className="flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Shop Products
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white/10 backdrop-blur-sm" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" suppressHydrationWarning>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center" suppressHydrationWarning>
            <div suppressHydrationWarning>
              <div className="text-3xl font-bold mb-2" suppressHydrationWarning>10K+</div>
              <div className="text-blue-200" suppressHydrationWarning>Active Users</div>
            </div>
            <div suppressHydrationWarning>
              <div className="text-3xl font-bold mb-2" suppressHydrationWarning>500+</div>
              <div className="text-blue-200" suppressHydrationWarning>Verified Organizers</div>
            </div>
            <div suppressHydrationWarning>
              <div className="text-3xl font-bold mb-2" suppressHydrationWarning>2K+</div>
              <div className="text-blue-200" suppressHydrationWarning>Events Hosted</div>
            </div>
            <div suppressHydrationWarning>
              <div className="text-3xl font-bold mb-2" suppressHydrationWarning>50K+</div>
              <div className="text-blue-200" suppressHydrationWarning>Tickets Sold</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 