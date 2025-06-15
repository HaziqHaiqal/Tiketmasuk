"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { Check, Clock, Star, Crown, Gift, Calendar, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";




interface PricingTier {
  id: string;
  name: string;
  description?: string;
  price: number;
  availability_type: "time_based" | "quantity_based" | "unlimited";
  sale_start_date?: number;
  sale_end_date?: number;
  max_tickets?: number;
  tickets_sold?: number;
  is_active: boolean;
  sort_order: number;
}



interface CategorySelection {
  category_id: string;
  pricing_tier_id: string;
  quantity: number;
}

interface EventCategorySelectorProps {
  eventId: Id<"events">;
  selectedSelections: CategorySelection[];
  onSelectionChange: (selections: CategorySelection[]) => void;
  disabled?: boolean;
}

const getTierIcon = (tierName: string) => {
  const lowerName = tierName.toLowerCase();
  if (lowerName.includes('super early')) {
    return <Gift className="w-4 h-4 text-green-600" />;
  }
  if (lowerName.includes('early')) {
    return <Clock className="w-4 h-4 text-green-500" />;
  }
  if (lowerName.includes('vip') || lowerName.includes('premium')) {
    return <Crown className="w-4 h-4 text-yellow-600" />;
  }
  return <Star className="w-4 h-4 text-blue-600" />;
};

const getTierBadge = (tier: PricingTier) => {
  const now = Date.now();
  
  // Time-based badges
  if (tier.availability_type === "time_based" && tier.sale_end_date && tier.sale_end_date > now) {
    const hoursLeft = Math.ceil((tier.sale_end_date - now) / (1000 * 60 * 60));
    if (hoursLeft <= 48) {
      return <Badge variant="destructive" className="text-xs">Expires in {hoursLeft}h</Badge>;
    }
  }
  
  // Quantity-based badges
  if (tier.availability_type === "quantity_based" && tier.max_tickets && tier.tickets_sold) {
    const remaining = tier.max_tickets - tier.tickets_sold;
    if (remaining <= 10) {
      return <Badge variant="destructive" className="text-xs">Only {remaining} left</Badge>;
    }
  }
  
  // Tier type badges
  const lowerName = tier.name.toLowerCase();
  if (lowerName.includes('super early')) {
    return <Badge variant="default" className="text-xs bg-green-600">Super Early Bird</Badge>;
  }
  if (lowerName.includes('early')) {
    return <Badge variant="default" className="text-xs bg-green-500">Early Bird</Badge>;
  }
  if (lowerName.includes('vip')) {
    return <Badge variant="default" className="text-xs bg-yellow-600">VIP</Badge>;
  }
  if (lowerName.includes('premium')) {
    return <Badge variant="default" className="text-xs bg-purple-600">Premium</Badge>;
  }
  
  return null;
};

const isAvailable = (tier: PricingTier) => {
  const now = Date.now();
  
  if (!tier.is_active) return false;
  
  // Check time-based availability
  if (tier.availability_type === "time_based") {
    if (tier.sale_start_date && now < tier.sale_start_date) return false;
    if (tier.sale_end_date && now > tier.sale_end_date) return false;
  }
  
  // Check quantity-based availability
  if (tier.availability_type === "quantity_based") {
    if (tier.max_tickets && tier.tickets_sold && tier.tickets_sold >= tier.max_tickets) return false;
  }
  
  return true;
};

const getAvailabilityText = (tier: PricingTier) => {
  const now = Date.now();
  
  if (tier.availability_type === "time_based") {
    if (tier.sale_start_date && now < tier.sale_start_date) {
      return `Available from ${new Date(tier.sale_start_date).toLocaleDateString()}`;
    }
    if (tier.sale_end_date && now < tier.sale_end_date) {
      return `Until ${new Date(tier.sale_end_date).toLocaleDateString()}`;
    }
  }
  
  if (tier.availability_type === "quantity_based" && tier.max_tickets && tier.tickets_sold) {
    const remaining = tier.max_tickets - tier.tickets_sold;
    return `${remaining} of ${tier.max_tickets} remaining`;
  }
  
  return "Available";
};

