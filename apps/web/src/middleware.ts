import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/cookie-names";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "change-me");
const API_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000";
const isProd = process.env.NODE_ENV === "production";

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
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

const IIINBOX_APEX = "iiinbox.com";

// Any subdomain label besides "admin" (handled separately below) or "www"
// is a candidate for folder-subdomain routing — e.g. "seller" from
// "seller.iiinbox.com". Strips the port (host headers can include one in
// dev/local testing) before matching.
function extractSubdomainLabel(host: string): string | null {
  const h = host.split(":")[0];
  if (h === IIINBOX_APEX || h === `www.${IIINBOX_APEX}` || !h.endsWith(`.${IIINBOX_APEX}`)) return null;
  const label = h.slice(0, -(`.${IIINBOX_APEX}`.length));
  return label && label !== "admin" ? label : null;
}

// Resolves a subdomain label to a root-page slug via the folder's `subdomain`
// field (see page-config.service.ts's getFolderBySubdomain) — Folders are
// arbitrary now, not fixed to seller/rider, so this covers any subdomain an
// admin assigns to a folder, not just the two that exist today. A short
// timeout + any-failure-returns-null keeps a slow/unreachable API from ever
// hanging a request; the caller falls back to the hardcoded seller/rider
// mapping in that case, so those two real subdomains can never go dark just
// because this lookup had a bad moment.
async function resolveSubdomainRoot(label: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${API_URL}/page-config/subdomain/${encodeURIComponent(label)}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.slug === "string" ? data.slug : null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";
  const isAdminSubdomain = host === "admin.iiinbox.com" || host.startsWith("admin.iiinbox.");

  // Folder-subdomain routing — pinned pages (same public, no-login treatment
  // as Home Page) served at the root of their own subdomains. Rewritten (not
  // redirected) so the URL bar stays on the subdomain; only "/" is
  // rewritten, any other path on these hosts falls through to the normal
  // [slug] route. Resolved dynamically against Folder.subdomain first (any
  // folder can claim a subdomain now — see the schema comment on Folder),
  // with the original hardcoded seller/rider mapping as a safety-net
  // fallback so those two real subdomains keep working even if the dynamic
  // lookup is ever unavailable.
  const subdomainLabel = !isAdminSubdomain ? extractSubdomainLabel(host) : null;
  if (subdomainLabel && pathname === "/") {
    const hardcodedFallback = subdomainLabel === "seller" ? "seller-dashboard" : subdomainLabel === "rider" ? "rider-dashboard" : null;
    const slug = (await resolveSubdomainRoot(subdomainLabel)) ?? hardcodedFallback;
    if (slug) return NextResponse.rewrite(new URL(`/${slug}`, req.url));
  }

  // www and other hosts are fully public — no auth needed
  if (!isAdminSubdomain) return NextResponse.next();

  // Admin gate and its API are always public on the admin subdomain
  if (pathname === "/admin-gate" || pathname.startsWith("/api/admin-gate")) {
    return NextResponse.next();
  }

  // Logout endpoint clears cookies — let it through to the handler
  if (pathname === "/api/logout") return NextResponse.next();

  const granted = req.cookies.get("admin_gate")?.value;
  if (!granted) {
    return NextResponse.redirect(new URL("https://admin.iiinbox.com/admin-gate"));
  }

  // API routes: admin_gate cookie is sufficient — NestJS validates JWT on writes
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // Admin page routes: also validate the JWT (refresh silently if expired)
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  let tokenValid = false;
  if (accessToken) {
    try { await jwtVerify(accessToken, JWT_SECRET); tokenValid = true; } catch {}
  }

  if (!tokenValid) {
    const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    if (refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);
      if (newAccessToken) {
        const res = pathname === "/"
          ? NextResponse.redirect(new URL("https://admin.iiinbox.com/admin/homepage"))
          : NextResponse.next();
        res.cookies.set(ACCESS_TOKEN_COOKIE, newAccessToken, {
          httpOnly: true, sameSite: "lax", secure: isProd, maxAge: 60 * 15, path: "/",
        });
        return res;
      }
    }
    // Refresh failed — kick back to gate and clear the gate cookie
    const res = NextResponse.redirect(new URL("https://admin.iiinbox.com/admin-gate"));
    res.cookies.delete("admin_gate");
    return res;
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("https://admin.iiinbox.com/admin/homepage"));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
