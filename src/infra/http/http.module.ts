import { Module } from '@nestjs/common'
import { CreateAccountController } from './controllers/create-account.controller'
import { AuthenticateController } from './controllers/authenticate.controller'
import { CreateProblemController } from './controllers/create-problem.controller'
import { FetchProblemsController } from './controllers/fetch-problems.controller'
import { DatabaseModule } from '../database/database.module'
import { CreateProblemUseCase } from '@/domain/maintenance-problems/application/use-cases/create-problem'
import { FetchRecentProblemsUseCase } from '@/domain/maintenance-problems/application/use-cases/fetch-problems'

@Module({
  imports: [DatabaseModule],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    CreateProblemController,
    FetchProblemsController,
  ],
  providers: [CreateProblemUseCase, FetchRecentProblemsUseCase],
})
export class HttpModule {}
