import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UsersRepository } from '../repositories/users-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'

interface DeleteUserAccountUseCaseRequest {
  userId: string
  executorId: string
}

type DeleteUserAccountUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  object
>

@Injectable()
export class DeleteUserAccountUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
    executorId,
  }: DeleteUserAccountUseCaseRequest): Promise<DeleteUserAccountUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      return left(new ResourceNotFoundError())
    }

    // Only the user can delete their own account
    if (executorId !== userId) {
      return left(new NotAllowedError())
    }

    await this.usersRepository.delete(user)

    return right({})
  }
}
