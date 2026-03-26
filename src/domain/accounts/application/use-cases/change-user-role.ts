import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UsersRepository } from '../repositories/users-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { CannotModifyOwnAccountError } from '@/core/errors/cannot-modify-own-account-error'
import { User, UserRole } from '../../enterprise/entities/user'
import { RoleHierarchy } from '@/core/utils/role-hierarchy'

interface ChangeUserRoleUseCaseRequest {
  targetUserId: string
  newRole: UserRole
  currentUserId: string
  currentUserRole: UserRole
}

type ChangeUserRoleUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError | CannotModifyOwnAccountError,
  {
    user: User
  }
>

@Injectable()
export class ChangeUserRoleUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    targetUserId,
    newRole,
    currentUserId,
    currentUserRole,
  }: ChangeUserRoleUseCaseRequest): Promise<ChangeUserRoleUseCaseResponse> {
    if (
      currentUserRole !== UserRole.DIRECTOR &&
      currentUserRole !== UserRole.ADMIN
    ) {
      return left(new NotAllowedError())
    }

    const user = await this.usersRepository.findById(targetUserId)

    if (!user) {
      return left(new ResourceNotFoundError())
    }

    if (currentUserId === targetUserId) {
      return left(new CannotModifyOwnAccountError())
    }

    if (!RoleHierarchy.canManageRole(currentUserRole, user.role)) {
      return left(new NotAllowedError())
    }

    if (!RoleHierarchy.canManageRole(currentUserRole, newRole)) {
      return left(new NotAllowedError())
    }

    user.changeRole(newRole)

    await this.usersRepository.save(user)

    return right({
      user,
    })
  }
}
