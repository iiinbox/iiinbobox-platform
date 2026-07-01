import type { AuthUser, LoginInput, RegisterInput } from "@iiiiibox/shared-types";
import type { ApiClient } from "../client";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export function createAuthModule(client: ApiClient) {
  return {
    register: (input: RegisterInput) => client.post<AuthTokens>("/auth/register", input),
    login: (input: LoginInput) => client.post<AuthTokens>("/auth/login", input),
    refresh: (refreshToken: string) => client.post<AuthTokens>("/auth/refresh", { refreshToken }),
    me: () => client.get<AuthUser>("/auth/me"),
  };
}
