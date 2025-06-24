import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { PrismaProblemsRepository } from './prisma/repositories/prisma-problems-repository'
import { PrismaProblemAttachmentsRepository } from './prisma/repositories/prisma-problem-attachments-repository'
import { ProblemsRepository } from '@/domain/maintenance-problems/application/repositories/problems-repository'
import { ReportersRepository } from '@/domain/accounts/application/repositories/reporters-repository'
import { PrismaReportersRepository } from './prisma/repositories/prisma-reporters-repository'

@Module({
  providers: [
    PrismaService,
    {
      provide: ProblemsRepository,
      useClass: PrismaProblemsRepository,
    },
    {
      provide: ReportersRepository,
      useClass: PrismaReportersRepository,
    },
    PrismaProblemAttachmentsRepository,
  ],
  exports: [
    PrismaService,
    ProblemsRepository,
    ReportersRepository,
    PrismaProblemAttachmentsRepository,
  ],
})
export class DatabaseModule {}
