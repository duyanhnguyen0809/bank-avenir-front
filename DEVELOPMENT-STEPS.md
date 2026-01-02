# 🏦 Bank Avenir Frontend - Step-by-Step Development Guide

## 📋 Overview

This guide provides a complete, step-by-step approach to building the Bank Avenir frontend application. Follow these steps sequentially for best results.

---

## 🎯 Phase 1: Project Initialization and Setup

### Step 1.1: Initialize Next.js Project (Already Done ✓)

Your project is already initialized with Next.js 15. Current structure:
```
bank-avenir-front/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── public/
├── next.config.ts
├── tsconfig.json
└── package.json
```

### Step 1.2: Install Core Dependencies

```bash
npm install axios socket.io-client zustand @tanstack/react-query
npm install react-hook-form @hookform/resolvers/zod zod
npm install date-fns recharts
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
```

### Step 1.3: Install UI Components (shadcn/ui)

```bash
npx shadcn@latest init
```

Then install necessary components:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add form
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add toast
npx shadcn@latest add tabs
npx shadcn@latest add badge
npx shadcn@latest add alert
npx shadcn@latest add select
npx shadcn@latest add separator
npx shadcn@latest add sheet
npx shadcn@latest add avatar
npx shadcn@latest add scroll-area
```

### Step 1.4: Configure Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

---

## 🎯 Phase 2: Project Structure Setup

### Step 2.1: Create Directory Structure

```bash
# Create directories
mkdir -p app/(auth)/login
mkdir -p app/(auth)/register
mkdir -p app/(auth)/confirm
mkdir -p app/(dashboard)/dashboard
mkdir -p app/(dashboard)/accounts
mkdir -p app/(dashboard)/trading
mkdir -p app/(dashboard)/loans
mkdir -p app/(dashboard)/chat
mkdir -p app/(dashboard)/notifications
mkdir -p app/(admin)/admin

mkdir -p components/layout
mkdir -p components/accounts
mkdir -p components/trading
mkdir -p components/loans
mkdir -p components/chat
mkdir -p components/notifications
mkdir -p components/ui

mkdir -p lib/api
mkdir -p lib/services
mkdir -p lib/hooks
mkdir -p lib/store
mkdir -p lib/types
mkdir -p lib/utils
```

### Step 2.2: Create Type Definitions

Create `lib/types/index.ts`:
```typescript
export type UserRole = 'CLIENT' | 'MANAGER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
export type AccountType = 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
export type OrderType = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'EXECUTED' | 'CANCELLED';
export type LoanStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED' | 'DEFAULTED';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailConfirmed: boolean;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
  };
}

export interface BankAccount {
  id: string;
  userId: string;
  iban: string;
  accountType: AccountType;
  balance: number;
  currency: string;
  status: string;
  name?: string;
  createdAt: string;
}

export interface AccountOperation {
  id: string;
  accountId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description?: string;
  senderIban?: string;
  recipientIban?: string;
  createdAt: string;
}

export interface Security {
  id: string;
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  currentPrice: number;
  isAvailable: boolean;
}

export interface Order {
  id: string;
  userId: string;
  accountId: string;
  securityId: string;
  type: OrderType;
  quantity: number;
  remainingQuantity: number;
  executedQuantity: number;
  price: number;
  status: OrderStatus;
  reservedAmount?: number;
  createdAt: string;
  executedAt?: string;
  security?: Security;
}

export interface Portfolio {
  id: string;
  accountId: string;
  securityId: string;
  quantity: number;
  averagePurchasePrice: number;
  totalCost: number;
  security: Security;
}

export interface Loan {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  interestRate: number;
  insuranceRate: number;
  durationMonths: number;
  monthlyPayment: number;
  status: LoanStatus;
  createdAt: string;
  approvalDate?: string;
  disbursementDate?: string;
}

export interface LoanSchedule {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  insuranceAmount: number;
  totalAmount: number;
  isPaid: boolean;
  paidDate?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: User;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}
