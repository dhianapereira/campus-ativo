import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user-factory'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

describe('Get User Profile (E2E)', () => {
  let app: INestApplication
  let jwt: JwtService
  let userFactory: UserFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    userFactory = moduleRef.get(UserFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[GET] /users/:id/profile - user should be able to view their own profile', async () => {
    const user = await userFactory.makePrismaUser({
      name: 'John Doe',
      email: 'john@example.com',
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({ sub: user.id.toValue() })

    const response = await request(app.getHttpServer())
      .get(`/users/${user.id.toValue()}/profile`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      user: expect.objectContaining({
        id: user.id.toValue(),
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.REPORTER,
      }),
    })
  })

  test('[GET] /users/:id/profile - manager should be able to view other users profile', async () => {
    const manager = await userFactory.makePrismaUser({ role: UserRole.MANAGER })
    const reporter = await userFactory.makePrismaUser({
      name: 'Jane Doe',
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({ sub: manager.id.toValue() })

    const response = await request(app.getHttpServer())
      .get(`/users/${reporter.id.toValue()}/profile`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      user: expect.objectContaining({
        id: reporter.id.toValue(),
        name: 'Jane Doe',
        role: UserRole.REPORTER,
      }),
    })
  })

  test('[GET] /users/:id/profile - reporter should not be able to view other users profile', async () => {
    const reporter1 = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })
    const reporter2 = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({ sub: reporter1.id.toValue() })

    const response = await request(app.getHttpServer())
      .get(`/users/${reporter2.id.toValue()}/profile`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)
  })

  test('[GET] /users/:id/profile - should return 404 for non-existent user', async () => {
    const user = await userFactory.makePrismaUser({ role: UserRole.REPORTER })

    const accessToken = jwt.sign({ sub: user.id.toValue() })

    const response = await request(app.getHttpServer())
      .get('/users/non-existent-id/profile')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(404)
  })

  test('[GET] /users/:id/profile - should return 401 without authentication', async () => {
    const user = await userFactory.makePrismaUser({ role: UserRole.REPORTER })

    const response = await request(app.getHttpServer()).get(
      `/users/${user.id.toValue()}/profile`,
    )

    expect(response.statusCode).toBe(401)
  })
})
