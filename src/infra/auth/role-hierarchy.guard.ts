import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { MIN_ROLE_KEY } from './role-hierarchy.decorator'
import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository'

@Injectable()
export class RoleHierarchyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersRepository: UsersRepository,
  ) {}

  private getRoleHierarchy(role: UserRole): number {
    const hierarchy = {
      [UserRole.REPORTER]: 1,
      [UserRole.MANAGER]: 2,
      [UserRole.DIRECTOR]: 3,
      [UserRole.ADMIN]: 4,
    }
    return hierarchy[role] || 0
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const minRole = this.reflector.getAllAndOverride<UserRole>(MIN_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!minRole) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user) {
      throw new ForbiddenException('User not found')
    }

    const userEntity = await this.usersRepository.findById(user.sub)

    if (!userEntity) {
      throw new ForbiddenException('User not found')
    }

    const userRoleLevel = this.getRoleHierarchy(userEntity.role)
    const requiredRoleLevel = this.getRoleHierarchy(minRole)

    if (userRoleLevel < requiredRoleLevel) {
      throw new ForbiddenException('Insufficient permissions')
    }

    return true
  }
}