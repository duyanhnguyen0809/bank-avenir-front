# 🚀 Bank Avenir Frontend - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Backend server running on `http://localhost:3000`
- Git repository initialized

---

## ⚡ Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Additional Packages

```bash
# Core packages
npm install axios socket.io-client zustand @tanstack/react-query
npm install react-hook-form @hookform/resolvers/zod zod
npm install date-fns recharts lucide-react
npm install class-variance-authority clsx tailwind-merge

# shadcn/ui setup
npx shadcn@latest init
```

During shadcn init, choose:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

### 3. Install UI Components

```bash
npx shadcn@latest add button card input label form table dialog dropdown-menu toast tabs badge alert select separator sheet avatar scroll-area
```

### 4. Create Environment File

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

### 5. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3001

---

## 📂 What to Build First

Follow this order for incremental development:

### ✅ Week 1: Foundation (MVP)
1. **Authentication** (2 days)
   - Login page
   - Register page
   - Email confirmation page
   - Auth store & API integration

2. **Layout** (1 day)
   - Dashboard layout
   - Navbar with notifications bell
   - Sidebar navigation
   - Protected routes

3. **Dashboard** (2 days)
   - Overview page
   - Account cards
   - Recent transactions
   - Balance charts

### ✅ Week 2: Core Banking Features
4. **Accounts** (2 days)
   - List accounts
   - Account details page
   - Open new account form
   - Transaction history

5. **Notifications** (1 day)
   - Notifications page
   - Mark as read functionality
   - SSE integration

### ✅ Week 3: Trading System
6. **Trading** (3 days)
   - Securities list
   - Place order form (BUY/SELL)
   - Orders list with cancel
   - Portfolio view
   - Order book display

### ✅ Week 4: Advanced Features
7. **Loans** (2 days)
   - Loan application form
   - Loans list
   - Loan details with amortization schedule

8. **Chat** (3 days)
   - WebSocket integration
   - Chat interface
   - Help request system
   - Conversation management

### ✅ Week 5: Admin & Polish
9. **Admin Panel** (2 days)
   - User management
   - Securities management
   - Dashboard statistics

10. **Polish** (3 days)
    - Responsive design
    - Loading states
    - Error handling
    - Animations

---

## 🎯 Development Workflow

### Daily Routine

1. **Start Backend Server**
   ```bash
   cd bank-avenir-backend
   npm run start:dev
   ```

2. **Start Frontend Server**
   ```bash
   cd bank-avenir-front
   npm run dev
   ```

3. **Test API with Postman**
   - Import `postman-collection.json`
   - Test endpoints before building UI

4. **Build Feature**
   - Create types
   - Create API service
   - Build UI components
   - Test with real data

---

## 📝 Code Snippets

### Add New Page (Example: Portfolio)

1. **Create API Service** (`lib/api/portfolio.ts`)
```typescript
import api from './client';

export const portfolioApi = {
  getPortfolio: async (accountId: string) => {
    const response = await api.get(`/orders/account/${accountId}/portfolio`);
    return response.data;
  },
};
```

2. **Create Page** (`app/(dashboard)/portfolio/page.tsx`)
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { portfolioApi } from '@/lib/api/portfolio';

export default function PortfolioPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => portfolioApi.getPortfolio('account-id'),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Portfolio</h1>
      {/* Render data */}
    </div>
  );
}
```

3. **Add to Navigation** (already in sidebar)

---

## 🔧 Common Tasks

### Add New shadcn Component
```bash
npx shadcn@latest add [component-name]
```

### Create New API Endpoint
1. Add to `lib/api/[feature].ts`
2. Define types in `lib/types/index.ts`
3. Use in components with `useQuery` or `useMutation`

### Add New Route
1. Create folder in `app/(dashboard)/[route-name]/`
2. Add `page.tsx`
3. Update sidebar navigation if needed

### Debug API Issues
1. Check Network tab in DevTools
2. Verify backend is running
3. Check console for errors
4. Test endpoint in Postman first

---

## 📦 Project Structure

```
bank-avenir-front/
├── app/
│   ├── (auth)/              # Public routes (login, register)
│   ├── (dashboard)/         # Protected routes
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── layout/              # Layout components (Navbar, Sidebar)
│   ├── ui/                  # shadcn components
│   └── [features]/          # Feature-specific components
├── lib/
│   ├── api/                 # API services
│   ├── hooks/               # Custom hooks
│   ├── store/               # Zustand stores
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
├── public/                  # Static assets
└── .env.local              # Environment variables
```

---

## 🐛 Troubleshooting

### Backend Connection Issues
```bash
# Check if backend is running
curl http://localhost:3000/auth/login

# Check CORS settings in backend
# Verify API_URL in .env.local
```

### Authentication Not Working
1. Check token in localStorage
2. Verify JWT in backend logs
3. Check axios interceptors
4. Test login in Postman

### WebSocket Not Connecting
1. Verify backend WebSocket server running
2. Check WS_URL in .env.local
3. Check browser console for errors
4. Use `test-chat.html` to debug

### Components Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reinstall shadcn components
npx shadcn@latest add [component]
```

---

## 📚 Key Resources

- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:3001
- **Postman Collection**: `postman-collection.json`
- **API Docs**: `API-QUICK-REFERENCE.md`
- **Full Guide**: `DEVELOPMENT-STEPS.md`

---

## ✅ Pre-Launch Checklist

- [ ] All authentication flows working
- [ ] Can create and view accounts
- [ ] Trading system functional (orders, portfolio)
- [ ] Loans can be applied for and viewed
- [ ] Chat system works (WebSocket)
- [ ] Notifications appear (SSE)
- [ ] Admin panel accessible
- [ ] Responsive on mobile
- [ ] Error handling in place
- [ ] Loading states everywhere

---

## 🎉 Getting Help

1. **Check Documentation**: Start with `DEVELOPMENT-STEPS.md`
2. **Test Backend**: Use Postman to verify API works
3. **Console Logs**: Check browser console for errors
4. **Network Tab**: Inspect API requests/responses

---

**Ready to build? Start with Phase 1 in `DEVELOPMENT-STEPS.md`! 🚀**
