"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, Check, CreditCard, MapPin, Package, Truck, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CheckoutLayout from "@/components/checkout/CheckoutLayout";
import { calculateFees } from "@/lib/utils";

interface CheckoutData {
  contactInfo: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  billingAddress: any;
  shippingAddress: any;
  sameAsBilling: boolean;
  shippingOption: string;
  shippingCost: number;
  cartItems: any[];
  subtotal: number;
  total: number;
}

export default function CheckoutSummaryPage() {
  const router = useRouter();
  const createBooking = useMutation(api.bookings.createBooking);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load checkout data from localStorage
    const savedData = localStorage.getItem("checkoutData");
    if (savedData) {
      try {
        setCheckoutData(JSON.parse(savedData));
      } catch (err) {
        setError("Invalid checkout data. Please start over.");
      }
    } else {
      // Redirect back to details if no data
      router.push("/checkout/details");
    }
  }, [router]);

  const handleConfirmOrder = async () => {
    if (!checkoutData) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Determine booking type
      const hasTickets = checkoutData.cartItems.some(item => item.type === "ticket");
      const hasProducts = checkoutData.cartItems.some(item => item.type === "product");
      
      let bookingType: "event_tickets" | "products_only" | "event_with_products";
      if (hasTickets && hasProducts) {
        bookingType = "event_with_products";
      } else if (hasTickets) {
        bookingType = "event_tickets";
      } else {
        bookingType = "products_only";
      }

      // Prepare ticket items
      const ticketItems = checkoutData.cartItems
        .filter(item => item.type === "ticket")
        .map(item => ({
          ticket_category_id: item.id as any, // This would be the actual ticket category ID
          quantity: item.quantity,
          unit_price: item.price,
        }));

      // Prepare product items
      const productItems = checkoutData.cartItems
        .filter(item => item.type === "product")
        .map(item => ({
          product_id: item.id as any, // This would be the actual product ID
          quantity: item.quantity,
          unit_price: item.price,
          variant_selections: [], // Would include actual variant selections
          fulfillment_status: "pending" as const,
          fulfillment_method: (item.requiresShipping ? "shipping" : "pickup") as "shipping" | "pickup",
        }));

             // Generate booking number
       const bookingNumber = `TM${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

       // Create booking
       const bookingId = await createBooking({
         booking_number: bookingNumber,
         customer_id: "sample_user_id" as any, // Would be actual authenticated user ID
         booking_type: bookingType,
         event_id: hasTickets ? "sample_event_id" as any : undefined, // Would be actual event ID
         contact_info: checkoutData.contactInfo,
         ticket_items: ticketItems.length > 0 ? ticketItems : undefined,
         product_items: productItems.length > 0 ? productItems : undefined,
         attendees: hasTickets ? [{
           first_name: checkoutData.contactInfo.first_name,
           last_name: checkoutData.contactInfo.last_name,
           email: checkoutData.contactInfo.email,
           ticket_category_id: ticketItems[0]?.ticket_category_id,
         }] : undefined,
         billing_address: checkoutData.billingAddress,
         shipping_address: checkoutData.shippingAddress,
         same_as_billing: checkoutData.sameAsBilling,
         shipping_method: checkoutData.shippingOption as any,
         shipping_cost: checkoutData.shippingCost,
         subtotal: checkoutData.subtotal,
         total_amount: checkoutData.total,
         currency: "MYR",
       });

      // Clear checkout data
      localStorage.removeItem("checkoutData");
      
      // Redirect to acknowledgement
      router.push(`/checkout/acknowledgement?booking=${bookingId}`);
      
    } catch (err: any) {
      setError(err.message || "Failed to process order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!checkoutData) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  const hasShippableItems = checkoutData.cartItems.some(item => item.requiresShipping);
  const selectedShippingOption = hasShippableItems ? checkoutData.shippingOption : null;

  // Calculate fees
  const fees = calculateFees(checkoutData.subtotal);
  const totalWithFees = fees.total;

  return (
    <CheckoutLayout
      currentStep={3}
      title="Order Summary"
      description="Review your order before payment"
    >

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div><strong>Name:</strong> {checkoutData.contactInfo.first_name} {checkoutData.contactInfo.last_name}</div>
                  <div><strong>Email:</strong> {checkoutData.contactInfo.email}</div>
                  {checkoutData.contactInfo.phone && (
                    <div><strong>Phone:</strong> {checkoutData.contactInfo.phone}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {checkoutData.cartItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        {item.variant && (
                          <div className="text-sm text-muted-foreground">{item.variant}</div>
                        )}
                        <div className="text-sm text-muted-foreground">Quantity: {item.quantity}</div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={item.type === "ticket" ? "default" : "secondary"}>
                            {item.type === "ticket" ? "Ticket" : "Product"}
                          </Badge>
                          {item.requiresShipping && (
                            <Badge variant="outline">Requires Shipping</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">RM {((item.price * item.quantity) / 100).toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">RM {(item.price / 100).toFixed(2)} each</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Addresses - only show if we have shippable items */}
            {hasShippableItems && (
              <>
                {/* Billing Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Billing Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {checkoutData.billingAddress ? (
                      <div className="space-y-1">
                        <div>{checkoutData.billingAddress.first_name} {checkoutData.billingAddress.last_name}</div>
                        {checkoutData.billingAddress.company && <div>{checkoutData.billingAddress.company}</div>}
                        <div>{checkoutData.billingAddress.address_line_1}</div>
                        {checkoutData.billingAddress.address_line_2 && <div>{checkoutData.billingAddress.address_line_2}</div>}
                        <div>{checkoutData.billingAddress.city}, {checkoutData.billingAddress.state_province} {checkoutData.billingAddress.postal_code}</div>
                        <div>{checkoutData.billingAddress.country}</div>
                        {checkoutData.billingAddress.phone && <div>{checkoutData.billingAddress.phone}</div>}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No billing address provided</div>
                    )}
                  </CardContent>
                </Card>

                {/* Shipping Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {selectedShippingOption?.startsWith('pickup') ? <MapPin className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                      Shipping & Delivery
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Shipping Method */}
                      <div>
                        <div className="font-medium mb-2">Delivery Method</div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div>
                            <div className="font-medium">
                              {selectedShippingOption?.startsWith('pickup') ? 'Pickup' : 'Shipping'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {selectedShippingOption?.startsWith('pickup') ? 'Self pickup' : 'Delivery to address'}
                            </div>
                          </div>
                          <div className="font-medium">
                            {checkoutData.shippingCost === 0 ? 'FREE' : `RM ${(checkoutData.shippingCost / 100).toFixed(2)}`}
                          </div>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {!selectedShippingOption?.startsWith('pickup') && (
                        <div>
                          <div className="font-medium mb-2">Shipping Address</div>
                          {checkoutData.sameAsBilling ? (
                            <div className="p-3 bg-muted rounded-md">
                              <div className="flex items-center gap-2 mb-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Same as billing address</span>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div>{checkoutData.billingAddress?.first_name} {checkoutData.billingAddress?.last_name}</div>
                                <div>{checkoutData.billingAddress?.address_line_1}</div>
                                <div>{checkoutData.billingAddress?.city}, {checkoutData.billingAddress?.state_province} {checkoutData.billingAddress?.postal_code}</div>
                              </div>
                            </div>
                          ) : checkoutData.shippingAddress ? (
                            <div className="p-3 bg-muted rounded-md space-y-1 text-sm">
                              <div>{checkoutData.shippingAddress.first_name} {checkoutData.shippingAddress.last_name}</div>
                              {checkoutData.shippingAddress.company && <div>{checkoutData.shippingAddress.company}</div>}
                              <div>{checkoutData.shippingAddress.address_line_1}</div>
                              {checkoutData.shippingAddress.address_line_2 && <div>{checkoutData.shippingAddress.address_line_2}</div>}
                              <div>{checkoutData.shippingAddress.city}, {checkoutData.shippingAddress.state_province} {checkoutData.shippingAddress.postal_code}</div>
                              <div>{checkoutData.shippingAddress.country}</div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">No shipping address provided</div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>RM {(checkoutData.subtotal / 100).toFixed(2)}</span>
                  </div>
                  {checkoutData.shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>RM {(checkoutData.shippingCost / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {hasShippableItems && checkoutData.shippingCost === 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Shipping</span>
                      <span>FREE</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Service Fee</span>
                    <span>RM {(fees.serviceFee / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee</span>
                    <span>RM {(fees.processingFee / 100).toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>RM {((totalWithFees + checkoutData.shippingCost) / 100).toFixed(2)}</span>
                </div>

                <Button 
                  onClick={handleConfirmOrder}
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    "Processing..."
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Confirm & Pay
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  By confirming your order, you agree to our terms and conditions.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CheckoutLayout>
  );
} 