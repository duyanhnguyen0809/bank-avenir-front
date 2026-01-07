# Bank Avenir - Frontend

A modern digital banking platform built with **Next.js 16**, **TypeScript**, and **shadcn/ui**.

## Quick Start

### Prerequisites
- Node.js 18+
- Backend server running on `http://localhost:4000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit: **http://localhost:3000**

### Test Credentials

| Role    | Email                | Password        |
|---------|----------------------|-----------------|
| Client  | client@avenir.com    | SecurePass123!  |
| Manager | manager@avenir.com   | SecurePass123!  |
| Admin   | admin@avenir.com     | SecurePass123!  |

## Features

### Client Features
- **Dashboard** - Overview with account balances, recent transactions, and quick actions
- **Accounts** - View accounts, check balances, open new accounts (Checking, Savings, Investment)
- **Trading** - Browse securities, place buy/sell orders, view portfolio and order history
- **Loans** - Apply for loans with payment calculator, track loan status and amortization
- **Chat** - Real-time messaging with bank advisors via WebSocket
- **Notifications** - Live notifications via Server-Sent Events (SSE)

### Manager Features
- **Client Management** - View assigned clients and their accounts
- **Loan Processing** - Review, approve, or reject loan requests
- **Chat Support** - Respond to client inquiries in real-time

### Admin Features
- **User Management** - View all users and change user roles
- **Securities Management** - Create, update, and manage tradeable securities
- **Interest Rates** - Configure savings rates by account type
- **System Overview** - Monitor pending loan requests and system stats

## Project Structure

```
app/
├── (auth)/              # Public pages (login, register)
├── (dashboard)/         # Protected pages
│   ├── dashboard/       # Main dashboard
│   ├── accounts/        # Account management
│   ├── trading/         # Securities and orders
│   ├── loans/           # Loan applications
│   ├── chat/            # Client chat
│   ├── advisor/         # Manager chat interface
│   ├── conseiller/      # Legacy manager interface
│   └── admin/           # Admin panel (users, rates, securities)
├── backend/             # API proxy routes (handles CORS)
└── page.tsx             # Root redirect

components/
├── layout/              # Navbar, Sidebar, ProtectedRoute
└── ui/                  # shadcn/ui components

lib/
├── api/                 # API service modules
├── services/            # WebSocket and SSE services
├── store/               # Zustand auth store
├── types/               # TypeScript interfaces
└── utils.ts             # Utility functions
```

## Tech Stack

| Category        | Technology                          |
|-----------------|-------------------------------------|
| Framework       | Next.js 16 (App Router)             |
| Language        | TypeScript                          |
| Styling         | Tailwind CSS 4                      |
| UI Components   | shadcn/ui + Radix UI                |
| State           | Zustand                             |
| Server State    | TanStack Query (React Query)        |
| Forms           | React Hook Form + Zod               |
| HTTP Client     | Axios                               |
| Real-time       | Socket.io-client (WebSocket), SSE   |
| Charts          | Recharts                            |
| Icons           | Lucide React                        |

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # Run ESLint
```

## API Architecture

The frontend uses a proxy pattern to avoid CORS issues:
- Client requests go to `/backend/*`
- Next.js API routes forward requests to the backend at `NEXT_PUBLIC_API_URL/api/*`
- JWT tokens are automatically attached via Axios interceptors

## Role-Based Access

| Route Pattern      | CLIENT | MANAGER | ADMIN |
|--------------------|--------|---------|-------|
| /dashboard         |   Y    |    Y    |   Y   |
| /accounts          |   Y    |    Y    |   Y   |
| /trading           |   Y    |    Y    |   Y   |
| /loans             |   Y    |    Y    |   Y   |
| /chat              |   Y    |    -    |   -   |
| /advisor           |   -    |    Y    |   -   |
| /admin/*           |   -    |    -    |   Y   |

## Development Notes

- **Authentication**: JWT stored in localStorage, auto-redirect on 401
- **Protected Routes**: Wrap pages with `ProtectedRoute` component
- **API Calls**: Use functions from `lib/api/*` modules
- **Real-time**: WebSocket for chat, SSE for notifications
- **Form Validation**: Zod schemas with React Hook Form

---

Built with Next.js and TypeScript
