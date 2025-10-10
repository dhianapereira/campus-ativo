import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UsersRepository } from '../repositories/users-repository'
import { HashGenerator } from '../cryptography/hash-generator'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'
import { InvalidEmailDomainError } from './errors/invalid-email-domain-error'
import { InvalidPasswordError } from './errors/invalid-password-error'
import { User, UserRole } from '../../enterprise/entities/user'
import { EmailValidator } from '@/core/utils/email-validator'
import { PasswordValidator } from '@/core/utils/password-validator'

interface RegisterUserUseCaseRequest {
  name: string
  position: string
  email: string
  password: string
  role?: UserRole
}

type RegisterUserUseCaseResponse = Either<
  UserAlreadyExistsError | InvalidEmailDomainError | InvalidPasswordError,
  {
    user: User
  }
>

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    name,
    position,
    email,
    password,
    role = UserRole.REPORTER,
  }: RegisterUserUseCaseRequest): Promise<RegisterUserUseCaseResponse> {
    if (!EmailValidator.isValidDomain(email)) {
      return left(new InvalidEmailDomainError(email))
    }

    if (!PasswordValidator.isValid(password)) {
      return left(new InvalidPasswordError())
    }

    const userWithSameEmail = await this.usersRepository.findByEmail(email)

    if (userWithSameEmail) {
      return left(new UserAlreadyExistsError())
    }

    const hashedPassword = await this.hashGenerator.hash(password)

    const user = User.create({
      name,
      position,
      email,
      password: hashedPassword,
      role,
      isActive: true,
    })

    await this.usersRepository.create(user)

    return right({
      user,
    })
  }
}