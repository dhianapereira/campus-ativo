import { ConfigModule } from '@nestjs/config'
import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { CreateAccountController } from './controllers/create-account.controller'
import { envSchema } from './env'
import { AuthModule } from './auth/auth.module'
import { AuthenticateController } from './controllers/authenticate.controller'
import { CreateProblemController } from './controllers/create-problem.controller'
import { FetchProblemsController } from './controllers/fetch-problems.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    AuthModule,
  ],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    CreateProblemController,
    FetchProblemsController,
  ],
  providers: [PrismaService],
})
export class AppModule {}
