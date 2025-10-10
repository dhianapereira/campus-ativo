import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UsersRepository } from '../repositories/users-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { User, UserRole } from '../../enterprise/entities/user'
import { RoleHierarchy } from '@/core/utils/role-hierarchy'

interface ChangeUserStatusUseCaseRequest {
  userId: string
  isActive: boolean
  executorRole: UserRole
}

type ChangeUserStatusUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    user: User
  }
>

@Injectable()
export class ChangeUserStatusUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
    isActive,
    executorRole,
  }: ChangeUserStatusUseCaseRequest): Promise<ChangeUserStatusUseCaseResponse> {
    // Only DIRECTOR+ can change user status
    if (!RoleHierarchy.hasPermission(executorRole, UserRole.DIRECTOR)) {
      return left(new NotAllowedError())
    }

    const user = await this.usersRepository.findById(userId)

    if (!user) {
      return left(new ResourceNotFoundError())
    }

    user.changeStatus(isActive)

    await this.usersRepository.save(user)

    return right({
      user,
    })
  }
}
