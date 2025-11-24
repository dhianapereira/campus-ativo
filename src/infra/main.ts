import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { EnvService } from './env/env.service'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const config = new DocumentBuilder()
    .setTitle('IFAL Arapiraca Backend API')
    .setDescription(
      'API para gerenciamento de problemas de infraestrutura do IFAL Arapiraca',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)

  const env = app.get(EnvService)
  const port = env.get('PORT')

  await app.listen(port)
}

bootstrap()