```

---

## 🎯 Phase 3: Core Infrastructure

### Step 3.1: Create API Client

Create `lib/api/client.ts`:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Step 3.2: Create API Services

Create `lib/api/auth.ts`:
```typescript
import api from './client';
import { User } from '@/lib/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<void> => {
    await api.post('/auth/register', data);
  },

  confirmEmail: async (token: string): Promise<void> => {
    await api.get(`/auth/confirm/${token}`);
  },
};
```

Create `lib/api/accounts.ts`:
```typescript
import api from './client';
import { BankAccount, AccountOperation } from '@/lib/types';

export interface OpenAccountRequest {
  userId: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
  initialDeposit: number;
  name?: string;
  currency?: string;
}

export const accountsApi = {
  openAccount: async (data: OpenAccountRequest): Promise<BankAccount> => {
    const response = await api.post('/accounts/open', data);
    return response.data;
  },

  getAccount: async (id: string): Promise<BankAccount> => {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  getUserAccounts: async (userId: string): Promise<BankAccount[]> => {
    const response = await api.get(`/accounts/user/${userId}`);
    return response.data;
  },

  getAccountOperations: async (accountId: string): Promise<AccountOperation[]> => {
    const response = await api.get(`/accounts/${accountId}/operations`);
    return response.data;
  },

  calculateInterest: async (accountId: string): Promise<void> => {
    await api.post('/accounts/interest/calculate', { accountId });
  },
};
```

Create `lib/api/orders.ts`:
```typescript
import api from './client';
import { Order, Portfolio, Security } from '@/lib/types';

export interface PlaceOrderRequest {
  userId: string;
  accountId: string;
  securityId: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
}

export interface OrderBook {
  buyOrders: Order[];
  sellOrders: Order[];
}

export const ordersApi = {
  placeOrder: async (data: PlaceOrderRequest): Promise<Order> => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  getOrder: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  getUserOrders: async (userId: string): Promise<Order[]> => {
    const response = await api.get(`/orders/user/${userId}`);
    return response.data;
  },

  getOrderBook: async (securityId: string): Promise<OrderBook> => {
    const response = await api.get(`/orders/security/${securityId}/book`);
    return response.data;
  },

  getPortfolio: async (accountId: string): Promise<Portfolio[]> => {
    const response = await api.get(`/orders/account/${accountId}/portfolio`);
    return response.data;
  },

  cancelOrder: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },
};
```

Create `lib/api/securities.ts`:
```typescript
import api from './client';
import { Security } from '@/lib/types';

export const securitiesApi = {
  getSecurities: async (): Promise<Security[]> => {
    const response = await api.get('/admin/securities');
    return response.data;
  },

  getSecurity: async (id: string): Promise<Security> => {
    const response = await api.get(`/admin/securities/${id}`);
    return response.data;
  },
};
```

Create `lib/api/loans.ts`:
```typescript
import api from './client';
import { Loan, LoanSchedule } from '@/lib/types';

export interface GrantLoanRequest {
  userId: string;
  accountId: string;
  principal: number;
  annualRate: number;
  durationMonths: number;
  insuranceRate?: number;
}

export const loansApi = {
  grantLoan: async (data: GrantLoanRequest): Promise<Loan> => {
    const response = await api.post('/loans/grant', data);
    return response.data;
  },

  getLoan: async (id: string): Promise<Loan> => {
    const response = await api.get(`/loans/${id}`);
    return response.data;
  },

  getUserLoans: async (userId: string): Promise<Loan[]> => {
    const response = await api.get(`/loans/user/${userId}`);
    return response.data;
  },

  getSchedule: async (loanId: string): Promise<LoanSchedule[]> => {
    const response = await api.get(`/loans/${loanId}/schedule`);
    return response.data;
  },
};
```

Create `lib/api/notifications.ts`:
```typescript
import api from './client';
import { Notification } from '@/lib/types';

export const notificationsApi = {
  getNotifications: async (userId: string, unreadOnly?: boolean): Promise<Notification[]> => {
    const params = unreadOnly ? { unreadOnly: true } : {};
    const response = await api.get(`/notifications`, { params: { userId, ...params } });
    return response.data;
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    const response = await api.get(`/notifications/unread-count`, { params: { userId } });
    return response.data.count;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.post(`/notifications/${id}/read`);
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    await api.post(`/notifications/read-all`, { userId });
  },
};
```

### Step 3.3: Create Authentication Store

Create `lib/store/authStore.ts`:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/lib/types';
import { authApi, LoginRequest, RegisterRequest } from '@/lib/api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(data);
          localStorage.setItem('accessToken', response.accessToken);
          set({ user: response.user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          await authApi.register(data);
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
```

