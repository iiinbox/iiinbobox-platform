import { createApiClient } from "@iiiiibox/api-client";
import { clearAuthCookies, getAccessToken, getRefreshToken, setAuthCookies } from "./auth-cookies";

const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function getServerApiClient() {
  return createApiClient({
    baseUrl: API_URL,
    tokenStorage: {
      getAccessToken: async () => getAccessToken() ?? null,
      setAccessToken: async (token) => {
        if (token) setAuthCookies(token);
        else clearAuthCookies();
      },
      getRefreshToken: async () => getRefreshToken() ?? null,
      setRefreshToken: async (token) => {
        const accessToken = getAccessToken();
        if (token && accessToken) setAuthCookies(accessToken, token);
      },
    },
  });
}
