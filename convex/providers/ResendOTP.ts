import Resend from "@auth/core/providers/resend";

export const ResendOTP = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    // Generate 6-digit numeric OTP
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
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 12px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Welcome to Tiketmasuk!</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 40px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <h2 style="color: #333; margin: 0 0 20px;">Your verification code</h2>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #e9ecef; display: inline-block;">
              <span style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${token}</span>
            </div>
            <p style="color: #666; margin: 20px 0 0; font-size: 14px;">This code will expire in 10 minutes</p>
          </div>
          
          <div style="text-align: center; padding: 20px 0;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              If you didn't request this verification, please ignore this email.
            </p>
          </div>
        </div>
      `,
      text: `Welcome to Tiketmasuk! Your email verification code is: ${token}. This code will expire in 10 minutes.`,
    });

    if (error) {
      console.error("Failed to send verification email:", error);
      throw new Error("Could not send verification email");
    }
  },
}); 