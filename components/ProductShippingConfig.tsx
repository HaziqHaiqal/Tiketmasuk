"use client";

import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, MapPin } from "lucide-react";

interface ProductShippingConfigProps {
  productId: Id<"products">;
  initialShippingZones?: any[];
  initialPickupLocations?: any[];
  onSave?: () => void;
}

export function ProductShippingConfig({ 
  productId, 
  onSave 
}: ProductShippingConfigProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Shipping configuration will be available soon</p>
            <p className="text-sm">This feature is being updated to match the new schema</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Pickup Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Pickup location configuration will be available soon</p>
            <p className="text-sm">This feature is being updated to match the new schema</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 