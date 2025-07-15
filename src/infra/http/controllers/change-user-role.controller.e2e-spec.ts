import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user-factory'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

describe('Change User Role (E2E)', () => {
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

  test('[PATCH] /users/:id/role - admin should be able to change any role', async () => {
    const admin = await userFactory.makePrismaUser({ role: UserRole.ADMIN })
    const reporter = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({ sub: admin.id.toValue() })

    const response = await request(app.getHttpServer())
      .patch(`/users/${reporter.id.toValue()}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        role: 'MANAGER',
      })


    expect(response.statusCode).toBe(204)

    const userOnDatabase = await prisma.user.findUnique({
      where: {
        id: reporter.id.toValue(),
      },
    })

    expect(userOnDatabase?.role).toBe('MANAGER')
  })

  test('[PATCH] /users/:id/role - director should be able to change roles below their level', async () => {
    const director = await userFactory.makePrismaUser({
      role: UserRole.DIRECTOR,
    })
    const manager = await userFactory.makePrismaUser({ role: UserRole.MANAGER })

    const accessToken = jwt.sign({ sub: director.id.toValue() })

    const response = await request(app.getHttpServer())
      .patch(`/users/${manager.id.toValue()}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        role: 'REPORTER',
      })

    expect(response.statusCode).toBe(204)

    const userOnDatabase = await prisma.user.findUnique({
      where: {
        id: manager.id.toValue(),
      },
    })

    expect(userOnDatabase?.role).toBe('REPORTER')
  })

  test('[PATCH] /users/:id/role - director should not be able to change admin role', async () => {
    const director = await userFactory.makePrismaUser({
      role: UserRole.DIRECTOR,
    })
    const admin = await userFactory.makePrismaUser({ role: UserRole.ADMIN })

    const accessToken = jwt.sign({ sub: director.id.toValue() })

    const response = await request(app.getHttpServer())
      .patch(`/users/${admin.id.toValue()}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        role: 'MANAGER',
      })

    expect(response.statusCode).toBe(403)
  })

  test('[PATCH] /users/:id/role - manager should not be able to change any role', async () => {
    const manager = await userFactory.makePrismaUser({ role: UserRole.MANAGER })
    const reporter = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({ sub: manager.id.toValue() })

    const response = await request(app.getHttpServer())
      .patch(`/users/${reporter.id.toValue()}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        role: 'DIRECTOR',
      })

    expect(response.statusCode).toBe(403)
  })

  test('[PATCH] /users/:id/role - should return 404 for non-existent user', async () => {
    const admin = await userFactory.makePrismaUser({ role: UserRole.ADMIN })

    const accessToken = jwt.sign({ sub: admin.id.toValue() })

    const response = await request(app.getHttpServer())
      .patch('/users/non-existent-id/role')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        role: 'MANAGER',
      })

    expect(response.statusCode).toBe(404)
  })

  test('[PATCH] /users/:id/role - should return 401 without authentication', async () => {
    const reporter = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const response = await request(app.getHttpServer())
      .patch(`/users/${reporter.id.toValue()}/role`)
      .send({
        role: 'MANAGER',
      })

    expect(response.statusCode).toBe(401)
  })
})
