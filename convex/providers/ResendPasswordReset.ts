import Resend from "@auth/core/providers/resend";

export const ResendPasswordReset = Resend({
  id: "resend-password-reset",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    // Generate 8-digit alphanumeric code
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
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; border-radius: 12px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Tiketmasuk Password Reset</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 40px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <h2 style="color: #333; margin: 0 0 20px;">Your password reset code</h2>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #e9ecef; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; color: #f5576c; letter-spacing: 4px;">${token}</span>
            </div>
            <p style="color: #666; margin: 20px 0 0; font-size: 14px;">This code will expire in 10 minutes</p>
          </div>
          
          <div style="text-align: center; padding: 20px 0;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              If you didn't request this password reset, please ignore this email.
            </p>
          </div>
        </div>
      `,
      text: `Password reset requested for your Tiketmasuk account. Your reset code is: ${token}. This code will expire in 10 minutes.`,
    });

    if (error) {
      console.error("Failed to send password reset email:", error);
      throw new Error("Could not send password reset email");
    }
  },
}); 