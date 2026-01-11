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

export interface UserLoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    phone?: string;
    avatar_url?: string;
    avatar_upload_path?: string;
  };
}

export interface RegisterResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    phone?: string;
    avatar_url?: string;
    avatar_upload_path?: string;
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

    // Добавляем кэширование для GET запросов (браузерное кэширование)
    const cacheOptions: RequestInit = {
      ...options,
      headers,
    };

    // Для GET запросов добавляем cache: 'default' для использования браузерного кэша
    if (!options.method || options.method === 'GET') {
      cacheOptions.cache = 'default';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, cacheOptions);

    if (!response.ok) {
      let errorMessage = 'Ошибка запроса';
      try {
        const error: ApiError = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
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

  // Contacts API
  async getContacts(): Promise<any[]> {
    return this.request<any[]>('/admin/contacts');
  }

  async getContactById(id: number): Promise<any> {
    return this.request<any>(`/admin/contacts/${id}`);
  }

  async createContact(data: any): Promise<any> {
    return this.request<any>('/admin/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContact(id: number, data: any): Promise<any> {
    return this.request<any>(`/admin/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContact(id: number): Promise<void> {
    return this.request<void>(`/admin/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  // Public Contacts API (без авторизации)
  async getPublicContacts(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/public/contacts`, {
      cache: 'default', // Используем браузерное кэширование
    });
    if (!response.ok) {
      throw new Error('Ошибка при получении контактов');
    }
    return response.json();
  }

  // Founder Info API (admin)
  async getFounderInfo(): Promise<any[]> {
    return this.request<any[]>('/admin/founder');
  }

  async getFounderInfoById(id: number): Promise<any> {
    return this.request<any>(`/admin/founder/${id}`);
  }

  async createFounderInfo(data: any): Promise<any> {
    return this.request<any>('/admin/founder', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFounderInfo(id: number, data: any): Promise<any> {
    return this.request<any>(`/admin/founder/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFounderInfo(id: number): Promise<void> {
    return this.request<void>(`/admin/founder/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadFounderImage(file: File): Promise<{ filename: string; url: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/admin/founder/upload-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при загрузке изображения');
    }

    return response.json();
  }

  // Public Founder Info API (без авторизации)
  async getPublicFounderInfo(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/public/founder`, {
      cache: 'default', // Используем браузерное кэширование
    });
    if (!response.ok) {
      throw new Error('Ошибка при получении информации об основателе');
    }
    return response.json();
  }

  // Team Members API (admin)
  async getTeamMembers(): Promise<any[]> {
    return this.request<any[]>('/admin/team');
  }

  // Admin Users API
  async getUsers(params?: { search?: string; limit?: number; offset?: number }): Promise<{ users: any[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    const query = queryParams.toString();
    return this.request<{ users: any[]; total: number }>(`/admin/users${query ? `?${query}` : ''}`);
  }

  async getUserById(id: number): Promise<{ user: any }> {
    return this.request<{ user: any }>(`/admin/users/${id}`);
  }

  async createUser(data: any): Promise<{ user: any }> {
    return this.request<{ user: any }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: any): Promise<{ user: any }> {
    return this.request<{ user: any }>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: number): Promise<void> {
    return this.request<void>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleUserActive(id: number): Promise<{ user: any }> {
    return this.request<{ user: any }>(`/admin/users/${id}/toggle-active`, {
      method: 'PATCH',
    });
  }

  // User Enrollments Management
  async getUserEnrollments(userId: number): Promise<{ enrollments: any[] }> {
    return this.request<{ enrollments: any[] }>(`/admin/users/${userId}/enrollments`);
  }

  async addUserEnrollment(userId: number, courseId: number, tariffId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/users/${userId}/enrollments`, {
      method: 'POST',
      body: JSON.stringify({ courseId, tariffId }),
    });
  }

  async removeUserEnrollment(userId: number, enrollmentId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/users/${userId}/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    });
  }

  async updateUserEnrollmentTariff(userId: number, enrollmentId: number, tariffId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/users/${userId}/enrollments/${enrollmentId}/tariff`, {
      method: 'PATCH',
      body: JSON.stringify({ tariffId }),
    });
  }

  // Admin Orders API
  async getOrders(params?: {
    search?: string;
    status?: string;
    payment_status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: any[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.payment_status) queryParams.append('payment_status', params.payment_status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    const query = queryParams.toString();
    return this.request<{ orders: any[]; total: number }>(`/admin/orders${query ? `?${query}` : ''}`);
  }

  async getOrdersStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    today: { orders: number; revenue: number };
    week: { orders: number; revenue: number };
    month: { orders: number; revenue: number };
  }> {
    return this.request('/admin/orders/stats');
  }

  // Admin Settings API
  async getSettings(): Promise<{ settings: { [key: string]: any } }> {
    return this.request<{ settings: { [key: string]: any } }>('/admin/settings');
  }

  async getSettingByKey(key: string): Promise<any> {
    return this.request<any>(`/admin/settings/${key}`);
  }

  async updateSetting(key: string, value: any, type?: string): Promise<any> {
    return this.request<any>(`/admin/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, type }),
    });
  }

  async updateSettings(settings: { [key: string]: any }): Promise<{ settings: { [key: string]: any } }> {
    return this.request<{ settings: { [key: string]: any } }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  }

  // Admin Referral API
  async getAdminReferralStats(): Promise<any> {
    return this.request<any>('/admin/referral/stats');
  }

  async getAdminReferralPartners(params?: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ partners: any[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request<{ partners: any[]; total: number }>(`/admin/referral/partners${query ? `?${query}` : ''}`);
  }

  async getAdminReferralPartnerStats(id: number): Promise<any> {
    return this.request<any>(`/admin/referral/partners/${id}/stats`);
  }

  async addAdminReferralPartnerFunds(id: number, amount: number, description: string): Promise<any> {
    return this.request<any>(`/admin/referral/partners/${id}/add-funds`, {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    });
  }

  async removeAdminReferralPartnerFunds(id: number, amount: number, description: string): Promise<any> {
    return this.request<any>(`/admin/referral/partners/${id}/remove-funds`, {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    });
  }

  async toggleAdminReferralPartnerStatus(id: number): Promise<any> {
    return this.request<any>(`/admin/referral/partners/${id}/toggle-status`, {
      method: 'POST',
    });
  }

  async getAdminReferralWithdrawals(params?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ withdrawals: any[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request<{ withdrawals: any[]; total: number }>(`/admin/referral/withdrawals${query ? `?${query}` : ''}`);
  }

  async approveAdminReferralWithdrawal(id: number): Promise<any> {
    return this.request<any>(`/admin/referral/withdrawals/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectAdminReferralWithdrawal(id: number, notes: string): Promise<any> {
    return this.request<any>(`/admin/referral/withdrawals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async markAdminReferralWithdrawalPaid(id: number): Promise<any> {
    return this.request<any>(`/admin/referral/withdrawals/${id}/mark-paid`, {
      method: 'POST',
    });
  }

  async getAdminReferralHistory(params?: {
    type?: string;
    partner_id?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ history: any[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request<{ history: any[]; total: number }>(`/admin/referral/history${query ? `?${query}` : ''}`);
  }

  async getTeamMemberById(id: number): Promise<any> {
    return this.request<any>(`/admin/team/${id}`);
  }

  async createTeamMember(data: any): Promise<any> {
    return this.request<any>('/admin/team', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTeamMember(id: number, data: any): Promise<any> {
    return this.request<any>(`/admin/team/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTeamMember(id: number): Promise<void> {
    return this.request<void>(`/admin/team/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadTeamImage(file: File): Promise<{ filename: string; url: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/admin/team/upload-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при загрузке изображения');
    }

    return response.json();
  }

  // Public Team Members API (без авторизации)
  async getPublicTeamMembers(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/public/team`, {
      cache: 'default', // Используем браузерное кэширование
    });
    if (!response.ok) {
      throw new Error('Ошибка при получении членов команды');
    }
    return response.json();
  }

  // Blog Posts API (admin)
  async getBlogPosts(): Promise<any[]> {
    return this.request<any[]>('/admin/blog');
  }

  async getBlogPostById(id: number): Promise<any> {
    return this.request<any>(`/admin/blog/${id}`);
  }

  async createBlogPost(data: any): Promise<any> {
    return this.request<any>('/admin/blog', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBlogPost(id: number, data: any): Promise<any> {
    return this.request<any>(`/admin/blog/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBlogPost(id: number): Promise<void> {
    return this.request<void>(`/admin/blog/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadBlogImage(file: File): Promise<{ filename: string; url: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/admin/blog/upload-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при загрузке изображения');
    }

    return response.json();
  }

  async uploadAuthorAvatar(file: File): Promise<{ filename: string; url: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/admin/blog/upload-author-avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при загрузке аватара автора');
    }

    return response.json();
  }

  // Public Blog Posts API (без авторизации)
  async getPublicBlogPosts(params?: { 
    category?: string; 
    featured?: boolean; 
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ posts: any[]; total: number; hasMore: boolean }> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.featured) queryParams.append('featured', 'true');
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const url = `${API_BASE_URL}/public/blog${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      cache: 'default', // Используем браузерное кэширование
    });
    if (!response.ok) {
      throw new Error('Ошибка при получении статей блога');
    }
    return response.json();
  }

  async getPublicBlogPostBySlug(slug: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/public/blog/${slug}`, {
      cache: 'default', // Используем браузерное кэширование
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Статья не найдена');
      }
      const error = await response.json().catch(() => ({ error: 'Ошибка при получении статьи' }));
      throw new Error(error.error || 'Ошибка при получении статьи');
    }
    return response.json();
  }

  // SEO Admin API
  async getSEOSettings(): Promise<any[]> {
    return this.request<any[]>('/admin/seo');
  }

  async getSEOSettingById(id: number): Promise<any> {
    return this.request<any>(`/admin/seo/${id}`);
  }

  async upsertSEO(data: any): Promise<any> {
    return this.request<any>('/admin/seo', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSEO(id: number, data: any): Promise<any> {
    return this.request<any>(`/admin/seo/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSEO(id: number): Promise<void> {
    return this.request<void>(`/admin/seo/${id}`, {
      method: 'DELETE',
    });
  }

  // User Auth API (для обычных пользователей)
  private getUserToken(): string | null {
    return localStorage.getItem('user_token');
  }

  private async userRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getUserToken();
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

  async userRegister(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Promise<RegisterResponse> {
    return this.userRequest<RegisterResponse>('/user/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async userLogin(email: string, password: string): Promise<UserLoginResponse> {
    return this.userRequest<UserLoginResponse>('/user/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async userVerifyToken(): Promise<{ valid: boolean; user: any }> {
    return this.userRequest<{ valid: boolean; user: any }>('/user/auth/verify');
  }

  // Public Courses API (без авторизации)
  async getPublicCourses(params?: {
    category?: string;
    level?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ courses: any[]; total: number; hasMore: boolean }> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.level) queryParams.append('level', params.level);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${API_BASE_URL}/public/courses${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      cache: 'default', // Используем браузерное кэширование
    });
    if (!response.ok) {
      throw new Error('Ошибка при получении курсов');
    }
    return response.json();
  }

  async getPublicCourseBySlug(slug: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/public/courses/${slug}`, {
      cache: 'default', // Используем браузерное кэширование
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Курс не найден');
      }
      const error = await response.json().catch(() => ({ error: 'Ошибка при получении курса' }));
      throw new Error(error.error || 'Ошибка при получении курса');
    }
    return response.json();
  }

  // Admin Courses API
  async getAllCourses(params?: {
    search?: string;
    category?: string;
    level?: string;
    is_active?: boolean;
  }): Promise<{ courses: any[] }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.level) queryParams.append('level', params.level);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());

    const endpoint = `/admin/courses${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request<{ courses: any[] }>(endpoint);
  }

  async getCourseById(id: number): Promise<any> {
    return this.request<any>(`/admin/courses/${id}`);
  }

  async createCourse(data: any): Promise<any> {
    return this.request<any>('/admin/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourse(id: number, data: any): Promise<any> {
    return this.request<any>(`/admin/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCourse(id: number): Promise<void> {
    return this.request<void>(`/admin/courses/${id}`, {
      method: 'DELETE',
    });
  }

  // Modules
  async createModule(data: any): Promise<any> {
    return this.request<any>('/admin/courses/modules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateModule(id: number, data: any): Promise<any> {
    return this.request<any>(`/admin/courses/modules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteModule(id: number): Promise<void> {
    return this.request<void>(`/admin/courses/modules/${id}`, {
      method: 'DELETE',
    });
  }

  // Lessons
  async createLesson(data: any): Promise<any> {
    return this.request<any>('/admin/courses/lessons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLesson(id: number, data: any): Promise<any> {
    return this.request<any>(`/admin/courses/lessons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLesson(id: number): Promise<void> {
    return this.request<void>(`/admin/courses/lessons/${id}`, {
      method: 'DELETE',
    });
  }

  // Tariffs
  async createTariff(data: any): Promise<any> {
    return this.request<any>('/admin/courses/tariffs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTariff(id: number, data: any): Promise<any> {
    return this.request<any>(`/admin/courses/tariffs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTariff(id: number): Promise<void> {
    return this.request<void>(`/admin/courses/tariffs/${id}`, {
      method: 'DELETE',
    });
  }

  // Materials
  async createMaterial(data: any): Promise<any> {
    return this.request<any>('/admin/courses/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMaterial(id: number, data: any): Promise<any> {
    return this.request<any>(`/admin/courses/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMaterial(id: number): Promise<void> {
    return this.request<void>(`/admin/courses/materials/${id}`, {
      method: 'DELETE',
    });
  }

  // User Courses API (требуют user_token)
  private async userRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getUserToken();
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
      let errorMessage = 'Ошибка запроса';
      try {
        const error: ApiError = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getUserCourses(): Promise<any> {
    return this.userRequest<any>('/user/courses');
  }

  async getUserCourseDetails(id: number): Promise<any> {
    return this.userRequest<any>(`/user/courses/${id}`);
  }

  async getUserLesson(lessonId: number): Promise<any> {
    return this.userRequest<any>(`/user/lessons/${lessonId}`);
  }

  async updateLessonProgress(
    lessonId: number,
    data: { watched_duration: number; is_completed: boolean }
  ): Promise<any> {
    return this.userRequest<any>(`/user/lessons/${lessonId}/progress`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Payment API
  async createCheckoutSession(data: { courseId: number; tariffId: number }): Promise<{ sessionId: string; url: string }> {
    return this.userRequest<{ sessionId: string; url: string }>('/payments/create-checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPaymentStatus(sessionId: string): Promise<{ status: string; sessionId: string; customerEmail?: string; enrollmentActivated?: boolean }> {
    return this.userRequest<{ status: string; sessionId: string; customerEmail?: string; enrollmentActivated?: boolean }>(`/payments/status/${sessionId}`);
  }

  // User Profile API
  async updateUserProfile(data: { name?: string; email?: string; phone?: string; avatar_url?: string; avatar_upload_path?: string }): Promise<{ user: any }> {
    return this.userRequest<{ user: any }>('/user/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changeUserPassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.userRequest<{ message: string }>('/user/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  async uploadUserAvatar(file: File): Promise<{ filename: string; url: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = this.getUserToken();
    const response = await fetch(`${API_BASE_URL}/user/auth/upload-avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при загрузке аватара');
    }

    return response.json();
  }

  // Referral Auth API
  async referralRegister(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Promise<{ token: string; partner: any }> {
    const response = await fetch(`${API_BASE_URL}/referral/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Ошибка при регистрации');
    }

    return response.json();
  }

  async referralLogin(email: string, password: string): Promise<{ token: string; partner: any }> {
    const response = await fetch(`${API_BASE_URL}/referral/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Ошибка при входе');
    }

    return response.json();
  }

  async referralVerifyToken(): Promise<{ valid: boolean; partner: any }> {
    const token = localStorage.getItem('referral_token');
    if (!token) {
      throw new Error('Токен не найден');
    }

    const response = await fetch(`${API_BASE_URL}/referral/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Токен недействителен');
    }

    return response.json();
  }

  // Referral Tracking API
  async trackReferralVisit(referralCode: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/referral/tracking/track-visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ referral_code: referralCode }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Ошибка при отслеживании');
    }

    return response.json();
  }

  async trackReferralRegistration(referralCode: string, userId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/referral/tracking/track-registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ referral_code: referralCode, user_id: userId }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Ошибка при отслеживании регистрации');
    }

    return response.json();
  }

  // Referral Dashboard API
  private async referralRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('referral_token');
    if (!token) {
      throw new Error('Токен не найден');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

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

  async getReferralDashboardStats(): Promise<any> {
    return this.referralRequest<any>('/referral/dashboard/stats');
  }

  async getReferralRewards(): Promise<{ rewards: any[] }> {
    const stats = await this.referralRequest<any>('/referral/dashboard/stats');
    return { rewards: stats.rewardsHistory || [] };
  }

  async getReferralReferrals(): Promise<{ referrals: any[] }> {
    const stats = await this.referralRequest<any>('/referral/dashboard/stats');
    return { referrals: stats.referredUsers || [] };
  }

  async getReferralWithdrawals(): Promise<{ withdrawals: any[] }> {
    return this.referralRequest<{ withdrawals: any[] }>('/referral/withdrawals/history');
  }

  async requestReferralWithdrawal(data: {
    amount: number;
    payment_details: string;
    telegram_tag?: string;
  }): Promise<any> {
    return this.referralRequest<any>('/referral/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReferralLink(): Promise<{ referral_code: string; referral_link: string }> {
    return this.referralRequest<{ referral_code: string; referral_link: string }>('/referral/dashboard/link');
  }

  async getReferralRewards(params?: {
    reward_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ rewards: any[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.referralRequest<{ rewards: any[] }>(`/referral/dashboard/rewards${query ? `?${query}` : ''}`);
  }

  async getReferralReferrals(): Promise<{ referrals: any[] }> {
    return this.referralRequest<{ referrals: any[] }>('/referral/dashboard/referrals');
  }

  async getReferralLevel(): Promise<{ level: string; referrals_count: number; total_earnings: number }> {
    return this.referralRequest<{ level: string; referrals_count: number; total_earnings: number }>('/referral/dashboard/level');
  }

  // Referral Withdrawals API
  async createWithdrawalRequest(data: {
    amount: number;
    payment_details: string;
    telegram_tag?: string;
  }): Promise<any> {
    return this.referralRequest<any>('/referral/withdrawals/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWithdrawalHistory(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ withdrawals: any[] }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.referralRequest<{ withdrawals: any[] }>(`/referral/withdrawals/history${query ? `?${query}` : ''}`);
  }

  // Referral Notifications API
  async getReferralNotifications(params?: {
    limit?: number;
    offset?: number;
    is_read?: boolean;
  }): Promise<{ notifications: any[] }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.referralRequest<{ notifications: any[] }>(`/referral/notifications${query ? `?${query}` : ''}`);
  }

  async getReferralUnreadCount(): Promise<{ unread_count: number }> {
    return this.referralRequest<{ unread_count: number }>('/referral/notifications/unread-count');
  }

  async markNotificationAsRead(notificationId: number): Promise<any> {
    return this.referralRequest<any>(`/referral/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead(): Promise<any> {
    return this.referralRequest<any>('/referral/notifications/mark-all-read', {
      method: 'PATCH',
    });
  }
}

export const api = new ApiClient();

