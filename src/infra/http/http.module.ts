import { Module } from '@nestjs/common'
import { CreateAccountController } from './controllers/create-account.controller'
import { AuthenticateController } from './controllers/authenticate.controller'
import { CreateProblemController } from './controllers/create-problem.controller'
import { FetchProblemsController } from './controllers/fetch-problems.controller'
import { DatabaseModule } from '../database/database.module'
import { CreateProblemUseCase } from '@/domain/maintenance-problems/application/use-cases/create-problem'
import { FetchProblemsUseCase } from '@/domain/maintenance-problems/application/use-cases/fetch-problems'
import { RegisterReporterUseCase } from '@/domain/accounts/application/use-cases/register-reporter'
import { AuthenticateReporterUseCase } from '@/domain/accounts/application/use-cases/authenticate-reporter'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { GetProblemBySlugUseCase } from '@/domain/maintenance-problems/application/use-cases/get-problem-by-slug'
import { GetProblemBySlugController } from './controllers/get-problem-by-slug.controller'
import { FetchCategoriesController } from './controllers/fetch-categories.controller'
import { FetchCategoriesUseCase } from '@/domain/maintenance-problems/application/use-cases/fetch-categories'
import { CreateCategoryController } from './controllers/create-category.controller'
import { CreateCategoryUseCase } from '@/domain/maintenance-problems/application/use-cases/create-category'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    CreateProblemController,
    FetchProblemsController,
    GetProblemBySlugController,
    FetchCategoriesController,
    CreateCategoryController,
  ],
  providers: [
    RegisterReporterUseCase,
    AuthenticateReporterUseCase,
    CreateProblemUseCase,
    FetchProblemsUseCase,
    GetProblemBySlugUseCase,
    FetchCategoriesUseCase,
    CreateCategoryUseCase,
  ],
})
export class HttpModule {}
