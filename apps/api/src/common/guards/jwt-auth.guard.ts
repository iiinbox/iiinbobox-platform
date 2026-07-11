import { Injectable, type ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@iiiiibox/shared-types";
import { ROLES_KEY } from "../decorators/roles.decorator";

// Admin panel password protection was removed at the user's explicit request
// (2026-07-11) — any route gated to ADMIN-only (@Roles(UserRole.ADMIN), no
// other role) is now reachable with no login at all. Non-admin-only routes
// (customer/vendor account endpoints, or routes open to multiple roles)
// still require a real JWT exactly as before — this bypass only fires when
// real auth fails AND the route's sole required role is ADMIN.
const PUBLIC_ADMIN_USER = {
  userId: "cmr1sfxz800003he5qt1jcwgq",
  email: "admin@iiinbox.com",
  role: UserRole.ADMIN,
};

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const ok = await super.canActivate(context);
      if (ok) return true;
    } catch {
      // fall through to admin-only bypass check below
    }
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles?.length === 1 && requiredRoles[0] === UserRole.ADMIN) {
      context.switchToHttp().getRequest().user = PUBLIC_ADMIN_USER;
      return true;
    }
    return false;
  }
}
