import * as SecureStore from "expo-secure-store";
import type { TokenStorage } from "@iiiiibox/api-client";

const ACCESS_TOKEN_KEY = "iiiiibox_access_token";
const REFRESH_TOKEN_KEY = "iiiiibox_refresh_token";

export const secureTokenStorage: TokenStorage = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  setAccessToken: (token) =>
    token
      ? SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token)
      : SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setRefreshToken: (token) =>
    token
      ? SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token)
      : SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
};
