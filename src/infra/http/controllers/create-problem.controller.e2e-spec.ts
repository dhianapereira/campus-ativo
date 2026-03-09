import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { CategoryFactory } from 'test/factories/make-category'
import { LocationFactory } from 'test/factories/make-location'
import { UserFactory } from 'test/factories/make-user'

describe('Create problem (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let categoryFactory: CategoryFactory
  let locationFactory: LocationFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, CategoryFactory, LocationFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    userFactory = moduleRef.get(UserFactory)
    categoryFactory = moduleRef.get(CategoryFactory)
    locationFactory = moduleRef.get(LocationFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[POST] /problems', async () => {
    const user = await userFactory.makePrismaUser()

    const accessToken = jwt.sign({ sub: user.id.toValue() })

    const category = await categoryFactory.makePrismaCategory({
      name: 'Category 01',
    })

    const location = await locationFactory.makePrismaLocation({
      name: 'Location 01',
    })

    const response = await request(app.getHttpServer())
      .post('/problems')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'New problem',
        description: 'Problem description',
        locationId: location.id.toValue(),
        categoryId: category.id.toValue(),
      })

    expect(response.statusCode).toBe(201)

    const problemOnDatabase = await prisma.problem.findFirst({
      where: {
        title: 'New problem',
      },
    })

    expect(problemOnDatabase).toBeTruthy()
  })

  test('[POST] /problems (without category)', async () => {
    const user = await userFactory.makePrismaUser()

    const accessToken = jwt.sign({ sub: user.id.toValue() })

    const location = await locationFactory.makePrismaLocation({
      name: 'Location without category',
    })

    const response = await request(app.getHttpServer())
      .post('/problems')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Problem without category',
        description: 'Problem description',
        locationId: location.id.toValue(),
      })

    expect(response.statusCode).toBe(201)

    const problemOnDatabase = await prisma.problem.findFirst({
      where: {
        title: 'Problem without category',
      },
    })

    expect(problemOnDatabase).toBeTruthy()
    expect(problemOnDatabase?.categoryId).toBeNull()
  })
})
