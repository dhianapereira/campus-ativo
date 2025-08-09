import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UsersRepository } from '../repositories/users-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { User, UserRole } from '../../enterprise/entities/user'
import { RoleHierarchy } from '@/core/utils/role-hierarchy'

interface ChangeUserRoleUseCaseRequest {
  targetUserId: string
  newRole: UserRole
  currentUserRole: UserRole
}

type ChangeUserRoleUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
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
    currentUserRole,
  }: ChangeUserRoleUseCaseRequest): Promise<ChangeUserRoleUseCaseResponse> {
    // Only DIRECTOR and ADMIN can change roles
    if (currentUserRole !== UserRole.DIRECTOR && currentUserRole !== UserRole.ADMIN) {
      return left(new NotAllowedError())
    }

    const user = await this.usersRepository.findById(targetUserId)

    if (!user) {
      return left(new ResourceNotFoundError())
    }

    // Check if the current user can manage the target user's current role
    if (!RoleHierarchy.canManageRole(currentUserRole, user.role)) {
      return left(new NotAllowedError())
    }

    // Check if the current user can assign the new role
    if (!RoleHierarchy.canManageRole(currentUserRole, newRole)) {
      return left(new NotAllowedError())
    }

    // Create a new user instance with the updated role
    const updatedUser = User.create(
      {
        name: user.name,
        position: user.position,
        email: user.email,
        password: user.password,
        role: newRole,
        isActive: user.isActive,
      },
      user.id,
    )

    await this.usersRepository.save(updatedUser)

    return right({
      user: updatedUser,
    })
  }
}