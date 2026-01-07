// Re-export all API modules
export { default as api } from './client';
export { authApi } from './auth';
export { accountsApi } from './accounts';
export { ordersApi } from './orders';
export { loansApi } from './loans';
export { notificationsApi } from './notifications';
export { chatApi } from './chat';
export { securitiesApi } from './securities';
export { adminApi } from './admin';

// Re-export types from API modules
export type { LoginRequest, LoginResponse, RegisterRequest } from './auth';
export type { OpenAccountRequest } from './accounts';
