import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user'

describe('Get user profile (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let userFactory: UserFactory
  let jwt: JwtService

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

  test('[GET] /profile', async () => {
    const user = await userFactory.makePrismaUser({
      name: 'John Doe',
      position: 'Reporter',
      email: 'johndoe@ifal.edu.br',
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const response = await request(app.getHttpServer())
      .get('/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      profile: expect.objectContaining({
        id: user.id.toValue(),
        name: 'John Doe',
        email: 'johndoe@ifal.edu.br',
        position: 'Reporter',
      }),
    })
  })

  test('[GET] /profile should not allow inactive user to access with valid token', async () => {
    const user = await userFactory.makePrismaUser({
      name: 'Inactive User',
      position: 'Reporter',
      email: 'inactive@ifal.edu.br',
      isActive: true,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    // User is now deactivated
    await prisma.user.update({
      where: { id: user.id.toValue() },
      data: { isActive: false },
    })

    const response = await request(app.getHttpServer())
      .get('/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(401)
  })
})
