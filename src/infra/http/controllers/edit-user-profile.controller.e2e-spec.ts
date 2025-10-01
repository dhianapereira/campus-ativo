import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

describe('Edit user profile (E2E)', () => {
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

  test('[PATCH] /users/:id/profile (user editing own profile)', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
      name: 'Old Name',
      position: 'Old Position',
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const response = await request(app.getHttpServer())
      .patch(`/users/${user.id.toValue()}/profile`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'New Name',
        position: 'New Position',
      })

    expect(response.statusCode).toBe(200)
    expect(response.body.message).toBe('Profile updated successfully')

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id.toValue() },
    })

    expect(updatedUser?.name).toBe('New Name')
    expect(updatedUser?.position).toBe('New Position')
  })

  test('[PATCH] /users/:id/profile (user trying to edit another user profile - should fail)', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.MANAGER,
    })

    const otherUser = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
      name: 'Other User',
      position: 'Other Position',
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const response = await request(app.getHttpServer())
      .patch(`/users/${otherUser.id.toValue()}/profile`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Attempted Change',
        position: 'Attempted Position',
      })

    expect(response.statusCode).toBe(403)

    const unchangedUser = await prisma.user.findUnique({
      where: { id: otherUser.id.toValue() },
    })

    expect(unchangedUser?.name).toBe('Other User')
    expect(unchangedUser?.position).toBe('Other Position')
  })

  test('[PATCH] /users/:id/profile (director trying to edit another user profile - should fail)', async () => {
    const director = await userFactory.makePrismaUser({
      role: UserRole.DIRECTOR,
    })

    const targetUser = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
      name: 'Target User',
      position: 'Target Position',
    })

    const accessToken = jwt.sign({
      sub: director.id.toValue(),
      role: director.role,
    })

    const response = await request(app.getHttpServer())
      .patch(`/users/${targetUser.id.toValue()}/profile`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Attempted Change',
        position: 'Attempted Position',
      })

    expect(response.statusCode).toBe(403)
  })

  test('[PATCH] /users/:id/profile (non-existent user)', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const response = await request(app.getHttpServer())
      .patch('/users/non-existent-id/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'New Name',
        position: 'New Position',
      })

    expect(response.statusCode).toBe(404)
  })

  test('[PATCH] /users/:id/profile (invalid data - empty name)', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const response = await request(app.getHttpServer())
      .patch(`/users/${user.id.toValue()}/profile`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: '',
        position: 'New Position',
      })

    expect(response.statusCode).toBe(400)
  })
})
