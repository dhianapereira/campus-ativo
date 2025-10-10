import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UsersRepository } from '../repositories/users-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { User } from '../../enterprise/entities/user'
import { HashComparer } from '../cryptography/hash-comparer'
import { HashGenerator } from '../cryptography/hash-generator'
import { WrongCredentialsError } from './errors/wrong-credentials-error'
import { InvalidPasswordError } from './errors/invalid-password-error'
import { PasswordValidator } from '@/core/utils/password-validator'

interface ChangeUserPasswordUseCaseRequest {
  userId: string
  executorId: string
  oldPassword: string
  newPassword: string
}

type ChangeUserPasswordUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError | WrongCredentialsError | InvalidPasswordError,
  {
    user: User
  }
>

@Injectable()
export class ChangeUserPasswordUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashComparer: HashComparer,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    userId,
    executorId,
    oldPassword,
    newPassword,
  }: ChangeUserPasswordUseCaseRequest): Promise<ChangeUserPasswordUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      return left(new ResourceNotFoundError())
    }

    // Only the user can change their own password
    if (executorId !== userId) {
      return left(new NotAllowedError())
    }

    // Validate old password
    const isOldPasswordValid = await this.hashComparer.compare(
      oldPassword,
      user.password,
    )

    if (!isOldPasswordValid) {
      return left(new WrongCredentialsError())
    }

    // Validate new password strength
    if (!PasswordValidator.isValid(newPassword)) {
      return left(new InvalidPasswordError())
    }

    // Hash new password
    const hashedPassword = await this.hashGenerator.hash(newPassword)

    user.changePassword(hashedPassword)

    await this.usersRepository.save(user)

    return right({
      user,
    })
  }
}
