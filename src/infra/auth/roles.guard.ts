import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { RoleHierarchy } from '@/core/utils/role-hierarchy'
import { ROLES_KEY } from './roles.decorator'
import { UserPayload } from './jwt.strategy'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!requiredRoles) {
      return true
    }

    const { user }: { user: UserPayload } = context.switchToHttp().getRequest()
    const userRole = user.role || UserRole.REPORTER

    return requiredRoles.some((role) => 
      RoleHierarchy.hasPermission(userRole, role)
    )
  }
}