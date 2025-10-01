import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

describe('Delete user account (E2E)', () => {
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

  test('[DELETE] /users/:id (user deleting own account)', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const response = await request(app.getHttpServer())
      .delete(`/users/${user.id.toValue()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body.message).toBe('Account deleted successfully')

    const deletedUser = await prisma.user.findUnique({
      where: { id: user.id.toValue() },
    })

    expect(deletedUser).toBeNull()
  })

  test('[DELETE] /users/:id (user trying to delete another user account - should fail)', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.MANAGER,
    })

    const otherUser = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const response = await request(app.getHttpServer())
      .delete(`/users/${otherUser.id.toValue()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)

    const unchangedUser = await prisma.user.findUnique({
      where: { id: otherUser.id.toValue() },
    })

    expect(unchangedUser).not.toBeNull()
  })

  test('[DELETE] /users/:id (director trying to delete another user account - should fail)', async () => {
    const director = await userFactory.makePrismaUser({
      role: UserRole.DIRECTOR,
    })

    const targetUser = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({
      sub: director.id.toValue(),
      role: director.role,
    })

    const response = await request(app.getHttpServer())
      .delete(`/users/${targetUser.id.toValue()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)

    const unchangedUser = await prisma.user.findUnique({
      where: { id: targetUser.id.toValue() },
    })

    expect(unchangedUser).not.toBeNull()
  })

  test('[DELETE] /users/:id (admin trying to delete another user account - should fail)', async () => {
    const admin = await userFactory.makePrismaUser({
      role: UserRole.ADMIN,
    })

    const targetUser = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({
      sub: admin.id.toValue(),
      role: admin.role,
    })

    const response = await request(app.getHttpServer())
      .delete(`/users/${targetUser.id.toValue()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)

    const unchangedUser = await prisma.user.findUnique({
      where: { id: targetUser.id.toValue() },
    })

    expect(unchangedUser).not.toBeNull()
  })

  test('[DELETE] /users/:id (non-existent user)', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const response = await request(app.getHttpServer())
      .delete('/users/non-existent-id')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(404)
  })
})
