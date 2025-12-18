import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

describe('Change user status (E2E)', () => {
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

  test('[PATCH] /users/:id/status (director activating user)', async () => {
    const director = await userFactory.makePrismaUser({
      role: UserRole.DIRECTOR,
    })

    const targetUser = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
      isActive: false,
    })

    const accessToken = jwt.sign({
      sub: director.id.toValue(),
      role: director.role,
    })

    const response = await request(app.getHttpServer())
      .patch(`/users/${targetUser.id.toValue()}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        isActive: true,
      })

    expect(response.statusCode).toBe(200)
    expect(response.body.message).toBe('User status updated successfully')

    const updatedUser = await prisma.user.findUnique({
      where: { id: targetUser.id.toValue() },
    })

    expect(updatedUser?.isActive).toBe(true)
  })

  test('[PATCH] /users/:id/status (admin deactivating user)', async () => {
    const admin = await userFactory.makePrismaUser({
      role: UserRole.ADMIN,
    })

    const targetUser = await userFactory.makePrismaUser({
      role: UserRole.MANAGER,
      isActive: true,
    })

    const accessToken = jwt.sign({
      sub: admin.id.toValue(),
      role: admin.role,
    })

    const response = await request(app.getHttpServer())
      .patch(`/users/${targetUser.id.toValue()}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        isActive: false,
      })

    expect(response.statusCode).toBe(200)
    expect(response.body.message).toBe('User status updated successfully')

    const updatedUser = await prisma.user.findUnique({
      where: { id: targetUser.id.toValue() },
    })

    expect(updatedUser?.isActive).toBe(false)
  })

  test('[PATCH] /users/:id/status (manager trying to change status - should fail)', async () => {
    const manager = await userFactory.makePrismaUser({
      role: UserRole.MANAGER,
    })

    const targetUser = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
      isActive: true,
    })

    const accessToken = jwt.sign({
      sub: manager.id.toValue(),
      role: manager.role,
    })

    const response = await request(app.getHttpServer())
      .patch(`/users/${targetUser.id.toValue()}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        isActive: false,
      })

    expect(response.statusCode).toBe(403)
  })

  test('[PATCH] /users/:id/status (reporter trying to change status - should fail)', async () => {
    const reporter = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const targetUser = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
      isActive: true,
    })

    const accessToken = jwt.sign({
      sub: reporter.id.toValue(),
      role: reporter.role,
    })

    const response = await request(app.getHttpServer())
      .patch(`/users/${targetUser.id.toValue()}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        isActive: false,
      })

    expect(response.statusCode).toBe(403)
  })

  test('[PATCH] /users/:id/status (non-existent user)', async () => {
    const director = await userFactory.makePrismaUser({
      role: UserRole.DIRECTOR,
    })

    const accessToken = jwt.sign({
      sub: director.id.toValue(),
      role: director.role,
    })

    const response = await request(app.getHttpServer())
      .patch('/users/non-existent-id/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        isActive: false,
      })

    expect(response.statusCode).toBe(404)
  })

  test('[PATCH] /users/:id/status (user trying to deactivate their own account - should fail)', async () => {
    const admin = await userFactory.makePrismaUser({
      role: UserRole.ADMIN,
      isActive: true,
    })

    const accessToken = jwt.sign({
      sub: admin.id.toValue(),
      role: admin.role,
    })

    const response = await request(app.getHttpServer())
      .patch(`/users/${admin.id.toValue()}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        isActive: false,
      })

    expect(response.statusCode).toBe(403)

    const user = await prisma.user.findUnique({
      where: { id: admin.id.toValue() },
    })

    expect(user?.isActive).toBe(true)
  })

  test('[PATCH] /users/:id/status (user activating their own account - should succeed)', async () => {
    const admin = await userFactory.makePrismaUser({
      role: UserRole.ADMIN,
      isActive: true,
    })

    const accessToken = jwt.sign({
      sub: admin.id.toValue(),
      role: admin.role,
    })

    const response = await request(app.getHttpServer())
      .patch(`/users/${admin.id.toValue()}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        isActive: true,
      })

    expect(response.statusCode).toBe(200)
  })
})
