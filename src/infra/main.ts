import { NestFactory } from '@nestjs/core'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { OpenAPIObject } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { EnvService } from './env/env.service'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function generateOpenApiSpec(document: OpenAPIObject) {
  const openApiPath = join(process.cwd(), 'openapi.json')

  await writeFile(openApiPath, JSON.stringify(document, null, 2))
  console.log(`OpenAPI spec generated at ${openApiPath}`)
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const env = app.get(EnvService)
  const corsOrigin = env.get('CORS_ORIGIN')

  if (corsOrigin) {
    app.enableCors({
      origin: corsOrigin.split(',').map((origin) => origin.trim()),
    })
  }

  const config = new DocumentBuilder()
    .setTitle('Campus Ativo API')
    .setDescription('API para gerenciamento de problemas de infraestrutura')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT-auth',
    )
    .build()

  const document = SwaggerModule.createDocument(app, config)

  if (process.env.OPENAPI_GENERATION === 'true') {
    await generateOpenApiSpec(document)
    await app.close()
    return
  }

  SwaggerModule.setup('api', app, document)

  const port = env.get('PORT')

  await app.listen(port, '0.0.0.0')
  console.log(`HTTP server running on port ${port}`)
}

bootstrap()
