import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Reporter } from '../../enterprise/entities/reporter'
import { ReportersRepository } from '../repositories/reporters-repository'
import { HashGenerator } from '../cryptography/hash-generator'
import { ReporterAlreadyExistsError } from './errors/reporter-already-exists-error'

interface RegisterReporterUseCaseRequest {
  name: string
  email: string
  password: string
}

type RegisterReporterUseCaseResponse = Either<
  ReporterAlreadyExistsError,
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
    email,
    password,
  }: RegisterReporterUseCaseRequest): Promise<RegisterReporterUseCaseResponse> {
    const reporterWithSameEmail =
      await this.reportersRepository.findByEmail(email)

    if (reporterWithSameEmail) {
      return left(new ReporterAlreadyExistsError(email))
    }

    const hashedPassword = await this.hashGenerator.hash(password)

    const reporter = Reporter.create({
      name,
      email,
      password: hashedPassword,
    })

    await this.reportersRepository.create(reporter)

    return right({
      reporter,
    })
  }
}
