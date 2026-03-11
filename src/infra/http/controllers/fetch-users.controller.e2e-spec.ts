import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

describe('Fetch users (E2E)', () => {
  let app: INestApplication
  let userFactory: UserFactory
  let jwt: JwtService

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

  test('[GET] /users (as director)', async () => {
    const director = await userFactory.makePrismaUser({
      name: 'John Director',
      role: UserRole.DIRECTOR,
    })

    await userFactory.makePrismaUser({
      name: 'Jane Reporter',
      role: UserRole.REPORTER,
    })

    await userFactory.makePrismaUser({
      name: 'Bob Manager',
      role: UserRole.MANAGER,
    })

    const accessToken = jwt.sign({
      sub: director.id.toValue(),
      role: director.role,
    })

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      users: expect.arrayContaining([
        expect.objectContaining({
          name: 'John Director',
          role: 'DIRECTOR',
        }),
        expect.objectContaining({
          name: 'Jane Reporter',
          role: 'REPORTER',
        }),
        expect.objectContaining({
          name: 'Bob Manager',
          role: 'MANAGER',
        }),
      ]),
    })
  })

  test('[GET] /users (as admin)', async () => {
    const admin = await userFactory.makePrismaUser({
      name: 'Alice Admin',
      role: UserRole.ADMIN,
    })

    const accessToken = jwt.sign({
      sub: admin.id.toValue(),
      role: admin.role,
    })

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body).toHaveProperty('users')
    expect(Array.isArray(response.body.users)).toBe(true)
  })

  test('[GET] /users (as reporter - should be forbidden)', async () => {
    const reporter = await userFactory.makePrismaUser({
      name: 'John Reporter',
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({
      sub: reporter.id.toValue(),
      role: reporter.role,
    })

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(403)
  })

  test('[GET] /users (as manager - should be forbidden)', async () => {
    const manager = await userFactory.makePrismaUser({
      name: 'John Manager',
      role: UserRole.MANAGER,
    })

    const accessToken = jwt.sign({
      sub: manager.id.toValue(),
      role: manager.role,
    })

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(403)
  })
})
