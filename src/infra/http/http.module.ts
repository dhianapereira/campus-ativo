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
import { CreateLocationController } from './controllers/create-location.controller'
import { CreateLocationUseCase } from '@/domain/maintenance-problems/application/use-cases/create-location'
import { FetchLocationsUseCase } from '@/domain/maintenance-problems/application/use-cases/fetch-locations'
import { FetchLocationsController } from './controllers/fetch-locations.controller'
import { EditProblemController } from './controllers/edit-problem.controller'
import { EditProblemUseCase } from '@/domain/maintenance-problems/application/use-cases/edit-problem'
import { DeleteProblemController } from './controllers/delete-problem.controller'
import { DeleteProblemUseCase } from '@/domain/maintenance-problems/application/use-cases/delete-problem'

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
    CreateLocationController,
    FetchLocationsController,
    EditProblemController,
    DeleteProblemController,
  ],
  providers: [
    RegisterReporterUseCase,
    AuthenticateReporterUseCase,
    CreateProblemUseCase,
    FetchProblemsUseCase,
    GetProblemBySlugUseCase,
    FetchCategoriesUseCase,
    CreateCategoryUseCase,
    CreateLocationUseCase,
    FetchLocationsUseCase,
    EditProblemUseCase,
    DeleteProblemUseCase,
  ],
})
export class HttpModule {}
