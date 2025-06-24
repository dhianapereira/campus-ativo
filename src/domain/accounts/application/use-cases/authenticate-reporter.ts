import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { ReportersRepository } from '../repositories/reporters-repository'
import { HashComparer } from '../cryptography/hash-comparer'
import { Encrypter } from '../cryptography/encrypter'
import { WrongCredentialsError } from './errors/wrong-credentials-error'

interface AuthenticateReporterUseCaseRequest {
  email: string
  password: string
}

type AuthenticateReporterUseCaseResponse = Either<
  WrongCredentialsError,
  {
    accessToken: string
  }
>

@Injectable()
export class AuthenticateReporterUseCase {
  constructor(
    private reportersRepository: ReportersRepository,
    private hashComparer: HashComparer,
    private encrypter: Encrypter,
  ) {}

  async execute({
    email,
    password,
  }: AuthenticateReporterUseCaseRequest): Promise<AuthenticateReporterUseCaseResponse> {
    const reporter = await this.reportersRepository.findByEmail(email)

    if (!reporter) {
      return left(new WrongCredentialsError())
    }

    const isPasswordValid = await this.hashComparer.compare(
      password,
      reporter.password,
    )

    if (!isPasswordValid) {
      return left(new WrongCredentialsError())
    }

    const accessToken = await this.encrypter.encrypt({
      sub: reporter.id.toValue(),
    })

    return right({
      accessToken,
    })
  }
}
