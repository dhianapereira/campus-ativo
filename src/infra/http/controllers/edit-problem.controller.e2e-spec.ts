import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { CategoryFactory } from 'test/factories/make-category'
import { LocationFactory } from 'test/factories/make-location'
import { ProblemFactory } from 'test/factories/make-problem'
import { ReporterFactory } from 'test/factories/make-reporter'
import { UserFactory } from 'test/factories/make-user'

describe('Edit problem (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let reporterFactory: ReporterFactory
  let problemFactory: ProblemFactory
  let categoryFactory: CategoryFactory
  let locationFactory: LocationFactory
  let jwt: JwtService
  let userFactory: UserFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        ReporterFactory,
        ProblemFactory,
        CategoryFactory,
        LocationFactory,
        UserFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    reporterFactory = moduleRef.get(ReporterFactory)
    problemFactory = moduleRef.get(ProblemFactory)
    categoryFactory = moduleRef.get(CategoryFactory)
    locationFactory = moduleRef.get(LocationFactory)
    userFactory = moduleRef.get(UserFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[PUT] /problems/:id', async () => {
    const user = await reporterFactory.makePrismaReporter()

    const accessToken = jwt.sign({ sub: user.id.toValue() })

    const category = await categoryFactory.makePrismaCategory({
      name: 'Category 01',
    })

    const location = await locationFactory.makePrismaLocation({
      name: 'Location 01',
    })

    const problem = await problemFactory.makePrismaProblem({
      reporterId: user.id,
      locationId: location.id,
      categoryId: category.id,
    })

    const problemId = problem.id.toValue()

    const response = await request(app.getHttpServer())
      .put(`/problems/${problemId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'New title',
        description: 'New description',
      })

    expect(response.statusCode).toBe(204)

    const problemOnDatabase = await prisma.problem.findFirst({
      where: {
        title: 'New title',
        description: 'New description',
      },
    })

    expect(problemOnDatabase).toBeTruthy()
  })

  test('[PUT] /problems/:id (trying to edit another user\'s problem - should fail)', async () => {
    const originalUser = await userFactory.makePrismaUser()
    
    const category = await categoryFactory.makePrismaCategory()
    const location = await locationFactory.makePrismaLocation()
    
    const problem = await problemFactory.makePrismaProblem({
      reporterId: originalUser.id,
      categoryId: category.id,
      locationId: location.id,
    })

    const differentUser = await userFactory.makePrismaUser()
    const accessToken = jwt.sign({ sub: differentUser.id.toValue() })

    const response = await request(app.getHttpServer())
      .put(`/problems/${problem.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Hacked title',
        description: 'Hacked description',
      })

    expect(response.statusCode).toBe(400) // NotAllowedError becomes BadRequestException
  })
})
