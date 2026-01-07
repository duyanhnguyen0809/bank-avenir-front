// User types
export type UserRole = 'CLIENT' | 'MANAGER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

export interface UserProfile {
  id?: string;
  userId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  dateOfBirth?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  emailConfirmed?: boolean;
  profile: UserProfile;
  accountsCount?: number;
  accounts?: BankAccount[];
  createdAt?: string;
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
  operations?: AccountOperation[]; // Last 10 operations from GET /accounts/:id
}

// Transfer response from POST /accounts/transfer
export interface TransferResponse {
  message: string;
  transferId: string;
  newBalance: number;
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
export type LoanRequestStatus = 'PENDING' | 'ASSIGNED' | 'APPROVED' | 'REJECTED';

export interface LoanRequest {
  id: string;
  userId: string;
  accountId: string;
  requestedAmount: number | string; // Backend may return string
  termMonths: number;
  purpose: string;
  status: LoanRequestStatus;
  managerId?: string | null;
  approvedAmount?: number | null;
  approvedRate?: number | null;
  approvedTermMonths?: number | null;
  rejectionReason?: string | null;
  createdAt: string;
  assignedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  // Populated fields
  user?: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
  account?: {
    id: string;
    iban: string;
    accountType: string;
    balance: number;
  };
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
  approvalDate?: string | null;
  disbursementDate?: string;
  firstPaymentDate?: string | null;
  // Populated from user when fetching pending loans
  applicantName?: string;
  applicantEmail?: string;
  // Account details (populated by backend)
  account?: {
    id: string;
    iban: string;
    accountType: string;
    balance: number;
    currency: string;
  };
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
  // Additional fields from backend
  senderName?: string;
  receiverName?: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  // Backend returns otherUser directly
  otherUser?: {
    id: string;
    name: string;
    role: string;
  };
  // Legacy fields
  clientId?: string;
  clientName?: string;
  advisorId?: string;
  advisorName?: string;
  status?: string;
}

// Notification types
export type NotificationType =
  | 'LOAN_REQUEST'
  | 'LOAN_REQUEST_ASSIGNED'
  | 'LOAN_APPROVED'
  | 'LOAN_REJECTED'
  | 'ORDER_EXECUTED'
  | 'LOAN_GRANTED'
  | 'SAVINGS_RATE_CHANGED'
  | 'PRIVATE_MESSAGE_SENT'
  | 'ACCOUNT_CREDITED'
  | 'ACCOUNT_DEBITED'
  | 'SUCCESS'
  | 'WARNING'
  | 'INFO'
  | 'ERROR';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType | string;
  isRead: boolean;
  metadata?: string | null; // JSON string with additional data
  createdAt: string;
}

// Transaction types (for account operations display)
export interface Transaction {
  id: string;
  accountId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT';
  amount: number;
  currency: string;
  description?: string;
  date: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  reference?: string;
}

// Admin types
export interface DashboardStats {
  users: {
    total: number;
  };
  accounts: {
    total: number;
    totalBalance: string;
  };
  orders: {
    total: number;
    pending: number;
  };
  loans: {
    total: number;
    active: number;
  };
}

export interface SavingsRate {
  id: string;
  accountType: AccountType;
  minBalance: number;
  rate: number;
  effectiveDate: string;
}

// News types
export type NewsCategory = 'PRODUCTS' | 'SERVICES' | 'ANNOUNCEMENTS' | 'PROMOTIONS' | 'GENERAL';

export interface News {
  id: string;
  title: string;
  content: string;
  category: NewsCategory;
  isPublished: boolean;
  authorId?: string;
  author?: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: string;
  updatedAt?: string;
}
