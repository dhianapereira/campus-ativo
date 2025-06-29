import { faker } from '@faker-js/faker'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Reporter,
  ReporterProps,
} from '@/domain/accounts/enterprise/entities/reporter'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaReporterMapper } from '@/infra/database/prisma/mappers/prisma-reporter-mapper'

export function makeReporter(
  override: Partial<ReporterProps> = {},
  id?: UniqueEntityID,
) {
  const reporter = Reporter.create(
    {
      name: faker.person.fullName(),
      position: faker.person.jobTitle(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      ...override,
    },
    id,
  )

  return reporter
}

@Injectable()
export class ReporterFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaReporter(
    data: Partial<ReporterProps> = {},
  ): Promise<Reporter> {
    const reporter = makeReporter(data)

    await this.prisma.user.create({
      data: PrismaReporterMapper.toPrisma(reporter),
    })

    return reporter
  }
}
