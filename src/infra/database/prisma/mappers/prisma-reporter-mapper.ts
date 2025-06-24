import { User as PrismaUser, Prisma } from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Reporter } from '@/domain/accounts/enterprise/entities/reporter'

export class PrismaReporterMapper {
  static toDomain(raw: PrismaUser): Reporter {
    return Reporter.create(
      {
        name: raw.name,
        position: raw.position,
        email: raw.email,
        password: raw.password,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(reporter: Reporter): Prisma.UserUncheckedCreateInput {
    return {
      id: reporter.id.toValue(),
      name: reporter.name,
      position: reporter.position,
      email: reporter.email,
      password: reporter.password,
    }
  }
}
