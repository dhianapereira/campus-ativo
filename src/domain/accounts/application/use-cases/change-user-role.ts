import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Injectable } from '@nestjs/common'

import { User, UserRole } from '../../enterprise/entities/user'
import { UsersRepository } from '../repositories/users-repository'
import { UnauthorizedRoleChangeError } from './errors/unauthorized-role-change-error'

interface ChangeUserRoleUseCaseRequest {
  currentUserId: string
  targetUserId: string
  newRole: UserRole
}

type ChangeUserRoleUseCaseResponse = Either<
  ResourceNotFoundError | UnauthorizedRoleChangeError,
  {
    user: User
  }
>

@Injectable()
export class ChangeUserRoleUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    currentUserId,
    targetUserId,
    newRole,
  }: ChangeUserRoleUseCaseRequest): Promise<ChangeUserRoleUseCaseResponse> {
    const currentUser = await this.usersRepository.findById(currentUserId)

    if (!currentUser) {
      return left(new ResourceNotFoundError())
    }

    const targetUser = await this.usersRepository.findById(targetUserId)

    if (!targetUser) {
      return left(new ResourceNotFoundError())
    }

    if (!currentUser.canChangeRoleOf(targetUser)) {
      return left(new UnauthorizedRoleChangeError())
    }

    targetUser.role = newRole

    await this.usersRepository.save(targetUser)

    return right({
      user: targetUser,
    })
  }
}
