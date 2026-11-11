const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions extends RequestInit {
  data?: any;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("linkflow_token");
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    if (options.data) {
      config.body = JSON.stringify(options.data);
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 204) {
        return {} as T;
      }

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        let errorMessage = "An unexpected error occurred.";
        if (responseData && responseData.detail) {
          if (Array.isArray(responseData.detail)) {
            // Pydantic validation error array
            errorMessage = responseData.detail.map((err: any) => err.msg || JSON.stringify(err)).join(", ");
          } else {
            errorMessage = responseData.detail;
          }
        } else if (responseData && responseData.message) {
          errorMessage = responseData.message;
        }
        throw new Error(errorMessage);
      }

      return responseData as T;
    } catch (error: any) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network request failed. Is the backend server running?");
    }
  }

  // --- Auth APIs ---
  async register(data: { full_name: string; email: string; password: string }) {
    return this.request<any>("/api/v1/auth/register", { method: "POST", data });
  }

  async login(data: { email: string; password: string; remember_me?: boolean }) {
    return this.request<{ access_token: string; token_type: string; user: any }>("/api/v1/auth/login", {
      method: "POST",
      data,
    });
  }

  async logout() {
    return this.request<any>("/api/v1/auth/logout", { method: "POST" });
  }

  async getCurrentUser() {
    return this.request<any>("/api/v1/auth/me", { method: "GET" });
  }

  async verifyEmail(token: string) {
    return this.request<any>(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`, { method: "GET" });
  }

  async forgotPassword(email: string) {
    return this.request<any>("/api/v1/auth/forgot-password", { method: "POST", data: { email } });
  }

  async resetPassword(data: { token: string; new_password: string }) {
    return this.request<any>("/api/v1/auth/reset-password", { method: "POST", data });
  }

  // --- URL APIs ---
  async createUrl(data: {
    original_url: string;
    custom_alias?: string | null;
    redirect_type?: number;
    expires_at?: string | null;
  }) {
    return this.request<any>("/api/v1/urls", { method: "POST", data });
  }

  async createPublicUrl(original_url: string) {
    return this.request<any>("/api/v1/urls/public", { method: "POST", data: { original_url } });
  }

  async listUrls(params: {
    page?: number;
    page_size?: number;
    search?: string;
    sort_by?: string;
    sort_order?: string;
    status?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.page_size) query.append("page_size", params.page_size.toString());
    if (params.search) query.append("search", params.search);
    if (params.sort_by) query.append("sort_by", params.sort_by);
    if (params.sort_order) query.append("sort_order", params.sort_order);
    if (params.status) query.append("status", params.status);

    const queryString = query.toString();
    return this.request<any>(`/api/v1/urls${queryString ? `?${queryString}` : ""}`, { method: "GET" });
  }

  async getUrl(id: number) {
    return this.request<any>(`/api/v1/urls/${id}`, { method: "GET" });
  }

  async updateUrl(id: number, data: { is_active?: boolean; expires_at?: string | null; redirect_type?: number }) {
    return this.request<any>(`/api/v1/urls/${id}`, { method: "PATCH", data });
  }

  async deleteUrl(id: number) {
    return this.request<any>(`/api/v1/urls/${id}`, { method: "DELETE" });
  }

  // --- Analytics APIs ---
  async getOverviewAnalytics() {
    return this.request<any>("/api/v1/analytics/overview", { method: "GET" });
  }

  async getUrlStats(id: number) {
    return this.request<any>(`/api/v1/analytics/${id}/stats`, { method: "GET" });
  }

  // --- Health Check ---
  async getHealth() {
    return this.request<any>("/health", { method: "GET" });
  }
}

export const api = new ApiClient(API_BASE_URL);
