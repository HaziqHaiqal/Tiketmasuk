# Tiketmasuk - Real-time Event Ticketing Platform

A modern, real-time event ticketing platform built with Next.js 14, Convex, Clerk, and ToyyibPay. Features a sophisticated queue system, real-time updates, and secure payment processing.

### Environment Variable
Create a ```.env.local``` file with:
```
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Change in production

# Clerk Authentication (https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Convex (https://convex.dev)
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT=

# ToyyibPay (https://toyyibpay.com)
TOYYIBPAY_SECRET_KEY=
TOYYIBPAY_CATEGORY_CODE=
TOYYIBPAY_SANDBOX=true
```

### Installation
The ```.next``` folder and ```node_modules``` will be created automatically during installation and build.
```
# Install dependencies
pnpm install

# In a separate terminal, set up Convex (if not already deployed)
pnpm convex

# Build the project
pnpm build

# Start the development server
pnpm dev
```

## Features

### For Event Attendees


- 🎫 Real-time ticket availability tracking
- ⚡ Smart queuing system with position updates
- 🕒 Time-limited ticket offers
- 📱 Mobile-friendly ticket management
- 🔒 Secure payment processing with ToyyibPay
- 📲 Digital tickets with QR codes
- 💸 Automatic refunds for cancelled events

### For Event Organizers

- 💰 Direct payments via ToyyibPay
- 📊 Real-time sales monitoring
- 🎯 Automated queue management
- 📈 Event analytics and tracking
- 🔄 Automatic ticket recycling
- 🎟️ Customizable ticket limits
- ❌ Event cancellation with automatic refunds
- 🔄 Bulk refund processing

### Technical Features

- 🚀 Real-time updates using Convex
- 👤 Authentication with Clerk
- 💳 Payment processing with ToyyibPay
- 🌐 Server-side and client-side rendering
- 🎨 Modern UI with Tailwind CSS and shadcn/ui
- 📱 Responsive design
- 🛡️ Rate limiting for queue joins and purchases
- 🔒 Automated fraud prevention
- 🔔 Toast notifications for real-time feedback
- ✨ Beautiful, accessible components with shadcn/ui

### UI/UX Features

- 🎯 Instant feedback with toast notifications
- 🎨 Consistent design system using shadcn/ui
- ♿ Fully accessible components
- 🎭 Animated transitions and feedback
- 📱 Responsive design across all devices
- 🔄 Loading states and animations
- 💫 Micro-interactions for better engagement


## Architecture

### Database Schema

- Events
- Tickets
- Waiting List
- Users

### Key Components

- Real-time queue management
- Rate limiting
- Automated offer expiration
- Payment processing
- User synchronization

## Usage

### Creating an Event

1. Sign up as an event organizer
2. Ensure ToyyibPay integration is configured
3. Create event with details and ticket quantity
4. Publish event

### Purchasing Tickets

1. Browse available events
2. Join queue for desired event
3. Receive ticket offer
4. Complete purchase within time limit
5. Access digital ticket with QR cod

### Handling Refunds and Cancellations

1. Event organizers can cancel events from their dashboard
2. System automatically processes refunds for all ticket holders
3. Refund status can be tracked in user dashboard

### User Experience

1. Real-time Feedback

   - Instant purchase confirmations
   - Queue position updates
   - Error notifications
   - Success page
   - Ticket status

2. Interactive Elements
   - Animated buttons and cards
   - Loading states
   - Progress indicators
   - Skeleton loaders
   - Smooth transitions
