"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import logo from "@/images/tiketmasuk-logo-dark.png";

export default function RegisterPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
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
      router.push("/");
    } catch (err) {
      setError("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await signIn("google");
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
    } catch (err) {
      setError("Failed to sign up with Facebook. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-start justify-center p-4 pt-8 z-50 overflow-y-auto">
      <div className="w-full max-w-lg my-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src={logo}
              alt="Tiketmasuk"
              width={180}
              height={180}
              className="mx-auto"
              priority
            />
          </Link>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Create your account
            </CardTitle>
            <CardDescription className="text-gray-600">
              {accountType === "organizer" 
                ? "Join Tiketmasuk and start creating amazing events"
                : "Join Tiketmasuk and start discovering amazing events"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Social Sign Up */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-11 border-gray-200 hover:bg-gray-50"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-11 border-gray-200 hover:bg-blue-50 border-blue-200"
                onClick={handleFacebookSignUp}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or create with email</span>
              </div>
            </div>

            {/* Email Sign Up Form */}
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Requirements */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-600">Password must contain:</div>
                    <div className="space-y-1">
                      <div className={`flex items-center text-xs ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                        <Check className={`w-3 h-3 mr-1 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}`} />
                        At least 8 characters
                      </div>
                      <div className={`flex items-center text-xs ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`}>
                        <Check className={`w-3 h-3 mr-1 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`} />
                        One uppercase letter
                      </div>
                      <div className={`flex items-center text-xs ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-400'}`}>
                        <Check className={`w-3 h-3 mr-1 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-400'}`} />
                        One lowercase letter
                      </div>
                      <div className={`flex items-center text-xs ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-gray-400'}`}>
                        <Check className={`w-3 h-3 mr-1 ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-gray-400'}`} />
                        One number
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <div className="text-xs text-red-600">Passwords do not match</div>
                )}
              </div>

              {/* Account Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  Account Type <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType("customer")}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      accountType === "customer"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <User className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-medium">Customer</div>
                    <div className="text-xs text-gray-500">Buy event tickets</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("organizer")}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      accountType === "organizer"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div className="font-medium">Organizer</div>
                    <div className="text-xs text-gray-500">Create & manage events</div>
                  </button>
                </div>
              </div>

              {/* Name Field - Changes based on account type */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={accountType === "organizer" ? fullName : name}
                    onChange={(e) => accountType === "organizer" ? setFullName(e.target.value) : setName(e.target.value)}
                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Organizer-specific fields */}
              {accountType === "organizer" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+60123456789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-sm font-medium text-gray-700">
                      Display Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="e.g., John's Events, Music Lovers Club"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500">This is how customers will see your brand</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storeName" className="text-sm font-medium text-gray-700">
                      Store Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <Input
                        id="storeName"
                        type="text"
                        placeholder="Your store/brand name for selling products"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Organizer Type <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "individual", label: "Individual", desc: "Solo organizer" },
                        { value: "group", label: "Group/Club", desc: "Informal group" },
                        { value: "organization", label: "Organization", desc: "NGO/Association" },
                        { value: "business", label: "Business", desc: "Registered business" },
                      ].map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setOrganizerType(type.value as any)}
                          className={`p-3 border-2 rounded-lg text-left transition-colors ${
                            organizerType === type.value
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primaryLocation" className="text-sm font-medium text-gray-700">
                      Primary Location <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="primaryLocation"
                      type="text"
                      placeholder="City, State (e.g., Kuala Lumpur, Malaysia)"
                      value={primaryLocation}
                      onChange={(e) => setPrimaryLocation(e.target.value)}
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>



                  <div className="space-y-2">
                    <Label htmlFor="storeDescription" className="text-sm font-medium text-gray-700">
                      Store Description
                    </Label>
                    <Textarea
                      id="storeDescription"
                      placeholder="Tell us about your business and the types of events you organize..."
                      value={storeDescription}
                      onChange={(e) => setStoreDescription(e.target.value)}
                      className="resize-none h-20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                      Website
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://www.yourwebsite.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {/* Optional Business Details */}
                  {organizerType === "business" && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">Business Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="businessName" className="text-sm font-medium text-gray-700">
                            Official Business Name
                          </Label>
                          <Input
                            id="businessName"
                            type="text"
                            placeholder="Registered business name"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="businessRegistration" className="text-sm font-medium text-gray-700">
                            Business Registration
                          </Label>
                          <Input
                            id="businessRegistration"
                            type="text"
                            placeholder="Registration number"
                            value={businessRegistration}
                            onChange={(e) => setBusinessRegistration(e.target.value)}
                            className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}



              {/* Terms and Conditions */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-500 underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isLoading || !passwordValidation.isValid || !acceptTerms}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating account...
                  </div>
                ) : (
                  <div className="flex items-center">
                    {accountType === "organizer" ? "Create organizer account" : "Create account"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 