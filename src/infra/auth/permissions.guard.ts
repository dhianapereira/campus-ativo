import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@/domain/accounts/enterprise/entities/user";
import { RoleHierarchy } from "@/core/utils/role-hierarchy";
import { UserPayload } from "./jwt.strategy";

export const REQUIRED_PERMISSION = "required_permission";
export const RequirePermission = (role: UserRole) =>
  Reflect.metadata(REQUIRED_PERMISSION, role);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<UserRole>(
      REQUIRED_PERMISSION,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true;
    }

    const { user }: { user: UserPayload } = context.switchToHttp().getRequest();
    const userRole = (user.role as UserRole) || UserRole.REPORTER;

    return RoleHierarchy.hasPermission(userRole, requiredPermission);
  }
}
