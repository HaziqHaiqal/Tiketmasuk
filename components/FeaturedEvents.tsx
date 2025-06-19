"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronLeft, ChevronRight, Star, MapPin, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import Link from "next/link";
import Image from "next/image";
import { useStorageUrl } from "@/lib/utils";
import { Doc } from "@/convex/_generated/dataModel";

export default function FeaturedEvents() {
  const events = useQuery(api.events.getUpcoming, {});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Memoize featured events to prevent unnecessary re-renders
  const featuredEvents = useMemo(() => events?.slice(0, 6) || [], [events]);

  // Memoized handlers to prevent re-renders
  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => prev === featuredEvents.length - 1 ? 0 : prev + 1);
  }, [featuredEvents.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => prev === 0 ? featuredEvents.length - 1 : prev - 1);
  }, [featuredEvents.length]);

  const handleMouseEnter = useCallback(() => setIsAutoPlaying(false), []);
  const handleMouseLeave = useCallback(() => setIsAutoPlaying(true), []);

  // Auto-scroll functionality with better cleanup
  useEffect(() => {
    if (!isAutoPlaying || featuredEvents.length <= 1) return;
    
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredEvents.length, nextSlide]);

  // Loading state
  if (!events) {
    return (
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-yellow-500 mr-2" />
              <h2 className="text-4xl font-bold text-gray-900">Featured Events</h2>
            </div>
          </div>
          <div className="h-[500px] bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
      </section>
    );
  }

  if (featuredEvents.length === 0) {
    return null;
  }

  return (
    <section className="bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Fullwidth Carousel Container */}
      <div 
        className="relative overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Featured Events Label - Top Left */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
          <div className="flex items-center bg-white/90 backdrop-blur-sm px-3 py-2 md:px-4 md:py-2 rounded-full shadow-lg">
            <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 mr-2" />
            <h2 className="text-sm md:text-base font-bold text-gray-900">Featured Events</h2>
          </div>
        </div>
        {/* Carousel Track */}
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {featuredEvents.map((event, index) => (
            <EventSlide 
              key={event._id} 
              event={event}
              isActive={index === currentIndex}
              isPriority={Math.abs(index - currentIndex) <= 1}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        {featuredEvents.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 md:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
              aria-label="Previous event"
            >
              <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 md:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
              aria-label="Next event"
            >
              <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
              {featuredEvents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-200 ${
                    currentIndex === index 
                      ? 'bg-white scale-125' 
                      : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                  }`}
                  aria-label={`Go to event ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>


    </section>
  );
}

// Individual Event Slide Component
interface EventSlideProps {
  event: Doc<"events">;
  isActive: boolean;
  isPriority: boolean;
}

function EventSlide({ event, isActive, isPriority }: EventSlideProps) {
  const imageUrl = useStorageUrl(event.featured_image_storage_id);
  
  // Get minimum price from ticket categories
  const ticketCategories = useQuery(api.events.getTicketCategories, { event_id: event._id });
  const minPrice = useMemo(() => {
    if (!ticketCategories || ticketCategories.length === 0) return null;
    return Math.min(...ticketCategories.map(cat => cat.price));
  }, [ticketCategories]);

  // Memoize formatted date
  const formattedDate = useMemo(() => 
    new Date(event.start_datetime).toLocaleDateString(), 
    [event.start_datetime]
  );

  return (
                    <Link href={`/events/${event._id}`} className="w-full flex-shrink-0 relative cursor-pointer block">
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
        {/* Background Image with better loading */}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            priority={isPriority}
            loading={isPriority ? "eager" : "lazy"}
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
        )}
        

      </div>
    </Link>
  );
} 