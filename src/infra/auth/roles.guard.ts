import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { ROLES_KEY } from './roles.decorator'
import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersRepository: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles) {
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

    const hasRole = requiredRoles.some((role) => userEntity.role === role)

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions')
    }

    return true
  }
}