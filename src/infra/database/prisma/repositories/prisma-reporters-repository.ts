import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { ReportersRepository } from '@/domain/accounts/application/repositories/reporters-repository'
import { Reporter } from '@/domain/accounts/enterprise/entities/reporter'
import { PrismaReporterMapper } from '../mappers/prisma-reporter-mapper'

@Injectable()
export class PrismaReportersRepository implements ReportersRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<Reporter | null> {
    const reporter = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (!reporter) {
      return null
    }

    return PrismaReporterMapper.toDomain(reporter)
  }

  async create(reporter: Reporter): Promise<void> {
    const data = PrismaReporterMapper.toPrisma(reporter)

    await this.prisma.user.create({
      data,
    })
  }
}
