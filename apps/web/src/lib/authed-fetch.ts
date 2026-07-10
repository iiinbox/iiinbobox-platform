import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./cookie-names";

const API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";
const isProd = process.env.NODE_ENV === "production";

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.accessToken ?? null;
  } catch {
    return null;
  }
}

// Authenticated proxy fetch to the NestJS API. The access token is short-lived
// (15 minutes — see apps/api/src/modules/auth/auth.service.ts) and
// middleware.ts only silently refreshes it on full page navigations, not on
// the fetch() calls a long-running admin session makes from client JS. Any
// write (save/publish) started after the token expires would otherwise get a
// 401 that nothing surfaces — the exact "shows Saved but nothing persisted"
// bug. This refreshes once and retries before giving up, and writes the new
// access token back so later requests in the same session don't need to.
export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const jar = await cookies();
  const accessToken = jar.get(ACCESS_TOKEN_COOKIE)?.value;
  const withAuth = (token: string | undefined): RequestInit => ({
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token ?? ""}` },
  });

  let res = await fetch(`${API}${path}`, withAuth(accessToken));
  if (res.status === 401) {
    const refreshToken = jar.get(REFRESH_TOKEN_COOKIE)?.value;
    if (refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);
      if (newAccessToken) {
        jar.set(ACCESS_TOKEN_COOKIE, newAccessToken, {
          httpOnly: true, sameSite: "lax", secure: isProd, path: "/", maxAge: 60 * 15,
        });
        res = await fetch(`${API}${path}`, withAuth(newAccessToken));
      }
    }
  }
  return res;
}
