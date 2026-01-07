import api from './client';
import { User } from '@/lib/types';
import { USE_MOCK_API } from '@/lib/config';
import { mockAuthApi } from '@/lib/mock/api';

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
    if (USE_MOCK_API) {
      const result = await mockAuthApi.login(data.email, data.password);
      return { accessToken: result.token, user: result.user };
    }
    const response = await api.post('/auth/login', data);
    // Backend returns { accessToken, user: { id, email, role, profile } }
    return {
      accessToken: response.data.accessToken,
      user: response.data.user,
    };
  },

  register: async (data: RegisterRequest): Promise<{ message: string; userId: string; confirmationToken: string }> => {
    if (USE_MOCK_API) {
      await mockAuthApi.register(data);
      return {
        message: 'User registered successfully. Please check your email to confirm your account.',
        userId: 'mock-user-id',
        confirmationToken: 'mock-token',
      };
    }
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  confirmEmail: async (token: string): Promise<{ message: string; userId: string }> => {
    if (USE_MOCK_API) {
      return { message: 'Email confirmed successfully', userId: 'mock-user-id' };
    }
    const response = await api.get(`/auth/confirm/${token}`);
    return response.data;
  },
};
