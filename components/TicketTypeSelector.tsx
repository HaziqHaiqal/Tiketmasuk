"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Check, Star, Crown, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";


type Event = Doc<"events">;
type EventCategory = Event["categories"][0];

interface TicketTypeSelectorProps {
  eventId: Id<"events">;
  selectedCategoryId: string | null;
  onCategorySelect: (category: EventCategory) => void;
  disabled?: boolean;
}

const getCategoryIcon = (categoryName: string) => {
  const lowerName = categoryName.toLowerCase();
  if (lowerName.includes('vip') || lowerName.includes('platinum')) {
    return <Crown className="w-5 h-5 text-yellow-600" />;
  }
  if (lowerName.includes('premium')) {
    return <Star className="w-5 h-5 text-purple-600" />;
  }
  if (lowerName.includes('early') || lowerName.includes('super')) {
    return <Gift className="w-5 h-5 text-green-600" />;
  }
  return <Check className="w-5 h-5 text-blue-600" />;
};

const getCategoryBadge = (category: EventCategory) => {
  const lowerName = category.name.toLowerCase();
  
  if (lowerName.includes('vip')) {
    return <Badge variant="default" className="text-xs bg-yellow-600">VIP</Badge>;
  }
  if (lowerName.includes('platinum')) {
    return <Badge variant="default" className="text-xs bg-purple-600">Platinum</Badge>;
  }
  if (lowerName.includes('premium')) {
    return <Badge variant="default" className="text-xs bg-purple-500">Premium</Badge>;
  }
  
  return null;
};

export default function TicketTypeSelector({
  eventId,
  selectedCategoryId,
  onCategorySelect,
  disabled = false,
}: TicketTypeSelectorProps) {
  const event = useQuery(api.events.getById, { event_id: eventId });

  if (!event || !event.categories || event.categories.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        No categories available
      </div>
    );
  }

  const availableCategories = event.categories.filter(cat => cat.is_active);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Select Category
      </h3>
      
      {availableCategories.map((category) => {
        const isSelected = selectedCategoryId === category.id;
        const isAvailable = category.available_tickets > 0 && category.is_active;
        const isSoldOut = category.available_tickets <= 0;
        
        // Get the best (cheapest) price from pricing tiers
        const bestPrice = category.pricing_tiers
          .filter(tier => tier.is_active)
          .sort((a, b) => a.price - b.price)[0];
        
        return (
          <button
            key={category.id}
            onClick={() => !disabled && isAvailable && onCategorySelect(category)}
            disabled={disabled || !isAvailable}
            className={`
              w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
              ${isSelected 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : isAvailable
                  ? 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
                  : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {getCategoryIcon(category.name)}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {category.name}
                    </h4>
                    {getCategoryBadge(category)}
                    {isSoldOut && (
                      <Badge variant="destructive" className="text-xs">Sold Out</Badge>
                    )}
                  </div>
                  
                  {category.description && (
                    <p className={`text-sm mb-2 ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                      {category.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                        RM
                      </span>
                      <span className={`text-xl font-bold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {bestPrice ? (bestPrice.price / 100).toFixed(2) : '0.00'}
                      </span>
                      {category.pricing_tiers.length > 1 && (
                        <span className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                          +
                        </span>
                      )}
                    </div>
                    
                    <div className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                      {category.available_tickets} / {category.total_tickets} left
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Selection indicator */}
              {isSelected && (
                <div className="ml-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
} 