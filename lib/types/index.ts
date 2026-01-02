// User types
export type UserRole = 'CLIENT' | 'MANAGER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

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

// Account types
export type AccountType = 'CHECKING' | 'SAVINGS' | 'INVESTMENT';

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

// Trading types
export interface Security {
  id: string;
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  currentPrice: number;
  isAvailable: boolean;
}

export type OrderType = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'EXECUTED' | 'CANCELLED';

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

export interface Trade {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  securityId: string;
  quantity: number;
  price: number;
  buyerAccountId: string;
  sellerAccountId: string;
  commission: number;
  createdAt: string;
}

// Loan types
export type LoanStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED' | 'DEFAULTED';

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

// Chat types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: User;
  receiver?: User;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

// Admin types
export interface DashboardStats {
  totalUsers: number;
  totalAccounts: number;
  activeLoans: number;
  totalDeposits: number;
  totalLoanAmount: number;
}

export interface SavingsRate {
  id: string;
  accountType: AccountType;
  minBalance: number;
  rate: number;
  effectiveDate: string;
}
