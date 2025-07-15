import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user-factory'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { ProblemFactory } from 'test/factories/make-problem'
import { CategoryFactory } from 'test/factories/make-category'
import { LocationFactory } from 'test/factories/make-location'

describe('Edit Problem Role Check (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let problemFactory: ProblemFactory
  let categoryFactory: CategoryFactory
  let locationFactory: LocationFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        UserFactory,
        ProblemFactory,
        CategoryFactory,
        LocationFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    userFactory = moduleRef.get(UserFactory)
    problemFactory = moduleRef.get(ProblemFactory)
    categoryFactory = moduleRef.get(CategoryFactory)
    locationFactory = moduleRef.get(LocationFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[PUT] /problems/:id - reporter should be able to edit their own problem', async () => {
    const reporter = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const category = await categoryFactory.makePrismaCategory()
    const location = await locationFactory.makePrismaLocation()

    const problem = await problemFactory.makePrismaProblem({
      reporterId: reporter.id,
      categoryId: category.id,
      locationId: location.id,
    })

    const accessToken = jwt.sign({ sub: reporter.id.toValue() })

    const response = await request(app.getHttpServer())
      .put(`/problems/${problem.id.toValue()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Updated Problem Title',
        description: 'Updated problem description',
      })

    expect(response.statusCode).toBe(204)

    const problemOnDatabase = await prisma.problem.findUnique({
      where: {
        id: problem.id.toValue(),
      },
    })

    expect(problemOnDatabase?.title).toEqual('Updated Problem Title')
  })

  test('[PUT] /problems/:id - manager should be able to edit any problem', async () => {
    const manager = await userFactory.makePrismaUser({ role: UserRole.MANAGER })
    const reporter = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const category = await categoryFactory.makePrismaCategory()
    const location = await locationFactory.makePrismaLocation()

    const problem = await problemFactory.makePrismaProblem({
      reporterId: reporter.id,
      categoryId: category.id,
      locationId: location.id,
    })

    const accessToken = jwt.sign({ sub: manager.id.toValue() })

    const response = await request(app.getHttpServer())
      .put(`/problems/${problem.id.toValue()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Manager Updated Title',
        description: 'Manager updated description',
      })

    expect(response.statusCode).toBe(204)
  })

  test('[PUT] /problems/:id - reporter should not be able to edit other users problem', async () => {
    const reporter1 = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })
    const reporter2 = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const category = await categoryFactory.makePrismaCategory()
    const location = await locationFactory.makePrismaLocation()

    const problem = await problemFactory.makePrismaProblem({
      reporterId: reporter1.id,
      categoryId: category.id,
      locationId: location.id,
    })

    const accessToken = jwt.sign({ sub: reporter2.id.toValue() })

    const response = await request(app.getHttpServer())
      .put(`/problems/${problem.id.toValue()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Should not work',
        description: 'This should not work',
      })

    expect(response.statusCode).toBe(403)
  })

  test('[PUT] /problems/:id - should return 401 without authentication', async () => {
    const reporter = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const category = await categoryFactory.makePrismaCategory()
    const location = await locationFactory.makePrismaLocation()

    const problem = await problemFactory.makePrismaProblem({
      reporterId: reporter.id,
      categoryId: category.id,
      locationId: location.id,
    })

    const response = await request(app.getHttpServer())
      .put(`/problems/${problem.id.toValue()}`)
      .send({
        title: 'Unauthorized',
        description: 'This should not work',
      })

    expect(response.statusCode).toBe(401)
  })
})
