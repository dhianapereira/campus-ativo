import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { PrismaProblemsRepository } from './prisma/repositories/prisma-problems-repository'
import { PrismaProblemAttachmentsRepository } from './prisma/repositories/prisma-problem-attachments-repository'
import { ProblemsRepository } from '@/domain/maintenance-problems/application/repositories/problems-repository'
import { ReportersRepository } from '@/domain/accounts/application/repositories/reporters-repository'
import { PrismaReportersRepository } from './prisma/repositories/prisma-reporters-repository'
import { CategoriesRepository } from '@/domain/maintenance-problems/application/repositories/categories-repository'
import { PrismaCategoriesRepository } from './prisma/repositories/prisma-categories-repository'
import { LocationsRepository } from '@/domain/maintenance-problems/application/repositories/locations-repository'
import { PrismaLocationsRepository } from './prisma/repositories/prisma-locations-repository'
import { ProblemAttachmentsRepository } from '@/domain/maintenance-problems/application/repositories/problem-attachments-repository'
import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository'
import { PrismaUsersRepository } from './prisma/repositories/prisma-users-repository'

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
      provide: UsersRepository,
      useClass: PrismaUsersRepository,
    },
  ],
  exports: [
    PrismaService,
    ProblemsRepository,
    ReportersRepository,
    CategoriesRepository,
    LocationsRepository,
    ProblemAttachmentsRepository,
    UsersRepository,
  ],
})
export class DatabaseModule {}
