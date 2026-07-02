import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ACCESS_TOKEN_COOKIE } from "@/lib/cookie-names";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "change-me");

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";
  const isAdminSubdomain = host === "admin.iiinbox.com" || host.startsWith("admin.iiinbox.");

  // ── admin.iiinbox.com — password gate ──────────────────────────
  if (isAdminSubdomain) {
    const isGatePath = pathname === "/admin-gate";
    const isGateApi = pathname.startsWith("/api/admin-gate");

    if (isGatePath || isGateApi) {
      return NextResponse.next();
    }

    const granted = req.cookies.get("admin_gate")?.value;
    if (!granted) {
      const gateUrl = new URL("https://admin.iiinbox.com/admin-gate");
      return NextResponse.redirect(gateUrl);
    }

    // Gate passed — redirect root to the admin panel
    if (pathname === "/" || pathname === "") {
      return NextResponse.redirect(new URL("https://admin.iiinbox.com/admin/vendors"));
    }

    return NextResponse.next();
  }

  // ── www role-based protection ───────────────────────────────────
  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  let role: string | undefined;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      role = payload.role as string;
    } catch {
      role = undefined;
    }
  }

  if (pathname.startsWith("/vendor")) {
    if (!role) return NextResponse.redirect(new URL("/login", req.url));
    if (pathname !== "/vendor/apply" && role !== "VENDOR") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!role) return NextResponse.redirect(new URL("/login", req.url));
    if (role !== "ADMIN") return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
