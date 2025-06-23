import { Module } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateAccountController } from './controllers/create-account.controller'
import { AuthenticateController } from './controllers/authenticate.controller'
import { CreateProblemController } from './controllers/create-problem.controller'
import { FetchProblemsController } from './controllers/fetch-problems.controller'

@Module({
  controllers: [
    CreateAccountController,
    AuthenticateController,
    CreateProblemController,
    FetchProblemsController,
  ],
  providers: [PrismaService],
})
export class HttpModule {}
