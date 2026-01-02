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
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<void> => {
    if (USE_MOCK_API) {
      await mockAuthApi.register(data);
      return;
    }
    await api.post('/auth/register', data);
  },

  confirmEmail: async (token: string): Promise<void> => {
    if (USE_MOCK_API) {
      return; // No-op for mock
    }
    await api.get(`/auth/confirm/${token}`);
  },
};
