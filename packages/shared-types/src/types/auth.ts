import type { UserRole } from "../enums";

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  vendorId?: string;
}
