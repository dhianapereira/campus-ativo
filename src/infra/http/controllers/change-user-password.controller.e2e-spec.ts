import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { BcryptHasher } from '@/infra/cryptography/bcrypt-hasher'

describe('Change user password (E2E)', () => {
  let app: INestApplication
  let userFactory: UserFactory
  let jwt: JwtService
  let hasher: BcryptHasher

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    userFactory = moduleRef.get(UserFactory)
    jwt = moduleRef.get(JwtService)
    hasher = new BcryptHasher()

    await app.init()
  })

  test('[PATCH] /users/:id/password (user changing own password)', async () => {
    const oldPassword = 'oldPassword123'
    const hashedOldPassword = await hasher.hash(oldPassword)

    const user = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
      password: hashedOldPassword,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const response = await request(app.getHttpServer())
      .patch(`/users/${user.id.toValue()}/password`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        oldPassword,
        newPassword: 'newPassword123',
      })

    expect(response.statusCode).toBe(200)
    expect(response.body.message).toBe('Password changed successfully')
  })

  test('[PATCH] /users/:id/password (wrong old password)', async () => {
    const oldPassword = 'oldPassword123'
    const hashedOldPassword = await hasher.hash(oldPassword)

    const user = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
      password: hashedOldPassword,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const response = await request(app.getHttpServer())
      .patch(`/users/${user.id.toValue()}/password`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        oldPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      })

    expect(response.statusCode).toBe(401)
  })

  test('[PATCH] /users/:id/password (user trying to change another user password - should fail)', async () => {
    const oldPassword = 'oldPassword123'
    const hashedOldPassword = await hasher.hash(oldPassword)

    const user = await userFactory.makePrismaUser({
      role: UserRole.MANAGER,
      password: hashedOldPassword,
    })

    const otherUser = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
      password: hashedOldPassword,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const response = await request(app.getHttpServer())
      .patch(`/users/${otherUser.id.toValue()}/password`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        oldPassword,
        newPassword: 'newPassword123',
      })

    expect(response.statusCode).toBe(403)
  })

  test('[PATCH] /users/:id/password (admin trying to change another user password - should fail)', async () => {
    const oldPassword = 'oldPassword123'
    const hashedOldPassword = await hasher.hash(oldPassword)

    const admin = await userFactory.makePrismaUser({
      role: UserRole.ADMIN,
      password: hashedOldPassword,
    })

    const targetUser = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
      password: hashedOldPassword,
    })

    const accessToken = jwt.sign({
      sub: admin.id.toValue(),
      role: admin.role,
    })

    const response = await request(app.getHttpServer())
      .patch(`/users/${targetUser.id.toValue()}/password`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        oldPassword,
        newPassword: 'newPassword123',
      })

    expect(response.statusCode).toBe(403)
  })

  test('[PATCH] /users/:id/password (non-existent user)', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const response = await request(app.getHttpServer())
      .patch('/users/non-existent-id/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        oldPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      })

    expect(response.statusCode).toBe(404)
  })

  test('[PATCH] /users/:id/password (password too short)', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const response = await request(app.getHttpServer())
      .patch(`/users/${user.id.toValue()}/password`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        oldPassword: 'short',
        newPassword: 'new',
      })

    expect(response.statusCode).toBe(400)
  })
})
