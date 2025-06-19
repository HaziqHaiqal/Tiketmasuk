"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock, User, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import logo from "@/images/tiketmasuk-logo-dark.png";

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
}

export function RegisterModal({ open, onOpenChange, onSwitchToLogin }: RegisterModalProps) {
  const { signIn } = useAuthActions();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Account type selection
  const [accountType, setAccountType] = useState<"customer" | "organizer">("customer");

  // Organizer-specific fields
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [organizerType, setOrganizerType] = useState<"individual" | "group" | "organization" | "business">("individual");
  const [primaryLocation, setPrimaryLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  // Optional business fields
  const [businessName, setBusinessName] = useState("");
  const [businessRegistration, setBusinessRegistration] = useState("");

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers
    };
  };

  const passwordValidation = validatePassword(password);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!acceptTerms) {
      setError("Please accept the terms and conditions to continue.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (!passwordValidation.isValid) {
      setError("Please ensure your password meets all requirements.");
      setIsLoading(false);
      return;
    }

    // Validate organizer-specific fields
    if (accountType === "organizer") {
      if (!fullName.trim()) {
        setError("Full name is required for organizer accounts.");
        setIsLoading(false);
        return;
      }
      if (!displayName.trim()) {
        setError("Display name is required for organizer accounts.");
        setIsLoading(false);
        return;
      }
      if (!storeName.trim()) {
        setError("Store name is required for organizer accounts.");
        setIsLoading(false);
        return;
      }
      if (!primaryLocation.trim()) {
        setError("Primary location is required for organizer accounts.");
        setIsLoading(false);
        return;
      }
      if (!phone.trim()) {
        setError("Phone number is required for organizer accounts.");
        setIsLoading(false);
        return;
      }
    }

    try {
      await signIn("password", {
        email,
        password,
        name: accountType === "organizer" ? fullName : name,
        accountType,
        // Include organizer fields if account type is organizer
        ...(accountType === "organizer" && {
          fullName,
          displayName,
          storeName,
          storeDescription,
          organizerType,
          primaryLocation,
          phone,
          website,
          businessName,
          businessRegistration,
        }),
        flow: "signUp"
      });
      onOpenChange(false);
      // Reset form
      resetForm();
    } catch (err) {
      setError("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAcceptTerms(false);
    setFullName("");
    setDisplayName("");
    setStoreName("");
    setStoreDescription("");
    setPrimaryLocation("");
    setPhone("");
    setWebsite("");
    setBusinessName("");
    setBusinessRegistration("");
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await signIn("google");
      onOpenChange(false);
      resetForm();
    } catch (err) {
      setError("Failed to sign up with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookSignUp = async () => {
    setIsLoading(true);
    try {
      await signIn("facebook");
      onOpenChange(false);
      resetForm();
    } catch (err) {
      setError("Failed to sign up with Facebook. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    resetForm();
    onSwitchToLogin?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto !bg-white !border-0 !shadow-2xl !rounded-2xl !p-0 gap-0">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 p-8 rounded-t-2xl">
          <DialogHeader className="text-center space-y-3">
            <DialogTitle className="text-2xl font-bold text-white text-center">
              Join Tiketmasuk! 🚀
            </DialogTitle>
            <DialogDescription className="text-indigo-100 text-base text-center">
              {accountType === "organizer"
                ? "Start creating amazing events today"
                : "Discover and attend incredible events"
              }
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form content */}
        <div className="p-8 space-y-6">
          {/* Account Type Selection - Tab Style */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 block text-center">Select Account Type</h3>
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex w-full" aria-label="Tabs">
                <button
                  type="button"
                  onClick={() => setAccountType("customer")}
                  className={`flex-1 py-4 px-4 border-b-2 font-medium text-base transition-all duration-200 ${accountType === "customer"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">🎫</span>
                    <span className="font-semibold">Customer</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("organizer")}
                  className={`flex-1 py-4 px-4 border-b-2 font-medium text-base transition-all duration-200 ${accountType === "organizer"
                      ? "border-purple-500 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">🏪</span>
                    <span className="font-semibold">Organizer</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="pt-4">
              {accountType === "customer" ? (
                <div className="text-center">
                  <div className="text-blue-600 font-semibold mb-1">Customer Account</div>
                  <div className="text-gray-600 text-sm">Perfect for discovering and attending amazing events in your area</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-purple-600 font-semibold mb-1">Organizer Account</div>
                  <div className="text-gray-600 text-sm">Ideal for creating, managing, and promoting your own events</div>
                </div>
              )}
            </div>
          </div>

          {/* Social Sign Up - Only for Customers */}
          {accountType === "customer" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-12 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all duration-200"
                  onClick={handleGoogleSignUp}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Google</span>
                  <span className="sm:hidden">Google</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-12 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 font-medium rounded-xl transition-all duration-200"
                  onClick={handleFacebookSignUp}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="hidden sm:inline">Facebook</span>
                  <span className="sm:hidden">Facebook</span>
                </Button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm uppercase">
                  <span className="bg-white px-4 text-gray-500 font-medium">Or continue with email</span>
                </div>
              </div>
            </>
          )}

          {/* Email Sign Up Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            {/* Customer Name Field - Only for customers */}
            {accountType === "customer" && (
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-sm font-semibold text-gray-700">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="customerName"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="pl-12 h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl transition-all duration-200"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="pl-12 h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Password Fields - Single Column */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {password && (
              <div className="text-xs space-y-1 col-span-1 sm:col-span-2">
                <div className="text-gray-700 font-medium">Password must contain:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                    <Check className={`w-3 h-3 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}`} />
                    At least 8 characters
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                    <Check className={`w-3 h-3 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`} />
                    One uppercase letter
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                    <Check className={`w-3 h-3 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-400'}`} />
                    One lowercase letter
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-gray-500'}`}>
                    <Check className={`w-3 h-3 ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-gray-400'}`} />
                    One number
                  </div>
                </div>
              </div>
            )}

            {/* Additional Details Section - Only for Organizers */}
            {accountType === "organizer" && (
              <div className="space-y-4">
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                    Business Details
                  </h3>
                  <p className="text-sm text-gray-600 text-center mb-6">
                    Complete your business profile to start creating events
                  </p>

                  <div className="space-y-4">
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="displayName" className="text-sm font-semibold text-gray-700">
                          Display Name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="displayName"
                            type="text"
                            placeholder="e.g., ABC Corp, XYZ Foundation"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            autoComplete="organization"
                            className="pl-12 h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl transition-all duration-200"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="organizationName" className="text-sm font-semibold text-gray-700">
                          Organization Name
                        </Label>
                        <div className="relative">
                          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <Input
                            id="organizationName"
                            type="text"
                            placeholder="e.g., ABC Development Corporation"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            autoComplete="organization-title"
                            className="pl-12 h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl transition-all duration-200"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="storeName" className="text-sm font-semibold text-gray-700">
                          Store Name
                        </Label>
                        <div className="relative">
                          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <Input
                            id="storeName"
                            type="text"
                            placeholder="e.g., ABC Store, Premium Hub"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            autoComplete="off"
                            className="pl-12 h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl transition-all duration-200"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="primaryLocation" className="text-sm font-semibold text-gray-700">
                          Primary Location
                        </Label>
                        <div className="relative">
                          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4-4a1 1 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <Input
                            id="primaryLocation"
                            type="text"
                            placeholder="City, State/Province, Country"
                            value={primaryLocation}
                            onChange={(e) => setPrimaryLocation(e.target.value)}
                            autoComplete="address-level1"
                            className="pl-12 h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl transition-all duration-200"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                          Phone Number
                        </Label>
                        <div className="relative">
                          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="Your contact number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            autoComplete="tel"
                            className="pl-12 h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl transition-all duration-200"
                            required
                          />
                        </div>
                      </div>
                    </>
                  </div>
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  I agree to the{" "}
                  <a href="/terms" className="text-blue-600 hover:text-blue-700 underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                    Privacy Policy
                  </a>
                </Label>
              </div>

              {error && (
                <div className="text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
                disabled={isLoading || !acceptTerms}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Creating account...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Create Account
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                )}
              </Button>
            </div>
          </form>


          {/* Switch to Login */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-gray-600">
              Already have an account?{" "}
              <button
                onClick={handleSwitchToLogin}
                className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition-all duration-200"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 