import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RESOURCE_OWNER_KEY } from './resource-owner.decorator'
import { ProblemsRepository } from '@/domain/maintenance-problems/application/repositories/problems-repository'
import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private problemsRepository: ProblemsRepository,
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
    const resourceType = this.reflector.getAllAndOverride<string>(RESOURCE_OWNER_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!resourceType) {
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

    // Se o usuário é Manager ou superior, pode modificar qualquer recurso
    if (this.getRoleHierarchy(userEntity.role) >= this.getRoleHierarchy(UserRole.MANAGER)) {
      return true
    }

    // Para Reporter, só pode modificar seus próprios recursos
    if (resourceType === 'problem') {
      const problemId = request.params.id
      const problem = await this.problemsRepository.findById(problemId)

      if (!problem) {
        throw new ForbiddenException('Problem not found')
      }

      if (problem.reporterId.toString() !== user.sub) {
        throw new ForbiddenException('You can only modify your own problems')
      }
    }

    return true
  }
}