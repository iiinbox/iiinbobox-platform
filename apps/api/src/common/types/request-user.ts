import type { UserRole } from "@iiiiibox/shared-types";

export interface RequestUser {
  userId: string;
  email: string;
  role: UserRole;
  vendorId?: string;
}
