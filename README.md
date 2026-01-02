# 🏦 Bank Avenir - Frontend

A modern digital banking platform built with **Next.js 15**, **TypeScript**, and **shadcn/ui**.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Backend server running on `http://localhost:3000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit: **http://localhost:3000**

### Test Credentials
- **Email**: client@bank-avenir.com
- **Password**: Client123!

## ✅ Phase 1: Complete

### Features Working:
- ✅ **Authentication** (Login/Register/Email Confirmation)
- ✅ **Protected Routes** with auth guards
- ✅ **Dashboard Layout** (Navbar + Sidebar)
- ✅ **Dashboard Home** with stats cards
- ✅ **API Client** configured with JWT
- ✅ **State Management** (Zustand)
- ✅ **UI Components** (17 shadcn components)

## 📂 Project Structure

```
app/
├── (auth)/              # Public pages (login, register)
├── (dashboard)/         # Protected pages (dashboard, accounts, etc.)
└── page.tsx             # Root redirects to login

components/
├── layout/              # Navbar, Sidebar, ProtectedRoute
├── ui/                  # shadcn/ui components
└── [features]/          # Feature-specific components (coming)

lib/
├── api/                 # API service modules
├── store/               # Zustand stores
├── types/               # TypeScript types
└── utils/               # Utility functions
```

## 🎯 Next Steps

### Phase 2: Accounts Management (Next)
- [ ] List accounts page
- [ ] Account details page
- [ ] Open account form
- [ ] Transaction history

### Phase 3: Trading System
- [ ] Securities list
- [ ] Place orders (BUY/SELL)
- [ ] Portfolio view
- [ ] Order book

### Phase 4: Loans
- [ ] Loan application
- [ ] Amortization schedule
- [ ] Loan management

### Phase 5: Real-Time
- [ ] WebSocket chat
- [ ] SSE notifications
- [ ] Live updates

### Phase 6: Admin Panel
- [ ] User management
- [ ] Securities management
- [ ] System statistics

## 📚 Documentation

- **[QUICK-START.md](QUICK-START.md)** - Fast setup guide
- **[DEVELOPMENT-STEPS.md](DEVELOPMENT-STEPS.md)** - Complete development guide
- **[PHASE-1-COMPLETE.md](PHASE-1-COMPLETE.md)** - What's working now

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Server State**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Real-time**: Socket.io-client (ready)

## 🔧 Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Production server
npm run lint         # Run ESLint
```

## 🌐 Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

## 📦 Dependencies

### Core
- axios, socket.io-client, zustand
- @tanstack/react-query
- react-hook-form, @hookform/resolvers, zod
- date-fns, recharts, lucide-react

### UI
- shadcn/ui components
- tailwindcss, class-variance-authority
- clsx, tailwind-merge

## 🎨 Features

- **Modern UI**: Beautiful gradient designs
- **Responsive**: Mobile-first approach
- **Type-Safe**: Full TypeScript coverage
- **Form Validation**: Zod schemas
- **Error Handling**: User-friendly messages
- **Loading States**: Disabled buttons during actions
- **Protected Routes**: Automatic auth checks

## 🐛 Troubleshooting

### Backend Connection
Make sure backend is running:
```bash
curl http://localhost:3000/auth/login
```

### Port Conflict
Change frontend port if backend uses 3000:
```bash
# In package.json:
"dev": "next dev -p 3001"
```

## 📞 Support

See documentation files for detailed guides and API references.

---

**Status**: ✅ Phase 1 Complete - Authentication & Foundation Ready
**Next**: Phase 2 - Accounts Management

Built with ❤️ using Next.js and TypeScript


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
