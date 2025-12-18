import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UsersRepository } from '../repositories/users-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ProblemsRepository } from '@/domain/maintenance-problems/application/repositories/problems-repository'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

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
  constructor(
    private usersRepository: UsersRepository,
    private problemsRepository: ProblemsRepository,
  ) {}

  async execute({
    userId,
    executorId,
  }: DeleteUserAccountUseCaseRequest): Promise<DeleteUserAccountUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      return left(new ResourceNotFoundError())
    }

    // Only the user can delete their own account, unless it's an admin
    if (executorId !== userId && user.role !== UserRole.ADMIN) {
      return left(new NotAllowedError())
    }

    // System user cannot be deleted (identified by email)
    if (user.email === 'sistema@ifal-arapiraca.edu.br') {
      return left(new NotAllowedError())
    }

    // Find system user to migrate problems to
    const systemUser = await this.usersRepository.findByEmail('sistema@ifal-arapiraca.edu.br')

    if (!systemUser) {
      return left(new ResourceNotFoundError())
    }

    // Migrate all user's problems to the system user
    await this.problemsRepository.migrateUserProblems(userId, systemUser.id.toValue())

    await this.usersRepository.delete(user)

    return right({})
  }
}
