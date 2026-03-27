import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UsersRepository } from '../repositories/users-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { User } from '../../enterprise/entities/user'
import { RoleHierarchy } from '@/core/utils/role-hierarchy'

interface EditUserProfileUseCaseRequest {
  userId: string
  executorId: string
  name: string
  position: string
}

type EditUserProfileUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    user: User
  }
>

@Injectable()
export class EditUserProfileUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
    executorId,
    name,
    position,
  }: EditUserProfileUseCaseRequest): Promise<EditUserProfileUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      return left(new ResourceNotFoundError())
    }

    if (executorId !== userId) {
      return left(new NotAllowedError())
    }

    if (RoleHierarchy.isSystemRole(user.role)) {
      return left(new NotAllowedError())
    }

    user.updateProfile(name, position)

    await this.usersRepository.save(user)

    return right({
      user,
    })
  }
}