### Step 3.4: Create Notification Store

Create `lib/store/notificationStore.ts`:
```typescript
import { create } from 'zustand';
import { Notification } from '@/lib/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  setNotifications: (notifications) =>
    set({ notifications }),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  setUnreadCount: (count) =>
    set({ unreadCount: count }),
}));
```

---

## 🎯 Phase 4: Authentication Pages

### Step 4.1: Create Login Page

Create `app/(auth)/login/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/authStore';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      await login(data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Bank Avenir</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>

            <p className="text-sm text-center text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:underline">
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Step 4.2: Create Register Page

Create `app/(auth)/register/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/authStore';
import Link from 'next/link';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuthStore();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError('');
      await registerUser(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              We've sent a confirmation link to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Please check your inbox and click the confirmation link to activate your account.
            </p>
            <Link href="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Sign up for Bank Avenir</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register('firstName')} />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register('lastName')} />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input id="phone" {...register('phone')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Input id="address" {...register('address')} />
            </div>

            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>

            <p className="text-sm text-center text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🎯 Phase 5: Layout Components

### Step 5.1: Create Protected Route Wrapper

Create `components/layout/ProtectedRoute.tsx`:
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

### Step 5.2: Create Dashboard Layout

Create `app/(dashboard)/layout.tsx`:
```typescript
'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

### Step 5.3: Create Navbar Component

Create `components/layout/Navbar.tsx`:
```typescript
'use client';

import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store/authStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-gray-800">Bank Avenir</h1>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => router.push('/notifications')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user?.profile.firstName} {user?.profile.lastName}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{user?.email}</DropdownMenuItem>
            <DropdownMenuItem>Role: {user?.role}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

### Step 5.4: Create Sidebar Component

Create `components/layout/Sidebar.tsx`:
```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CreditCard, TrendingUp, DollarSign, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/authStore';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['CLIENT', 'MANAGER', 'ADMIN'] },
  { name: 'Accounts', href: '/accounts', icon: CreditCard, roles: ['CLIENT', 'MANAGER', 'ADMIN'] },
  { name: 'Trading', href: '/trading', icon: TrendingUp, roles: ['CLIENT', 'MANAGER', 'ADMIN'] },
  { name: 'Loans', href: '/loans', icon: DollarSign, roles: ['CLIENT', 'MANAGER', 'ADMIN'] },
  { name: 'Chat', href: '/chat', icon: MessageSquare, roles: ['CLIENT', 'MANAGER', 'ADMIN'] },
  { name: 'Admin', href: '/admin', icon: Settings, roles: ['ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role || 'CLIENT')
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200">
      <nav className="flex flex-col gap-2 p-4">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

---

## 🎯 Next Steps

Continue with:
- **Phase 6**: Accounts Management Pages
- **Phase 7**: Trading Interface
- **Phase 8**: Loans System
- **Phase 9**: WebSocket Chat
- **Phase 10**: SSE Notifications
- **Phase 11**: Admin Panel
- **Phase 12**: Polish & Deploy

Each phase builds on the previous one. Follow the guide sequentially for best results.

---

## 📚 Quick Commands Reference

```bash
# Development
npm run dev              # Start Next.js dev server

# Build
npm run build           # Production build
npm run start           # Production server

# Lint
npm run lint            # ESLint

# Add shadcn components
npx shadcn@latest add [component-name]
```

---

## ✅ Progress Checklist

- [x] Phase 1: Project initialization ✓
- [x] Phase 2: Project structure ✓
- [x] Phase 3: Core infrastructure ✓
- [x] Phase 4: Authentication pages ✓
- [x] Phase 5: Layout components ✓
- [ ] Phase 6: Accounts management
- [ ] Phase 7: Trading interface
- [ ] Phase 8: Loans system
- [ ] Phase 9: Chat system
- [ ] Phase 10: Notifications
- [ ] Phase 11: Admin panel
- [ ] Phase 12: Polish & deploy
