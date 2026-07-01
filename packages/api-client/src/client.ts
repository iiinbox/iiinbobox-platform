import type { TokenStorage } from "./token-storage";

export interface ApiClientOptions {
  baseUrl: string;
  tokenStorage: TokenStorage;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async request<T>(
    path: string,
    init: RequestInit = {},
    options: { jsonContentType?: boolean } = {},
  ): Promise<T> {
    const { jsonContentType = true } = options;
    const accessToken = await this.options.tokenStorage.getAccessToken();
    const res = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers: {
        ...(jsonContentType ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new ApiError(res.status, body || res.statusText);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return res.json() as Promise<T>;
  }

  get<T>(path: string) {
    return this.request<T>(path, { method: "GET" });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }

  postForm<T>(path: string, formData: FormData) {
    return this.request<T>(path, { method: "POST", body: formData }, { jsonContentType: false });
  }
}
