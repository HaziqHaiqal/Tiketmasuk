import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import Facebook from "@auth/core/providers/facebook";
import Resend from "@auth/core/providers/resend";
import { DataModel } from "./_generated/dataModel";

// Email verification provider for password signup
const ResendOTP = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    if (!provider.apiKey) {
      throw new Error("Resend API key not configured");
    }
    
    const { Resend: ResendAPI } = await import("resend");
    const resend = new ResendAPI(provider.apiKey);
    
    const { error } = await resend.emails.send({
      from: "Tiketmasuk <noreply@staging.tiketmasuk.my>",
      to: [email],
      subject: "Verify your email address - Tiketmasuk",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">Verify Your Email</h1>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 15px 0; color: #555;">Your verification code is:</p>
            <div style="text-align: center;">
              <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px; font-family: monospace;">${token}</span>
            </div>
          </div>
          <p style="color: #666; font-size: 14px; margin: 0;">
            This code will expire in 20 minutes. If you didn't request this verification, please ignore this email.
          </p>
        </div>
      `,
    });
    
    if (error) {
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  },
});

// Password reset provider
const ResendPasswordReset = Resend({
  id: "resend-password-reset",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    if (!provider.apiKey) {
      throw new Error("Resend API key not configured");
    }
    
    const { Resend: ResendAPI } = await import("resend");
    const resend = new ResendAPI(provider.apiKey);
    
    const { error } = await resend.emails.send({
      from: "Tiketmasuk <noreply@staging.tiketmasuk.my>",
      to: [email],
      subject: "Reset your password - Tiketmasuk",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">Reset Your Password</h1>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 15px 0; color: #555;">Your password reset code is:</p>
            <div style="text-align: center;">
              <span style="font-size: 24px; font-weight: bold; color: #dc3545; letter-spacing: 4px; font-family: monospace;">${token}</span>
            </div>
          </div>
          <p style="color: #666; font-size: 14px; margin: 0;">
            This code will expire in 20 minutes. If you didn't request this password reset, please ignore this email.
          </p>
        </div>
      `,
    });
    
    if (error) {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      // Email verification for new signups
      verify: ResendOTP,
      // Password reset functionality
      reset: ResendPasswordReset,
      // Custom profile method to handle additional fields
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
          // Additional fields from registration form
          accountType: params.accountType as "customer" | "organizer",
          ...(params.accountType === "organizer" && {
            fullName: params.fullName as string,
            displayName: params.displayName as string,
            storeName: params.storeName as string,
            storeDescription: params.storeDescription as string,
            organizerType: params.organizerType as "individual" | "business",
            primaryLocation: params.primaryLocation as string,
            phone: params.phone as string,
            website: params.website as string,
            businessName: params.businessName as string,
            businessRegistration: params.businessRegistration as string,
          }),
        };
      },
      // Password validation
      validatePasswordRequirements: (password: string) => {
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long");
        }
        if (!/\d/.test(password)) {
          throw new Error("Password must contain at least one number");
        }
        if (!/[a-z]/.test(password)) {
          throw new Error("Password must contain at least one lowercase letter");
        }
        if (!/[A-Z]/.test(password)) {
          throw new Error("Password must contain at least one uppercase letter");
        }
        if (!/[^a-zA-Z0-9]/.test(password)) {
          throw new Error("Password must contain at least one special character");
        }
      },
    }),
    
    // Social providers
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),
  ],
  
  callbacks: {
    // Handle additional user data after account creation/update
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
      const user = await ctx.db.get(userId);
      if (!user) return;
      
      // Only create profiles for new users (not existing)
      if (!existingUserId) {
        const userRole = user.accountType === "organizer" ? "organizer" : "customer";
        
        // Create user role entry
        await ctx.db.insert("user_roles", {
          userId: user._id,
          role: userRole,
          createdAt: Date.now(),
        });

        if (user.accountType === "organizer") {
          // Create organizer profile
          await ctx.db.insert("organizer_profiles", {
            userId: user._id,
            fullName: user.fullName || "",
            displayName: user.displayName || "",
            storeName: user.storeName || "",
            storeDescription: user.storeDescription || "",
            organizerType: user.organizerType || "individual",
            primaryLocation: user.primaryLocation || "",
            phone: user.phone || "",
            website: user.website || "",
            businessName: user.businessName || "",
            businessRegistration: user.businessRegistration || "",
            language: "en",
            timezone: "Asia/Kuala_Lumpur",
            currency: "MYR",
            notifications: {
              email: true,
              push: true,
              sms: false,
              marketing: false,
            },
            privacy: {
              profileVisibility: "public",
              showEmail: false,
              showPhone: false,
            },
            isVerified: false,
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        } else {
          // Create customer profile
          await ctx.db.insert("customer_profiles", {
            userId: user._id,
            firstName: user.name?.split(" ")[0] || "",
            lastName: user.name?.split(" ").slice(1).join(" ") || "",
            language: "en",
            timezone: "Asia/Kuala_Lumpur",
            currency: "MYR",
            notifications: {
              email: true,
              push: true,
              sms: false,
              marketing: false,
            },
            privacy: {
              profileVisibility: "public",
              showEmail: false,
              showPhone: false,
            },
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
    },
  },
}); 