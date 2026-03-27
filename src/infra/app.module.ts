import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { envSchema } from './env/env'
import { AuthModule } from './auth/auth.module'
import { HttpModule } from './http/http.module'
import { EnvModule } from './env/env.module'
import { DatabaseModule } from './database/database.module'
import { SystemUserBootstrapService } from './system/system-user-bootstrap.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    HttpModule,
    EnvModule,
  ],
  providers: [SystemUserBootstrapService],
})
export class AppModule {}
