import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user-factory'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

describe('Create location (E2E)', () => {
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

  test('[POST] /locations', async () => {
    const user = await userFactory.makePrismaUser({ role: UserRole.MANAGER })

    const accessToken = jwt.sign({ sub: user.id.toValue() })

    const response = await request(app.getHttpServer())
      .post('/locations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'New location',
        description: 'Location description',
        code: 'X01',
      })

    expect(response.statusCode).toBe(201)

    const locationOnDatabase = await prisma.location.findFirst({
      where: {
        name: 'New location',
      },
    })

    expect(locationOnDatabase).toBeTruthy()
  })
})
