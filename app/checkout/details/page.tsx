"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  User,
  FileText,
  CreditCard,
  CheckCircle,
  CalendarIcon
} from "lucide-react";
import { useStorageUrl } from "@/lib/utils";
import { clearCheckoutSessionData } from "@/lib/utils";
import Image from "next/image";
import Spinner from "@/components/Spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getMinPrice } from "@/lib/eventUtils";

interface TicketHolderData {
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  icPassport: string;
  dateOfBirth: string;
  gender: string;
  country: string;
  state: string;
  address: string;
  postcode: string;
  ticketType: string;
}

interface PurchaseFormData {
  // Buyer Details
  buyerFullName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerCountryCode: string;
  
  // Ticket Holders
  ticketHolders: TicketHolderData[];
  
  // Preferences
  specialRequests: string;
  marketingEmails: boolean;
  eventUpdates: boolean;
}

const COUNTRIES = ['Malaysia', 'Singapore', 'Thailand', 'Indonesia', 'Brunei', 'Philippines', 'Other'];
const MALAYSIAN_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Melaka', 'Negeri Sembilan',
  'Pahang', 'Perak', 'Perlis', 'Penang', 'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
];
const GENDERS = ['Male', 'Female'];

function DetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  
  const eventId = searchParams.get("eventId") as Id<"events">;
  const waitingListId = searchParams.get("waitingListId") as Id<"waiting_list">;
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState("");
  
  const [formData, setFormData] = useState<PurchaseFormData>({
    buyerFullName: "",
    buyerEmail: "",
    buyerPhone: "",
    buyerCountryCode: "+60",
    ticketHolders: [],
    specialRequests: "",
    marketingEmails: true,
    eventUpdates: true
  });

  const event = useQuery(api.events.getById, { event_id: eventId });
  const queuePosition = useQuery(
    api.waitingList.getQueuePosition,
    isAuthenticated ? {
      event_id: eventId,
      user_id: "", // Will be handled by the backend using ctx.auth
    } : "skip"
  );
  
  const imageUrl = useStorageUrl(event?.image_storage_id);

  // Calculate offer validity
  const hasValidOffer = queuePosition?.status === "offered";
  const offerExpiresAt = queuePosition?.offer_expires_at ?? 0;
  const isExpired = Date.now() > offerExpiresAt;

  // Handle timer expiration
  useEffect(() => {
    if (hasValidOffer && isExpired) {
      // Clear all session storage data when timer expires
      clearCheckoutSessionData();
      // Redirect to event page when timer expires
      router.push(`/event/${eventId}`);
    }
  }, [hasValidOffer, isExpired, eventId, router]);

  useEffect(() => {
    if (!hasValidOffer || isExpired) return;

    const calculateTimeRemaining = () => {
      const diff = offerExpiresAt - Date.now();
      if (diff <= 0) {
        setTimeRemaining("Expired");
        // Clear all session storage data when timer reaches zero
        clearCheckoutSessionData();
        // Redirect when timer reaches zero
        router.push(`/event/${eventId}`);
        return;
      }

      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [offerExpiresAt, hasValidOffer, isExpired, eventId, router]);

  // Load existing form data from session storage
  useEffect(() => {
    const storedData = sessionStorage.getItem('checkoutDetailsData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as PurchaseFormData;
        setFormData(data);
      } catch {
        // Silently handle parsing errors
      }
    }
  }, []);

  // Initialize ticket holders based on queue quantity
  useEffect(() => {
    if (queuePosition?.quantity && formData.ticketHolders.length === 0) {
      const ticketHolders = Array.from({ length: queuePosition.quantity }, () => ({
        fullName: "",
        email: "",
        phone: "",
        countryCode: "+60",
        icPassport: "",
        dateOfBirth: "",
        gender: "",
        country: "Malaysia",
        state: "",
        address: "",
        postcode: "",
        ticketType: "General Admission"
      }));

      setFormData(prev => ({
        ...prev,
        ticketHolders
      }));
    }
  }, [queuePosition?.quantity, formData.ticketHolders.length]);

  // Note: Auto-population removed since Convex Auth doesn't provide detailed user profile
  // Users will need to manually enter their information

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate buyer details
    if (!formData.buyerFullName.trim()) newErrors.buyerFullName = "Full name is required";
    if (!formData.buyerEmail.trim()) newErrors.buyerEmail = "Email is required";
    if (!formData.buyerPhone.trim()) newErrors.buyerPhone = "Phone number is required";

    // Validate phone format - no leading 0
    if (formData.buyerPhone && formData.buyerPhone.startsWith('0')) {
      newErrors.buyerPhone = "Please enter phone number without leading 0 (e.g., 123456789)";
    }

    // Validate ticket holders
    formData.ticketHolders.forEach((holder, index) => {
      if (!holder.fullName.trim()) newErrors[`holder_${index}_name`] = "Full name is required";
      if (!holder.email.trim()) newErrors[`holder_${index}_email`] = "Email is required";
      if (!holder.phone.trim()) newErrors[`holder_${index}_phone`] = "Phone number is required";
      if (!holder.icPassport.trim()) newErrors[`holder_${index}_ic`] = "IC/Passport is required";
      if (!holder.dateOfBirth) newErrors[`holder_${index}_dob`] = "Date of birth is required";
      if (!holder.gender) newErrors[`holder_${index}_gender`] = "Gender is required";
      if (!holder.state && holder.country === "Malaysia") newErrors[`holder_${index}_state`] = "State is required";
      if (!holder.address.trim()) newErrors[`holder_${index}_address`] = "Address is required";
      if (!holder.postcode.trim()) newErrors[`holder_${index}_postcode`] = "Postcode is required";

      // Validate ticket holder phone - no leading 0
      if (holder.phone && holder.phone.startsWith('0')) {
        newErrors[`holder_${index}_phone`] = "Please enter phone number without leading 0 (e.g., 123456789)";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToSummary = () => {
    if (!event || !validateForm()) return;

    setIsLoading(true);
    
    // Store form data in session storage for state persistence
    sessionStorage.setItem('checkoutDetailsData', JSON.stringify(formData));
    sessionStorage.setItem('checkoutData', JSON.stringify(formData));
    
    router.push(
      `/checkout/summary?eventId=${eventId}&waitingListId=${waitingListId}&userType=authenticated`
    );
  };

  const handleBackToCart = () => {
    // Store current form data before navigating
    sessionStorage.setItem('checkoutDetailsData', JSON.stringify(formData));
    
    router.push(
      `/checkout/cart?eventId=${eventId}&waitingListId=${waitingListId}&userType=authenticated`
    );
  };

  const updateTicketHolder = (index: number, field: keyof TicketHolderData, value: string) => {
    setFormData(prev => ({
      ...prev,
      ticketHolders: prev.ticketHolders.map((holder, i) => 
        i === index ? { ...holder, [field]: value } : holder
      )
    }));
  };

  // Wait for auth to load
  if (authLoading) {
    return <Spinner />;
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    window.location.href = '/auth/login';
    return <Spinner />;
  }

  if (!event) {
    return <Spinner />;
  }

  // Redirect if user doesn't have valid offer
  if (!queuePosition || queuePosition.status !== "offered" || isExpired) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Purchase Details</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Please provide buyer and ticket holder information
          </p>
          {hasValidOffer && (
            <Badge variant="secondary" className="mt-3 bg-amber-100 text-amber-800 hover:bg-amber-100">
              <Clock className="w-3 h-3 mr-1" />
              Reserved • Expires in {timeRemaining}
            </Badge>
          )}
        </div>

        {/* Progress Indicator */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mb-2">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-blue-600">Cart</span>
              </div>
              <div className="flex-1 h-0.5 bg-blue-200 mx-4"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mb-2">
                  2
                </div>
                <span className="text-sm font-medium text-blue-600">Details</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-sm font-medium mb-2">
                  3
                </div>
                <span className="text-sm font-medium text-gray-400">Summary</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-sm font-medium mb-2">
                  4
                </div>
                <span className="text-sm font-medium text-gray-400">Payment</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Details Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Buyer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Buyer Information
                </CardTitle>
                <CardDescription>
                  The person responsible for this purchase and payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyerFullName">Full Name *</Label>
                    <Input
                      id="buyerFullName"
                      type="text"
                      value={formData.buyerFullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, buyerFullName: e.target.value }))}
                      placeholder="Your full name"
                      className={errors.buyerFullName ? "border-red-500" : ""}
                    />
                    {errors.buyerFullName && <p className="text-red-500 text-sm">{errors.buyerFullName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buyerEmail">Email Address *</Label>
                    <Input
                      id="buyerEmail"
                      type="email"
                      value={formData.buyerEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, buyerEmail: e.target.value }))}
                      placeholder="your.email@example.com"
                      className={errors.buyerEmail ? "border-red-500" : ""}
                    />
                    {errors.buyerEmail && <p className="text-red-500 text-sm">{errors.buyerEmail}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buyerPhone">Phone Number *</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500 text-sm">+60</span>
                    </div>
                  <Input
                    id="buyerPhone"
                    type="tel"
                    value={formData.buyerPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s+/g, ''); // Remove spaces
                      setFormData(prev => ({ ...prev, buyerPhone: value }));
                    }}
                      placeholder="123456789"
                      className={`pl-12 ${errors.buyerPhone ? "border-red-500" : ""}`}
                  />
                  </div>
                  {errors.buyerPhone && <p className="text-red-500 text-sm">{errors.buyerPhone}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Ticket Holder Information */}
            {formData.ticketHolders.map((holder, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Ticket Holder #{index + 1}
                  </CardTitle>
                  <CardDescription>
                    Information for the person attending this event
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`holder_${index}_name`}>Full Name *</Label>
                      <Input
                        id={`holder_${index}_name`}
                        type="text"
                        value={holder.fullName}
                        onChange={(e) => updateTicketHolder(index, 'fullName', e.target.value)}
                        placeholder="Full name as per IC/Passport"
                        className={errors[`holder_${index}_name`] ? "border-red-500" : ""}
                      />
                      {errors[`holder_${index}_name`] && <p className="text-red-500 text-sm">{errors[`holder_${index}_name`]}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`holder_${index}_email`}>Email Address *</Label>
                      <Input
                        id={`holder_${index}_email`}
                        type="email"
                        value={holder.email}
                        onChange={(e) => updateTicketHolder(index, 'email', e.target.value)}
                        placeholder="email@example.com"
                        className={errors[`holder_${index}_email`] ? "border-red-500" : ""}
                      />
                      {errors[`holder_${index}_email`] && <p className="text-red-500 text-sm">{errors[`holder_${index}_email`]}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`holder_${index}_phone`}>Phone Number *</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-500 text-sm">+60</span>
                        </div>
                      <Input
                        id={`holder_${index}_phone`}
                        type="tel"
                        value={holder.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s+/g, ''); // Remove spaces
                          updateTicketHolder(index, 'phone', value);
                        }}
                          placeholder="123456789"
                          className={`pl-12 ${errors[`holder_${index}_phone`] ? "border-red-500" : ""}`}
                      />
                      </div>
                      {errors[`holder_${index}_phone`] && <p className="text-red-500 text-sm">{errors[`holder_${index}_phone`]}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`holder_${index}_ic`}>IC/Passport Number *</Label>
                      <Input
                        id={`holder_${index}_ic`}
                        type="text"
                        value={holder.icPassport}
                        onChange={(e) => updateTicketHolder(index, 'icPassport', e.target.value)}
                        placeholder="IC or Passport number"
                        className={errors[`holder_${index}_ic`] ? "border-red-500" : ""}
                      />
                      {errors[`holder_${index}_ic`] && <p className="text-red-500 text-sm">{errors[`holder_${index}_ic`]}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Date of Birth *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !holder.dateOfBirth && "text-muted-foreground",
                              errors[`holder_${index}_dob`] && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {holder.dateOfBirth ? format(new Date(holder.dateOfBirth), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={holder.dateOfBirth ? new Date(holder.dateOfBirth) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                updateTicketHolder(index, 'dateOfBirth', format(date, 'yyyy-MM-dd'));
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {errors[`holder_${index}_dob`] && <p className="text-red-500 text-sm">{errors[`holder_${index}_dob`]}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`holder_${index}_gender`}>Gender *</Label>
                      <Select
                        value={holder.gender}
                        onValueChange={(value) => updateTicketHolder(index, 'gender', value)}
                      >
                        <SelectTrigger className={errors[`holder_${index}_gender`] ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDERS.map(gender => (
                            <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors[`holder_${index}_gender`] && <p className="text-red-500 text-sm">{errors[`holder_${index}_gender`]}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`holder_${index}_country`}>Country *</Label>
                      <Select
                        value={holder.country}
                        onValueChange={(value) => updateTicketHolder(index, 'country', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map(country => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {holder.country === "Malaysia" && (
                      <div className="space-y-2">
                        <Label htmlFor={`holder_${index}_state`}>State *</Label>
                        <Select
                          value={holder.state}
                          onValueChange={(value) => updateTicketHolder(index, 'state', value)}
                        >
                          <SelectTrigger className={errors[`holder_${index}_state`] ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {MALAYSIAN_STATES.map(state => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[`holder_${index}_state`] && <p className="text-red-500 text-sm">{errors[`holder_${index}_state`]}</p>}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor={`holder_${index}_postcode`}>Postcode *</Label>
                      <Input
                        id={`holder_${index}_postcode`}
                        type="text"
                        value={holder.postcode}
                        onChange={(e) => updateTicketHolder(index, 'postcode', e.target.value)}
                        placeholder="Postcode"
                        className={errors[`holder_${index}_postcode`] ? "border-red-500" : ""}
                      />
                      {errors[`holder_${index}_postcode`] && <p className="text-red-500 text-sm">{errors[`holder_${index}_postcode`]}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`holder_${index}_ticketType`}>Ticket Type</Label>
                      <Input
                        id={`holder_${index}_ticketType`}
                        type="text"
                        value={holder.ticketType}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`holder_${index}_address`}>Address *</Label>
                    <Textarea
                      id={`holder_${index}_address`}
                      value={holder.address}
                      onChange={(e) => updateTicketHolder(index, 'address', e.target.value)}
                      placeholder="Full address"
                      rows={3}
                      className={errors[`holder_${index}_address`] ? "border-red-500" : ""}
                    />
                    {errors[`holder_${index}_address`] && <p className="text-red-500 text-sm">{errors[`holder_${index}_address`]}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Special Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Special Requests</CardTitle>
                <CardDescription>
                  Any dietary requirements, accessibility needs, or other requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.specialRequests}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                  placeholder="Any special dietary requirements, accessibility needs, or other requests..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Event Summary */}
                {imageUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={event.name}
                      width={300}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div>
                  <h4 className="font-semibold text-base mb-3">{event.name}</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.event_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(event.event_date).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Ticket × {queuePosition.quantity}</span>
                      <span>RM {((getMinPrice(event) / 100) * queuePosition.quantity).toFixed(2)}</span>
                    </div>
                  <div className="flex justify-between text-sm">
                    <span>Service Fee</span>
                    <span>RM 0.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>RM {((getMinPrice(event) / 100) * queuePosition.quantity).toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                {/* Countdown Timer */}
                {hasValidOffer && !isExpired && (
                  <div className="bg-red-50 p-3 rounded-lg text-center border border-red-200">
                    <div className="text-sm text-red-700 mb-1">Queue expires in</div>
                    <div className="text-lg font-bold text-red-900">{timeRemaining}</div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleProceedToSummary}
                    disabled={isLoading || !hasValidOffer || isExpired}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {isLoading ? (
                      "Processing..."
                    ) : (
                      <>
                        Continue to Summary
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleBackToCart}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DetailsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <DetailsContent />
    </Suspense>
  );
} 