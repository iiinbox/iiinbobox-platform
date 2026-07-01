import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ACCESS_TOKEN_COOKIE } from "@/lib/cookie-names";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "change-me");

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
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
    // /vendor/apply is reachable by any authenticated user (that's how a
    // CUSTOMER becomes a VENDOR); other /vendor/* routes require the role already.
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
  matcher: ["/vendor/:path*", "/admin/:path*"],
};
