import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { PrismaProblemsRepository } from './prisma/repositories/prisma-problems-repository'
import { PrismaProblemAttachmentsRepository } from './prisma/repositories/prisma-problem-attachments-repository'
import { ProblemsRepository } from '@/domain/maintenance-problems/application/repositories/problems-repository'

@Module({
  providers: [
    PrismaService,
    {
      provide: ProblemsRepository,
      useClass: PrismaProblemsRepository,
    },
    PrismaProblemAttachmentsRepository,
  ],
  exports: [
    PrismaService,
    ProblemsRepository,
    PrismaProblemAttachmentsRepository,
  ],
})
export class DatabaseModule {}
