const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: string;
  email: string;
  username: string;
}

export interface LoginResponse {
  accessToken: string;
}

export const authApi = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  },

  async login(data: LoginData): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  async getCurrentUser(token: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    return response.json();
  },
};
