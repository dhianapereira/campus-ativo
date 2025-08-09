import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Reporter } from '../../enterprise/entities/reporter'
import { ReportersRepository } from '../repositories/reporters-repository'
import { HashGenerator } from '../cryptography/hash-generator'
import { ReporterAlreadyExistsError } from './errors/reporter-already-exists-error'
import { InvalidEmailDomainError } from './errors/invalid-email-domain-error'
import { EmailValidator } from '@/core/utils/email-validator'

interface RegisterReporterUseCaseRequest {
  name: string
  position: string
  email: string
  password: string
}

type RegisterReporterUseCaseResponse = Either<
  ReporterAlreadyExistsError | InvalidEmailDomainError,
  {
    reporter: Reporter
  }
>

@Injectable()
export class RegisterReporterUseCase {
  constructor(
    private reportersRepository: ReportersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    name,
    position,
    email,
    password,
  }: RegisterReporterUseCaseRequest): Promise<RegisterReporterUseCaseResponse> {
    if (!EmailValidator.isValidDomain(email)) {
      return left(new InvalidEmailDomainError(email))
    }

    const reporterWithSameEmail =
      await this.reportersRepository.findByEmail(email)

    if (reporterWithSameEmail) {
      return left(new ReporterAlreadyExistsError(email))
    }

    const hashedPassword = await this.hashGenerator.hash(password)

    const reporter = Reporter.create({
      name,
      position,
      email,
      password: hashedPassword,
    })

    await this.reportersRepository.create(reporter)

    return right({
      reporter,
    })
  }
}
