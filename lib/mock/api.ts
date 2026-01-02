// Mock API services for testing frontend without backend
// Set USE_MOCK_API=true in your environment or toggle here

import {
  mockUsers,
  mockAccounts,
  mockSecurities,
  mockOrders,
  mockLoans,
  mockTransactions,
  mockNotifications,
  mockPortfolio,
  mockOrderBook,
} from './data';
import { User, BankAccount, Order, Security, Loan, Notification, Transaction } from '@/lib/types';

// Simulate network delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Generate random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// In-memory storage (persists during session)
let users = [...mockUsers];
let accounts = [...mockAccounts];
let securities = [...mockSecurities];
let orders = [...mockOrders];
let loans = [...mockLoans];
let transactions = [...mockTransactions];
let notifications = [...mockNotifications];

// ============ AUTH API ============
export const mockAuthApi = {
  async login(email: string, password: string) {
    await delay(800);
    
    const user = users.find(u => u.email === email);
    
    // Accept any password for testing
    if (!user) {
      // Create user on the fly for testing
      const newUser: User = {
        id: generateId(),
        email,
        role: 'CLIENT',
        status: 'ACTIVE',
        emailConfirmed: true,
        profile: {
          firstName: email.split('@')[0],
          lastName: 'User',
          phone: '',
          address: '',
          dateOfBirth: '1990-01-01',
        },
      };
      users.push(newUser);
      
      // Create default accounts for new user
      const newCheckingAccount: BankAccount = {
        id: generateId(),
        userId: newUser.id,
        accountType: 'CHECKING',
        iban: `FR76${Math.random().toString().slice(2, 25).padEnd(23, '0')}`,
        balance: 1000,
        currency: 'EUR',
        name: 'Main Checking',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      accounts.push(newCheckingAccount);
      
      return {
        user: newUser,
        token: `mock-jwt-token-${newUser.id}`,
      };
    }
    
    return {
      user,
      token: `mock-jwt-token-${user.id}`,
    };
  },

  async register(data: { email: string; password: string; firstName: string; lastName: string }) {
    await delay(800);
    
    if (users.find(u => u.email === data.email)) {
      throw new Error('Email already exists');
    }
    
    const newUser: User = {
      id: generateId(),
      email: data.email,
      role: 'CLIENT',
      status: 'ACTIVE',
      emailConfirmed: true,
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: '',
        address: '',
      },
    };
    
    users.push(newUser);
    
    return {
      user: newUser,
      token: `mock-jwt-token-${newUser.id}`,
    };
  },

  async getCurrentUser(token: string) {
    await delay(300);
    const userId = token.replace('mock-jwt-token-', '');
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    return user;
  },

  async logout() {
    await delay(200);
    return { success: true };
  },
};

