import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

describe('Change user role (E2E)', () => {
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

  test('[PUT] /users/:id/role (admin changing any role)', async () => {
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
      .put(`/users/${targetUser.id.toValue()}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        role: 'MANAGER',
      })

    expect(response.statusCode).toBe(200)
    expect(response.body.message).toBe('Role updated successfully')

    const updatedUser = await prisma.user.findUnique({
      where: { id: targetUser.id.toValue() },
    })

    expect(updatedUser?.role).toBe('MANAGER')
  })

  test('[PUT] /users/:id/role (director changing lower role)', async () => {
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
      .put(`/users/${targetUser.id.toValue()}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        role: 'MANAGER',
      })

    expect(response.statusCode).toBe(200)
    expect(response.body.message).toBe('Role updated successfully')
  })

  test('[PUT] /users/:id/role (director trying to change admin - should fail)', async () => {
    const director = await userFactory.makePrismaUser({
      role: UserRole.DIRECTOR,
    })

    const adminUser = await userFactory.makePrismaUser({
      role: UserRole.ADMIN,
    })

    const accessToken = jwt.sign({ 
      sub: director.id.toValue(),
      role: director.role,
    })

    const response = await request(app.getHttpServer())
      .put(`/users/${adminUser.id.toValue()}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        role: 'MANAGER',
      })

    expect(response.statusCode).toBe(403)
  })

  test('[PUT] /users/:id/role (director trying to assign admin role - should fail)', async () => {
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
      .put(`/users/${targetUser.id.toValue()}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        role: 'ADMIN',
      })

    expect(response.statusCode).toBe(403)
  })

  test('[PUT] /users/:id/role (manager trying to change role - should fail)', async () => {
    const manager = await userFactory.makePrismaUser({
      role: UserRole.MANAGER,
    })

    const targetUser = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({ 
      sub: manager.id.toValue(),
      role: manager.role,
    })

    const response = await request(app.getHttpServer())
      .put(`/users/${targetUser.id.toValue()}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        role: 'DIRECTOR',
      })

    expect(response.statusCode).toBe(403)
  })

  test('[PUT] /users/:id/role (non-existent user)', async () => {
    const admin = await userFactory.makePrismaUser({
      role: UserRole.ADMIN,
    })

    const accessToken = jwt.sign({ 
      sub: admin.id.toValue(),
      role: admin.role,
    })

    const response = await request(app.getHttpServer())
      .put('/users/non-existent-id/role')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        role: 'MANAGER',
      })

    expect(response.statusCode).toBe(404)
  })
})