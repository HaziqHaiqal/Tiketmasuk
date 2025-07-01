"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import logo from "@/images/tiketmasuk-logo-dark.png";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToRegister?: () => void;
}

type LoginStep = "signin" | "verification" | "forgot-password" | "reset-verification";

export function LoginModal({ open, onOpenChange, onSwitchToRegister }: LoginModalProps) {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<LoginStep>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setStep("signin");
    setEmail("");
    setPassword("");
    setVerificationCode("");
    setResetCode("");
    setNewPassword("");
    setShowPassword(false);
    setShowNewPassword(false);
    setError("");
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("password", { email, password, flow: "signIn" });
      
      // If result is false/null, it means verification is required
      if (!result) {
        setStep("verification");
      } else {
        // Sign in successful
        onOpenChange(false);
        resetForm();
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!verificationCode.trim()) {
      setError("Please enter the verification code.");
      setIsLoading(false);
      return;
    }

    try {
      await signIn("password", {
        email,
        code: verificationCode,
        flow: "email-verification"
      });
      
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      setIsLoading(false);
      return;
    }

    try {
      await signIn("password", {
        email,
        flow: "reset"
      });
      
      setStep("reset-verification");
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to send password reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!resetCode.trim()) {
      setError("Please enter the reset code.");
      setIsLoading(false);
      return;
    }

    if (!newPassword.trim()) {
      setError("Please enter a new password.");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      await signIn("password", {
        email,
        code: resetCode,
        newPassword,
        flow: "reset-verification"
      });
      
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      console.error("Reset verification error:", err);
      setError(err.message || "Invalid reset code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (step === "verification") {
        await signIn("password", {
          email,
          flow: "signIn"
        });
      } else if (step === "reset-verification") {
        await signIn("password", {
          email,
          flow: "reset"
        });
      }
      setError(""); // Clear any previous errors
    } catch (err: any) {
      console.error("Resend error:", err);
      setError("Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google");
      onOpenChange(false);
      resetForm();
    } catch (err) {
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("facebook");
      onOpenChange(false);
      resetForm();
    } catch (err) {
      setError("Failed to sign in with Facebook. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToRegister = () => {
    resetForm();
    onSwitchToRegister?.();
  };

  // Render email verification step
  if (step === "verification") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[90vw] max-w-md max-h-[90vh] overflow-y-auto !bg-white !border-0 !shadow-2xl !rounded-2xl !p-0 gap-0">
          <div className="bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 p-8 rounded-t-2xl">
            <DialogHeader className="text-center space-y-3">
              <DialogTitle className="text-2xl font-bold text-white text-center">
                Check Your Email 📧
              </DialogTitle>
              <DialogDescription className="text-green-100 text-base text-center">
                We've sent a verification code to {email}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Verification Code</h3>
              <p className="text-gray-600 text-sm">
                Please enter the 6-digit code we sent to your email address
              </p>
            </div>

            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode" className="text-sm font-semibold text-gray-700">
                  Verification Code
                </Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-200 text-center text-2xl font-mono tracking-wider"
                  maxLength={6}
                  autoComplete="one-time-code"
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Verifying...
                  </div>
                ) : (
                  "Verify Email"
                )}
              </Button>
            </form>

            <div className="text-center space-y-3">
              <p className="text-gray-600 text-sm">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                >
                  Resend code
                </button>
              </p>
              
              <button
                onClick={() => setStep("signin")}
                className="flex items-center justify-center w-full text-gray-600 hover:text-gray-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to sign in
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Render forgot password step
  if (step === "forgot-password") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[90vw] max-w-md max-h-[90vh] overflow-y-auto !bg-white !border-0 !shadow-2xl !rounded-2xl !p-0 gap-0">
          <div className="bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 p-8 rounded-t-2xl">
            <DialogHeader className="text-center space-y-3">
              <DialogTitle className="text-2xl font-bold text-white text-center">
                Reset Password 🔑
              </DialogTitle>
              <DialogDescription className="text-orange-100 text-base text-center">
                Enter your email to receive a reset code
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail" className="text-sm font-semibold text-gray-700">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 rounded-xl transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Sending reset code...
                  </div>
                ) : (
                  "Send Reset Code"
                )}
              </Button>
            </form>

            <button
              onClick={() => setStep("signin")}
              className="flex items-center justify-center w-full text-gray-600 hover:text-gray-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Render password reset verification step
  if (step === "reset-verification") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[90vw] max-w-md max-h-[90vh] overflow-y-auto !bg-white !border-0 !shadow-2xl !rounded-2xl !p-0 gap-0">
          <div className="bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 p-8 rounded-t-2xl">
            <DialogHeader className="text-center space-y-3">
              <DialogTitle className="text-2xl font-bold text-white text-center">
                Reset Your Password 🔐
              </DialogTitle>
              <DialogDescription className="text-orange-100 text-base text-center">
                Enter the code sent to {email}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetCode" className="text-sm font-semibold text-gray-700">
                  Reset Code
                </Label>
                <Input
                  id="resetCode"
                  type="text"
                  placeholder="Enter reset code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                  className="h-12 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 rounded-xl transition-all duration-200 text-center text-xl font-mono tracking-wider"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 rounded-xl transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Resetting password...
                  </div>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>

            <div className="text-center space-y-3">
              <p className="text-gray-600 text-sm">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700 font-semibold hover:underline"
                >
                  Resend code
                </button>
              </p>
              
              <button
                onClick={() => setStep("forgot-password")}
                className="flex items-center justify-center w-full text-gray-600 hover:text-gray-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to email entry
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Render main sign in form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-md max-h-[90vh] overflow-y-auto !bg-white !border-0 !shadow-2xl !rounded-2xl !p-0 gap-0">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-8 rounded-t-2xl">
          <DialogHeader className="text-center space-y-3">
            <DialogTitle className="text-2xl font-bold text-white text-center">
              Welcome back! 👋
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-base text-center">
              Sign in to continue your journey
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form content */}
        <div className="p-8 space-y-6">
          {/* Social Sign In */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all duration-200"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
              Continue with Google
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-12 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 font-medium rounded-xl transition-all duration-200"
              onClick={handleFacebookSignIn}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-3" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
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

          {/* Email Sign In Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-5">
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
                  className="pl-12 h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
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

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setStep("forgot-password")}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Sign in
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              )}
            </Button>
          </form>

          {/* Switch to Register */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={handleSwitchToRegister}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all duration-200"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 