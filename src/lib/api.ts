// Используем относительный путь для работы с Vite proxy в разработке
// В production можно использовать полный URL через VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface LoginResponse {
  token: string;
  admin: {
    id: number;
    email: string;
    name: string;
  };
}

export interface ApiError {
  error: string;
}

class ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('admin_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Ошибка запроса');
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<void> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    });
  }

  async verifyToken(): Promise<{ valid: boolean; admin: any }> {
    return this.request<{ valid: boolean; admin: any }>('/auth/verify');
  }

  async getDashboardStats(): Promise<any> {
    return this.request<any>('/admin/dashboard/stats');
  }

  // Testimonials API
  async getTestimonials(): Promise<any[]> {
    return this.request<any[]>('/admin/testimonials');
  }

  async getTestimonialById(id: number): Promise<any> {
    return this.request<any>(`/admin/testimonials/${id}`);
  }

  async uploadAvatar(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = this.getAuthToken();
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/admin/testimonials/upload-avatar`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Ошибка при загрузке файла');
    }

    return response.json();
  }

  async createTestimonial(data: any): Promise<any> {
    return this.request<any>('/admin/testimonials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTestimonial(id: number, data: any): Promise<any> {
    return this.request<any>(`/admin/testimonials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTestimonial(id: number): Promise<void> {
    return this.request<void>(`/admin/testimonials/${id}`, {
      method: 'DELETE',
    });
  }

  // Public API (без авторизации)
  async getPublicTestimonials(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/public/testimonials`);
    if (!response.ok) {
      throw new Error('Ошибка при получении отзывов');
    }
    return response.json();
  }
}

export const api = new ApiClient();

