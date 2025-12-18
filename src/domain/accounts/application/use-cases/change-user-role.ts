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
    // Only DIRECTOR and ADMIN can change roles
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

    // User cannot change their own role
    if (currentUserId === targetUserId) {
      return left(new CannotModifyOwnAccountError())
    }

    // Check if the current user can manage the target user's current role
    if (!RoleHierarchy.canManageRole(currentUserRole, user.role)) {
      return left(new NotAllowedError())
    }

    // Check if the current user can assign the new role
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
