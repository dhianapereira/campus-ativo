import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ReporterFactory } from 'test/factories/make-reporter'

describe('Create category (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let reporterFactory: ReporterFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [ReporterFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    reporterFactory = moduleRef.get(ReporterFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[POST] /categories', async () => {
    const user = await reporterFactory.makePrismaReporter()

    const accessToken = jwt.sign({ sub: user.id.toValue() })

    const response = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'New category',
        description: 'Category description',
      })

    expect(response.statusCode).toBe(201)

    const categoryOnDatabase = await prisma.category.findFirst({
      where: {
        name: 'New category',
      },
    })

    expect(categoryOnDatabase).toBeTruthy()
  })
})
