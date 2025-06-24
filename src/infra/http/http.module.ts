import { Module } from '@nestjs/common'
import { CreateAccountController } from './controllers/create-account.controller'
import { AuthenticateController } from './controllers/authenticate.controller'
import { CreateProblemController } from './controllers/create-problem.controller'
import { FetchProblemsController } from './controllers/fetch-problems.controller'
import { DatabaseModule } from '../database/database.module'
import { CreateProblemUseCase } from '@/domain/maintenance-problems/application/use-cases/create-problem'
import { FetchRecentProblemsUseCase } from '@/domain/maintenance-problems/application/use-cases/fetch-problems'
import { RegisterReporterUseCase } from '@/domain/accounts/application/use-cases/register-reporter'
import { AuthenticateReporterUseCase } from '@/domain/accounts/application/use-cases/authenticate-reporter'
import { CryptographyModule } from '../cryptography/cryptography.module'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    CreateProblemController,
    FetchProblemsController,
  ],
  providers: [
    RegisterReporterUseCase,
    AuthenticateReporterUseCase,
    CreateProblemUseCase,
    FetchRecentProblemsUseCase,
  ],
})
export class HttpModule {}
