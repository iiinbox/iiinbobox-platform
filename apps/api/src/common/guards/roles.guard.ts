import { Injectable, CanActivate, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@iiiiibox/shared-types";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { RequestUser } from "../types/request-user";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const user: RequestUser | undefined = context.switchToHttp().getRequest().user;
    return !!user && requiredRoles.includes(user.role);
  }
}
