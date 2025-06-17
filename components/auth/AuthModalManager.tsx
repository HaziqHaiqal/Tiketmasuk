"use client";

import { LoginModal } from "./LoginModal";
import { RegisterModal } from "./RegisterModal";

export type AuthModalType = "login" | "register" | null;

interface AuthModalManagerProps {
  open: AuthModalType;
  onOpenChange: (open: AuthModalType) => void;
}

export function AuthModalManager({ open, onOpenChange }: AuthModalManagerProps) {
  const handleSwitchToRegister = () => {
    onOpenChange("register");
  };

  const handleSwitchToLogin = () => {
    onOpenChange("login");
  };

  return (
    <>
      <LoginModal
        open={open === "login"}
        onOpenChange={(isOpen) => onOpenChange(isOpen ? "login" : null)}
        onSwitchToRegister={handleSwitchToRegister}
      />
      <RegisterModal
        open={open === "register"}
        onOpenChange={(isOpen) => onOpenChange(isOpen ? "register" : null)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  );
} 