// ============ ACCOUNTS API ============
export const mockAccountsApi = {
  async getUserAccounts(userId: string): Promise<BankAccount[]> {
    await delay(400);
    return accounts.filter(a => a.userId === userId);
  },

  async getAccount(accountId: string): Promise<BankAccount> {
    await delay(300);
    const account = accounts.find(a => a.id === accountId);
    if (!account) throw new Error('Account not found');
    return account;
  },

  async openAccount(data: {
    userId: string;
    accountType: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
    initialDeposit: number;
    name?: string;
    currency?: string;
  }): Promise<BankAccount> {
    await delay(600);
    
    const newAccount: BankAccount = {
      id: generateId(),
      userId: data.userId,
      accountType: data.accountType,
      iban: `FR76${Math.random().toString().slice(2, 25).padEnd(23, '0')}`,
      balance: data.initialDeposit,
      currency: data.currency || 'EUR',
      name: data.name || `My ${data.accountType} Account`,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    
    accounts.push(newAccount);
    
    // Add initial deposit transaction
    transactions.push({
      id: generateId(),
      accountId: newAccount.id,
      type: 'DEPOSIT',
      amount: data.initialDeposit,
      currency: data.currency || 'EUR',
      description: 'Initial deposit',
      date: new Date().toISOString(),
      status: 'COMPLETED',
    });
    
    return newAccount;
  },

  async getAccountOperations(accountId: string): Promise<Transaction[]> {
    await delay(400);
    return transactions
      .filter(t => t.accountId === accountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async transfer(data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description?: string;
  }) {
    await delay(500);
    
    const fromAccount = accounts.find(a => a.id === data.fromAccountId);
    const toAccount = accounts.find(a => a.id === data.toAccountId);
    
    if (!fromAccount || !toAccount) throw new Error('Account not found');
    if (fromAccount.balance < data.amount) throw new Error('Insufficient funds');
    
    fromAccount.balance -= data.amount;
    toAccount.balance += data.amount;
    
    const transferId = generateId();
    
    transactions.push(
      {
        id: generateId(),
        accountId: data.fromAccountId,
        type: 'TRANSFER',
        amount: -data.amount,
        currency: fromAccount.currency,
        description: data.description || `Transfer to ${toAccount.name}`,
        date: new Date().toISOString(),
        status: 'COMPLETED',
        reference: transferId,
      },
      {
        id: generateId(),
        accountId: data.toAccountId,
        type: 'TRANSFER',
        amount: data.amount,
        currency: toAccount.currency,
        description: data.description || `Transfer from ${fromAccount.name}`,
        date: new Date().toISOString(),
        status: 'COMPLETED',
        reference: transferId,
      }
    );
    
    return { success: true, transferId };
  },
};

// ============ SECURITIES API ============
export const mockSecuritiesApi = {
  async getAllSecurities(): Promise<Security[]> {
    await delay(400);
    return securities;
  },

  async getSecurity(securityId: string): Promise<Security> {
    await delay(300);
    const security = securities.find(s => s.id === securityId);
    if (!security) throw new Error('Security not found');
    return security;
  },

  async searchSecurities(query: string): Promise<Security[]> {
    await delay(300);
    const lowerQuery = query.toLowerCase();
    return securities.filter(
      s =>
        s.symbol.toLowerCase().includes(lowerQuery) ||
        s.name.toLowerCase().includes(lowerQuery)
    );
  },

  async getOrderBook(securityId: string) {
    await delay(300);
    // Return order book with slight price variations
    const security = securities.find(s => s.id === securityId);
    if (!security) throw new Error('Security not found');
    
    const basePrice = security.currentPrice;
    return {
      securityId,
      bids: Array.from({ length: 5 }, (_, i) => ({
        price: Number((basePrice - (i + 1) * 0.05).toFixed(2)),
        quantity: Math.floor(Math.random() * 500) + 100,
      })),
      asks: Array.from({ length: 5 }, (_, i) => ({
        price: Number((basePrice + (i + 1) * 0.05).toFixed(2)),
        quantity: Math.floor(Math.random() * 500) + 100,
      })),
    };
  },
};

// ============ ORDERS API ============
export const mockOrdersApi = {
  async getUserOrders(userId: string): Promise<Order[]> {
    await delay(400);
    return orders
      .filter(o => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getOrder(orderId: string): Promise<Order> {
    await delay(300);
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');
    return order;
  },

  async placeOrder(data: {
    userId: string;
    accountId: string;
    securityId: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
  }): Promise<Order> {
    await delay(600);
    
    const security = securities.find(s => s.id === data.securityId);
    if (!security) throw new Error('Security not found');
    
    const account = accounts.find(a => a.id === data.accountId);
    if (!account) throw new Error('Account not found');
    
    const totalAmount = data.quantity * data.price;
    
    if (data.type === 'BUY' && account.balance < totalAmount) {
      throw new Error('Insufficient funds');
    }
    
    const newOrder: Order = {
      id: generateId(),
      userId: data.userId,
      accountId: data.accountId,
      securityId: data.securityId,
      security,
      type: data.type,
      status: 'PENDING',
      quantity: data.quantity,
      remainingQuantity: data.quantity,
      executedQuantity: 0,
      price: data.price,
      reservedAmount: totalAmount,
      createdAt: new Date().toISOString(),
    };
    
    orders.push(newOrder);
    
    // Simulate order execution after 2 seconds
    setTimeout(() => {
      const order = orders.find(o => o.id === newOrder.id);
      if (order && order.status === 'PENDING') {
        order.status = 'EXECUTED';
        order.executedAt = new Date().toISOString();
        order.executedQuantity = order.quantity;
        order.remainingQuantity = 0;
        
        // Update account balance
        if (data.type === 'BUY') {
          account.balance -= totalAmount;
        } else {
          account.balance += totalAmount;
        }
        
        // Add notification
        notifications.push({
          id: generateId(),
          userId: data.userId,
          type: 'SUCCESS',
          title: 'Order Executed',
          message: `Your ${data.type.toLowerCase()} order for ${data.quantity} ${security.symbol} has been executed at $${data.price}.`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }, 2000);
    
    return newOrder;
  },

  async cancelOrder(orderId: string): Promise<Order> {
    await delay(400);
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');
    if (order.status !== 'PENDING') throw new Error('Cannot cancel non-pending order');
    
    order.status = 'CANCELLED';
    return order;
  },

  async getPortfolio(userId: string) {
    await delay(400);
    // Return mock portfolio for the user
    return mockPortfolio;
  },
};

// ============ LOANS API ============
export const mockLoansApi = {
  async getUserLoans(userId: string): Promise<Loan[]> {
    await delay(400);
    return loans.filter(l => l.userId === userId);
  },

  async getLoan(loanId: string): Promise<Loan> {
    await delay(300);
    const loan = loans.find(l => l.id === loanId);
    if (!loan) throw new Error('Loan not found');
    return loan;
  },

  async applyForLoan(data: {
    userId: string;
    accountId: string;
    type: 'PERSONAL' | 'MORTGAGE' | 'AUTO' | 'STUDENT';
    amount: number;
    termMonths: number;
  }): Promise<Loan> {
    await delay(800);
    
    // Calculate monthly payment (simplified formula)
    const annualRate = data.type === 'MORTGAGE' ? 3.8 : data.type === 'AUTO' ? 4.2 : data.type === 'STUDENT' ? 3.5 : 5.5;
    const insuranceRate = 0.3;
    const monthlyRate = annualRate / 100 / 12;
    const monthlyPayment = (data.amount * monthlyRate * Math.pow(1 + monthlyRate, data.termMonths)) /
      (Math.pow(1 + monthlyRate, data.termMonths) - 1);
    
    const newLoan: Loan = {
      id: generateId(),
      userId: data.userId,
      accountId: data.accountId,
      amount: data.amount,
      interestRate: annualRate,
      insuranceRate: insuranceRate,
      durationMonths: data.termMonths,
      monthlyPayment: Number(monthlyPayment.toFixed(2)),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    
    loans.push(newLoan);
    
    // Add notification
    notifications.push({
      id: generateId(),
      userId: data.userId,
      type: 'INFO',
      title: 'Loan Application Received',
      message: `Your ${data.type.toLowerCase()} loan application for €${data.amount.toLocaleString()} is under review.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    
    return newLoan;
  },

  async getLoanSchedule(loanId: string) {
    await delay(400);
    const loan = loans.find(l => l.id === loanId);
    if (!loan) throw new Error('Loan not found');
    
    // Generate amortization schedule
    const schedule = [];
    let balance = loan.amount;
    const monthlyRate = loan.interestRate / 100 / 12;
    const startDate = loan.disbursementDate ? new Date(loan.disbursementDate) : new Date();
    
    for (let i = 1; i <= loan.durationMonths; i++) {
      const interest = balance * monthlyRate;
      const principal = loan.monthlyPayment - interest;
      balance -= principal;
      
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + i);
      
      schedule.push({
        month: i,
        date: paymentDate.toISOString().split('T')[0],
        payment: loan.monthlyPayment,
        principal: Number(principal.toFixed(2)),
        interest: Number(interest.toFixed(2)),
        balance: Math.max(0, Number(balance.toFixed(2))),
      });
    }
    
    return schedule;
  },
};

// ============ NOTIFICATIONS API ============
export const mockNotificationsApi = {
  async getUserNotifications(userId: string): Promise<Notification[]> {
    await delay(300);
    return notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    await delay(200);
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) throw new Error('Notification not found');
    notification.read = true;
    return notification;
  },

  async markAllAsRead(userId: string): Promise<void> {
    await delay(300);
    notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
  },

  async getUnreadCount(userId: string): Promise<number> {
    await delay(200);
    return notifications.filter(n => n.userId === userId && !n.read).length;
  },
};

// Export all mock APIs
export const mockApi = {
  auth: mockAuthApi,
  accounts: mockAccountsApi,
  securities: mockSecuritiesApi,
  orders: mockOrdersApi,
  loans: mockLoansApi,
  notifications: mockNotificationsApi,
};