export default function EventCategorySelector({
  eventId,
  selectedSelections,
  onSelectionChange,
  disabled = false,
}: EventCategorySelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const event = useQuery(api.events.getById, { event_id: eventId });

  if (!event || !event.categories) {
    return (
      <div className="text-center p-4 text-gray-500">
        No event categories available
      </div>
    );
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategorySelection = (categoryId: string) => {
    return selectedSelections.find(s => s.category_id === categoryId);
  };

  const updateSelection = (categoryId: string, pricingTierId: string, quantity: number = 1) => {
    const newSelections = selectedSelections.filter(s => s.category_id !== categoryId);
    if (quantity > 0) {
      newSelections.push({ category_id: categoryId, pricing_tier_id: pricingTierId, quantity });
    }
    onSelectionChange(newSelections);
  };

  const updateQuantity = (categoryId: string, quantity: number) => {
    const selection = getCategorySelection(categoryId);
    if (selection) {
      updateSelection(categoryId, selection.pricing_tier_id, quantity);
    }
  };

  const categories = event.categories
    .filter(cat => cat.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Select Event Categories
      </h3>
      
      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const selection = getCategorySelection(category.id);
        const selectedTier = selection ? category.pricing_tiers.find(t => t.id === selection.pricing_tier_id) : null;
        
        // Get the best available tier (cheapest available)
        const availableTiers = category.pricing_tiers
          .filter(tier => isAvailable(tier))
          .sort((a, b) => a.sort_order - b.sort_order);
        
        const bestTier = availableTiers[0];
        
        return (
          <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              disabled={disabled}
              className={`
                w-full p-4 text-left transition-all duration-200 
                ${selection 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-white hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{category.name}</h4>
                      {selection && <Check className="w-5 h-5 text-blue-600" />}
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Hash className="w-4 h-4" />
                      {category.available_tickets} / {category.total_tickets} available
                    </div>
                    
                    {bestTier && (
                      <div className="text-sm">
                        <span className="text-gray-600">From </span>
                        <span className="font-bold text-blue-900">
                          RM {(bestTier.price / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {selectedTier && selection && (
                      <div className="text-sm">
                        <span className="text-blue-700">
                          {selection.quantity} × {selectedTier.name}
                        </span>
                        <span className="font-bold text-blue-900 ml-2">
                          RM {((selectedTier.price * selection.quantity) / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="ml-4">
                  <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ↓
                  </div>
                </div>
              </div>
            </button>
            
            {/* Pricing Tiers (Expanded) */}
            {isExpanded && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="space-y-3">
                  {category.pricing_tiers
                    .filter(tier => tier.is_active)
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((tier) => {
                      const available = isAvailable(tier);
                      const isSelected = selection?.pricing_tier_id === tier.id;
                      
                      return (
                        <div
                          key={tier.id}
                          className={`
                            border rounded-lg p-3 transition-all cursor-pointer
                            ${isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : available
                                ? 'border-gray-200 bg-white hover:border-blue-300'
                                : 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                            }
                          `}
                          onClick={() => available && !disabled && updateSelection(category.id, tier.id, 1)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getTierIcon(tier.name)}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{tier.name}</span>
                                  {getTierBadge(tier)}
                                  {!available && (
                                    <Badge variant="secondary" className="text-xs">Not Available</Badge>
                                  )}
                                </div>
                                {tier.description && (
                                  <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-xs text-gray-500">
                                    {getAvailabilityText(tier)}
                                  </span>
                                  {tier.availability_type === "time_based" && (
                                    <div className="flex items-center gap-1 text-xs text-orange-600">
                                      <Calendar className="w-3 h-3" />
                                      Time Limited
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="font-bold text-lg">
                                RM {(tier.price / 100).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                
                {/* Quantity Selector for Selected Category */}
                {selection && (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Quantity:</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(category.id, Math.max(0, selection.quantity - 1))}
                          disabled={disabled || selection.quantity <= 1}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="font-bold min-w-[2ch] text-center">{selection.quantity}</span>
                        <button
                          onClick={() => updateQuantity(category.id, Math.min(category.available_tickets, selection.quantity + 1))}
                          disabled={disabled || selection.quantity >= category.available_tickets}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => updateSelection(category.id, "", 0)}
                      disabled={disabled}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove from cart
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 