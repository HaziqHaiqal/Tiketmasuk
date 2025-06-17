# Tiketmasuk

A modern, real-time event ticketing platform built with Next.js 14, Convex, Convex Auth, and ToyyibPay. Features a sophisticated queue system, real-time updates, and secure payment processing.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Change in production

# Convex (https://convex.dev)
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT=

# ToyyibPay (https://toyyibpay.com)
TOYYIBPAY_SECRET_KEY=
TOYYIBPAY_CATEGORY_CODE=
TOYYIBPAY_SANDBOX=true

# Google OAuth (https://console.cloud.google.com):
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Facebook OAuth (https://developers.facebook.com):
AUTH_FACEBOOK_ID=
AUTH_FACEBOOK_SECRET=

# Resend (https://resend.com)
AUTH_RESEND_KEY=
```

## Features

- 🎫 **Event Management** - Create and manage events with multiple ticket categories and pricing tiers
- 🔐 **Multi-Auth System** - Google OAuth, Facebook OAuth, Magic Links, and Password authentication
- ⏰ **Real-time Queue System** - Fair ticket allocation with time-limited offers
- 💳 **Secure Payments** - Integration with ToyyibPay for Malaysian market
- 📱 **Responsive Design** - Mobile-first approach with modern UI
- 🎟️ **Digital Tickets** - QR code generation and validation
- 📊 **Analytics Dashboard** - Real-time event and sales analytics
- 🔔 **Real-time Updates** - Live queue position and ticket availability

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Convex (Database + Backend Functions)
- **Authentication**: Convex Auth with OAuth providers (Google, Facebook) + Magic Links + Passwords
- **Payments**: ToyyibPay (Malaysian payment gateway)
- **UI Components**: Radix UI, Lucide Icons
- **Forms**: React Hook Form with Zod validation

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tiketmasuk.git
   cd tiketmasuk
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up Convex**
   ```bash
   npx convex dev
   ```

4. **Configure environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Convex, OAuth, and ToyyibPay credentials

5. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Authentication Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-convex-site.convex.site/api/auth/callback/google`

### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URI: `https://your-convex-site.convex.site/api/auth/callback/facebook`

### Magic Links (Resend)
1. Sign up at [Resend](https://resend.com/)
2. Get your API key
3. Set `AUTH_RESEND_KEY` in your environment variables

## Payment Integration

This project uses ToyyibPay for payment processing in Malaysia:

1. Sign up at [ToyyibPay](https://toyyibpay.com/)
2. Get your API credentials
3. Configure the environment variables
4. Test with sandbox mode first

## Database Schema

The application uses Convex with the following main tables:
- `users` - User authentication (managed by Convex Auth)
- `customer_profiles` - Customer-specific data
- `organizer_profiles` - Event organizer data
- `events` - Event information with embedded categories and pricing
- `bookings` - Booking records with embedded items
- `tickets` - Individual ticket records
- `payments` - Payment transaction records
- `waiting_list` - Queue management for ticket allocation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
