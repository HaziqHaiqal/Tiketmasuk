"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AddressForm, AddressFormData } from "@/components/checkout/AddressForm";
import { ShippingOptions, ShippingOption } from "@/components/checkout/ShippingOptions";
import CheckoutLayout from "@/components/checkout/CheckoutLayout";
import { ArrowLeft, User, Package, CreditCard } from "lucide-react";
import Spinner from "@/components/Spinner";

interface CartItem {
  id: string;
  type: "ticket" | "product";
  name: string;
  quantity: number;
  price: number;
  variant?: string;
  requiresShipping?: boolean;
}

function CheckoutDetailsPageContent() {
  const { isLoading } = useConvexAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Contact Information State
  const [contactInfo, setContactInfo] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  // Address State
  const [billingAddress, setBillingAddress] = useState<AddressFormData | null>(null);
  const [shippingAddress, setShippingAddress] = useState<AddressFormData | null>(null);
  const [sameAsBilling, setSameAsBilling] = useState(true);

  // Shipping State
  const [selectedShippingOption, setSelectedShippingOption] = useState<string>("");
  const [shippingCost, setShippingCost] = useState(0);

  // Cart State (this would normally come from your cart context/store)
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: "1",
      type: "product",
      name: "Event T-Shirt (Large, Black)",
      quantity: 2,
      price: 3500, // RM 35.00
      variant: "Large, Black",
      requiresShipping: true,
    },
    {
      id: "2", 
      type: "ticket",
      name: "VIP Access - Tech Summit 2024",
      quantity: 1,
      price: 15000, // RM 150.00
      requiresShipping: false,
    }
  ]);

  // Check if any items require shipping
  const hasShippableItems = cartItems.some(item => item.requiresShipping);
  
  // Sample shipping options (would normally come from product settings)
  const shippingOptions: ShippingOption[] = hasShippableItems ? [
    {
      id: "pickup-main",
      type: "pickup",
      name: "Pickup at Main Office",
      description: "Free pickup at our main office",
      price: 0,
      pickupLocation: {
        name: "TiketMasuk HQ",
        address: "Level 10, Menara Hap Seng, Jalan P. Ramlee, 50250 Kuala Lumpur",
        hours: "Mon-Fri: 9:00 AM - 6:00 PM",
        instructions: "Please bring your booking confirmation and valid ID"
      }
    },
    {
      id: "pickup-event",
      type: "pickup", 
      name: "Pickup at Event Venue",
      description: "Collect your items at the event venue",
      price: 0,
      pickupLocation: {
        name: "Kuala Lumpur Convention Centre",
        address: "Kuala Lumpur Convention Centre, Jalan Pinang, 50450 Kuala Lumpur",
        hours: "Event day: 8:00 AM onwards",
        instructions: "Visit the merchandise booth with your booking confirmation"
      }
    },
    {
      id: "standard",
      type: "shipping",
      method: "standard",
      name: "Standard Shipping",
      description: "Regular delivery via Pos Malaysia",
      price: 800, // RM 8.00
      estimatedDays: { min: 3, max: 5 }
    },
    {
      id: "express",
      type: "shipping", 
      method: "express",
      name: "Express Shipping",
      description: "Fast delivery via courier",
      price: 1500, // RM 15.00
      estimatedDays: { min: 1, max: 2 }
    }
  ] : [];

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + shippingCost;

  const handleContactInfoChange = (field: string, value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleShippingOptionChange = (optionId: string, option: ShippingOption) => {
    setSelectedShippingOption(optionId);
    setShippingCost(option.price);
  };

  const validateForm = () => {
    // Basic validation
    if (!contactInfo.first_name || !contactInfo.last_name || !contactInfo.email) {
      return false;
    }

    // If we have shippable items, we need addresses and shipping method
    if (hasShippableItems) {
      if (!billingAddress || !selectedShippingOption) {
        return false;
      }
      
      // If shipping is required and not pickup, need shipping address
      const selectedOption = shippingOptions.find(opt => opt.id === selectedShippingOption);
      if (selectedOption?.type === "shipping" && !sameAsBilling && !shippingAddress) {
        return false;
      }
    }

    return true;
  };

  const handleContinue = () => {
    if (!validateForm()) {
      alert("Please fill in all required fields");
      return;
    }

    // Prepare checkout data
    const checkoutData = {
      contactInfo,
      billingAddress,
      shippingAddress: sameAsBilling ? billingAddress : shippingAddress,
      sameAsBilling,
      shippingOption: selectedShippingOption,
      shippingCost,
      cartItems,
      subtotal,
      total
    };

    // Store in localStorage and redirect to summary
    localStorage.setItem("checkoutData", JSON.stringify(checkoutData));
    router.push("/checkout/summary");
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  return (
    <CheckoutLayout
      currentStep={2}
      title="Checkout Details"
      description="Complete your purchase information"
    >

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={contactInfo.first_name}
                      onChange={(e) => handleContactInfoChange("first_name", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name" 
                      value={contactInfo.last_name}
                      onChange={(e) => handleContactInfoChange("last_name", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => handleContactInfoChange("email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => handleContactInfoChange("phone", e.target.value)}
                    placeholder="+60 12-345 6789"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Billing & Shipping Addresses - only show if we have shippable items */}
            {hasShippableItems && (
              <>
                {/* Billing Address */}
                <AddressForm
                  title="Billing Address"
                  onAddressChange={setBillingAddress}
                  initialData={billingAddress || undefined}
                />

                {/* Shipping Options */}
                <ShippingOptions
                  options={shippingOptions}
                  selectedOption={selectedShippingOption}
                  onOptionChange={handleShippingOptionChange}
                />

                {/* Shipping Address - only show if shipping and not same as billing */}
                {selectedShippingOption && 
                 shippingOptions.find(opt => opt.id === selectedShippingOption)?.type === "shipping" && (
                  <AddressForm
                    title="Shipping Address"
                    onAddressChange={setShippingAddress}
                    initialData={shippingAddress || undefined}
                    showSameAsBilling={true}
                    sameAsBilling={sameAsBilling}
                    onSameAsBillingChange={setSameAsBilling}
                    disabled={sameAsBilling}
                  />
                )}
              </>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.name}</div>
                      {item.variant && (
                        <div className="text-xs text-muted-foreground">{item.variant}</div>
                      )}
                      <div className="text-xs text-muted-foreground">Qty: {item.quantity}</div>
                      <div className="flex gap-1 mt-1">
                        <Badge variant={item.type === "ticket" ? "default" : "secondary"} className="text-xs">
                          {item.type === "ticket" ? "Ticket" : "Product"}
                        </Badge>
                        {item.requiresShipping && (
                          <Badge variant="outline" className="text-xs">Shipping</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      RM {((item.price * item.quantity) / 100).toFixed(2)}
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>RM {(subtotal / 100).toFixed(2)}</span>
                  </div>
                  {shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>RM {(shippingCost / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {hasShippableItems && shippingCost === 0 && selectedShippingOption && (
                    <div className="flex justify-between text-green-600">
                      <span>Shipping</span>
                      <span>FREE</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>RM {(total / 100).toFixed(2)}</span>
                </div>

                <Button 
                  onClick={handleContinue}
                  className="w-full"
                  disabled={!validateForm()}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Continue to Payment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CheckoutLayout>
  );
}

export default function CheckoutDetailsPage() {
  return (
    <Suspense fallback={<Spinner fullScreen />}>
      <CheckoutDetailsPageContent />
    </Suspense>
  );
}