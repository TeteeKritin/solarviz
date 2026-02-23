const BASE_URL = "/api/v1";

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem("access_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: this.getHeaders(),
    });
    if (res.status === 401) {
      await this.tryRefresh();
      return this.get(path);
    }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  private async tryRefresh() {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      window.location.href = "/login";
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh?token=${refreshToken}`, {
        method: "POST",
      });
      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
    } catch {
      localStorage.clear();
      window.location.href = "/login";
    }
  }
}

export const api = new ApiClient();