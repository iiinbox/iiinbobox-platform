import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "./cookie-names";
import type { UserRole } from "@iiiiibox/shared-types";

export interface SessionUser {
  userId: string;
  email: string;
  role: UserRole;
  vendorId?: string;
}

export function getSession(): SessionUser | null {
  const token = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1]!, "base64").toString());
    return payload as SessionUser;
  } catch {
    return null;
  }
}
