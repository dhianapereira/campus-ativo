import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user-factory'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

describe('Fetch Users (E2E)', () => {
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

  test('[GET] /users - director should be able to fetch users', async () => {
    const director = await userFactory.makePrismaUser({
      role: UserRole.DIRECTOR,
    })
    const reporter = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })
    const manager = await userFactory.makePrismaUser({ role: UserRole.MANAGER })

    const accessToken = jwt.sign({ sub: director.id.toValue() })

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      users: expect.arrayContaining([
        expect.objectContaining({
          id: director.id.toValue(),
          role: UserRole.DIRECTOR,
        }),
        expect.objectContaining({
          id: reporter.id.toValue(),
          role: UserRole.REPORTER,
        }),
        expect.objectContaining({
          id: manager.id.toValue(),
          role: UserRole.MANAGER,
        }),
      ]),
    })
  })

  test('[GET] /users - admin should be able to fetch users', async () => {
    const admin = await userFactory.makePrismaUser({ role: UserRole.ADMIN })

    const accessToken = jwt.sign({ sub: admin.id.toValue() })

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      users: expect.arrayContaining([
        expect.objectContaining({
          id: admin.id.toValue(),
          role: UserRole.ADMIN,
        }),
      ]),
    })
  })

  test('[GET] /users - manager should not be able to fetch users', async () => {
    const manager = await userFactory.makePrismaUser({ role: UserRole.MANAGER })

    const accessToken = jwt.sign({ sub: manager.id.toValue() })

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)
  })

  test('[GET] /users - reporter should not be able to fetch users', async () => {
    const reporter = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({ sub: reporter.id.toValue() })

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)
  })

  test('[GET] /users - should return 401 without authentication', async () => {
    const response = await request(app.getHttpServer()).get('/users')

    expect(response.statusCode).toBe(401)
  })
})
