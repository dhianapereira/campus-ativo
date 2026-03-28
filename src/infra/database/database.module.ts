import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { PrismaProblemsRepository } from './prisma/repositories/prisma-problems-repository'
import { PrismaProblemAttachmentsRepository } from './prisma/repositories/prisma-problem-attachments-repository'
import { ProblemsRepository } from '@/domain/maintenance-problems/application/repositories/problems-repository'
import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository'
import { PrismaUsersRepository } from './prisma/repositories/prisma-users-repository'
import { CategoriesRepository } from '@/domain/maintenance-problems/application/repositories/categories-repository'
import { PrismaCategoriesRepository } from './prisma/repositories/prisma-categories-repository'
import { LocationsRepository } from '@/domain/maintenance-problems/application/repositories/locations-repository'
import { PrismaLocationsRepository } from './prisma/repositories/prisma-locations-repository'
import { ProblemAttachmentsRepository } from '@/domain/maintenance-problems/application/repositories/problem-attachments-repository'
import { ProblemHistoryRepository } from '@/domain/maintenance-problems/application/repositories/problem-history-repository'
import { PrismaProblemHistoryRepository } from './prisma/repositories/prisma-problem-history-repository'
import { AttachmentsRepository } from '@/domain/maintenance-problems/application/repositories/attachments-repository'
import { PrismaAttachmentsRepository } from './prisma/repositories/prisma-attachments-repository'

@Module({
  providers: [
    PrismaService,
    {
      provide: ProblemsRepository,
      useClass: PrismaProblemsRepository,
    },
    {
      provide: UsersRepository,
      useClass: PrismaUsersRepository,
    },
    {
      provide: CategoriesRepository,
      useClass: PrismaCategoriesRepository,
    },
    {
      provide: LocationsRepository,
      useClass: PrismaLocationsRepository,
    },
    {
      provide: ProblemAttachmentsRepository,
      useClass: PrismaProblemAttachmentsRepository,
    },
    {
      provide: ProblemHistoryRepository,
      useClass: PrismaProblemHistoryRepository,
    },
    {
      provide: AttachmentsRepository,
      useClass: PrismaAttachmentsRepository,
    },
  ],
  exports: [
    PrismaService,
    ProblemsRepository,
    UsersRepository,
    CategoriesRepository,
    LocationsRepository,
    ProblemAttachmentsRepository,
    ProblemHistoryRepository,
    AttachmentsRepository,
  ],
})
export class DatabaseModule {}
