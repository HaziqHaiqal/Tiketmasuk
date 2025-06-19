"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, Zap, MapPin, Clock } from "lucide-react";

export interface ShippingOption {
  id: string;
  type: "shipping" | "pickup";
  method?: "standard" | "express" | "overnight";
  name: string;
  description?: string;
  price: number; // in cents, 0 for pickup
  estimatedDays?: {
    min: number;
    max: number;
  };
  pickupLocation?: {
    name: string;
    address: string;
    hours?: string;
    instructions?: string;
  };
}

interface ShippingOptionsProps {
  options: ShippingOption[];
  selectedOption?: string;
  onOptionChange: (optionId: string, option: ShippingOption) => void;
  currency?: string;
}

export function ShippingOptions({
  options,
  selectedOption,
  onOptionChange,
  currency = "MYR"
}: ShippingOptionsProps) {
  const formatPrice = (price: number) => {
    if (price === 0) return "FREE";
    return `${currency} ${(price / 100).toFixed(2)}`;
  };

  const getIcon = (option: ShippingOption) => {
    if (option.type === "pickup") return <MapPin className="h-5 w-5" />;
    
    switch (option.method) {
      case "standard": return <Package className="h-5 w-5" />;
      case "express": return <Truck className="h-5 w-5" />;
      case "overnight": return <Zap className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getEstimatedDelivery = (option: ShippingOption) => {
    if (option.type === "pickup") return "Ready for pickup";
    
    if (!option.estimatedDays) return "";
    
    const { min, max } = option.estimatedDays;
    if (min === max) {
      return `${min} business day${min !== 1 ? 's' : ''}`;
    }
    return `${min}-${max} business days`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping & Delivery
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedOption}
          onValueChange={(value: string) => {
            const option = options.find(opt => opt.id === value);
            if (option) {
              onOptionChange(value, option);
            }
          }}
          className="space-y-4"
        >
          {options.map((option) => (
            <div key={option.id} className="flex items-start space-x-3">
              <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
              <div className="flex-1 grid gap-2">
                <Label
                  htmlFor={option.id}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">
                      {getIcon(option)}
                    </div>
                    <div>
                      <div className="font-medium">{option.name}</div>
                      {option.description && (
                        <div className="text-sm text-muted-foreground">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatPrice(option.price)}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getEstimatedDelivery(option)}
                    </div>
                  </div>
                </Label>
                
                {/* Pickup Location Details */}
                {option.type === "pickup" && option.pickupLocation && (
                  <div className="ml-8 mt-2 p-3 bg-muted rounded-md text-sm">
                    <div className="font-medium mb-1">{option.pickupLocation.name}</div>
                    <div className="text-muted-foreground mb-2">
                      {option.pickupLocation.address}
                    </div>
                    {option.pickupLocation.hours && (
                      <div className="text-muted-foreground mb-1">
                        <strong>Hours:</strong> {option.pickupLocation.hours}
                      </div>
                    )}
                    {option.pickupLocation.instructions && (
                      <div className="text-muted-foreground">
                        <strong>Instructions:</strong> {option.pickupLocation.instructions}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Special Badges */}
                <div className="ml-8 flex gap-2">
                  {option.price === 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Free
                    </Badge>
                  )}
                  {option.method === "express" && (
                    <Badge variant="default" className="text-xs">
                      Fast Delivery
                    </Badge>
                  )}
                  {option.method === "overnight" && (
                    <Badge variant="destructive" className="text-xs">
                      Urgent
                    </Badge>
                  )}
                  {option.type === "pickup" && (
                    <Badge variant="outline" className="text-xs">
                      Self Pickup
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </RadioGroup>
        
        {options.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No shipping options available for your location.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 