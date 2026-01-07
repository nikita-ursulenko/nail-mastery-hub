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
}

export const api = new ApiClient();

