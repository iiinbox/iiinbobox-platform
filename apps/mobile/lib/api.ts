import { createApiClient } from "@iiiiibox/api-client";
import { secureTokenStorage } from "./token-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

export const api = createApiClient({ baseUrl: API_URL, tokenStorage: secureTokenStorage });
