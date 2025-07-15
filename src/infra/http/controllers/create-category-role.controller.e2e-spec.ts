import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user-factory'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

describe('Create Category Role Check (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    userFactory = moduleRef.get(UserFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[POST] /categories - manager should be able to create category', async () => {
    const manager = await userFactory.makePrismaUser({ role: UserRole.MANAGER })

    const accessToken = jwt.sign({ sub: manager.id.toValue() })

    const response = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Maintenance',
        description: 'General maintenance issues',
      })

    expect(response.statusCode).toBe(201)

    const categoryOnDatabase = await prisma.category.findFirst({
      where: {
        name: 'Maintenance',
      },
    })

    expect(categoryOnDatabase).toBeTruthy()
  })

  test('[POST] /categories - director should be able to create category', async () => {
    const director = await userFactory.makePrismaUser({
      role: UserRole.DIRECTOR,
    })

    const accessToken = jwt.sign({ sub: director.id.toValue() })

    const response = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Security',
        description: 'Security related issues',
      })

    expect(response.statusCode).toBe(201)
  })

  test('[POST] /categories - admin should be able to create category', async () => {
    const admin = await userFactory.makePrismaUser({ role: UserRole.ADMIN })

    const accessToken = jwt.sign({ sub: admin.id.toValue() })

    const response = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Infrastructure',
        description: 'Infrastructure related issues',
      })

    expect(response.statusCode).toBe(201)
  })

  test('[POST] /categories - reporter should not be able to create category', async () => {
    const reporter = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({ sub: reporter.id.toValue() })

    const response = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Cleaning',
        description: 'Cleaning related issues',
      })

    expect(response.statusCode).toBe(403)
  })

  test('[POST] /categories - should return 401 without authentication', async () => {
    const response = await request(app.getHttpServer())
      .post('/categories')
      .send({
        name: 'Unauthorized',
        description: 'This should not work',
      })

    expect(response.statusCode).toBe(401)
  })
})
