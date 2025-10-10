import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { LocationFactory } from 'test/factories/make-location'
import { UserFactory } from 'test/factories/make-user'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

describe('Trash location (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let locationFactory: LocationFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, LocationFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    userFactory = moduleRef.get(UserFactory)
    locationFactory = moduleRef.get(LocationFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[PATCH] /locations/:id/trash', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.MANAGER,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const location = await locationFactory.makePrismaLocation({
      name: 'Location to Trash',
    })

    const locationId = location.id.toValue()

    const response = await request(app.getHttpServer())
      .patch(`/locations/${locationId}/trash`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(204)

    const locationOnDatabase = await prisma.location.findUnique({
      where: {
        id: locationId,
      },
    })

    expect(locationOnDatabase).toBeTruthy()
    expect(locationOnDatabase?.deletedAt).toBeTruthy()
  })

  test('[PATCH] /locations/:id/trash (location not found)', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.MANAGER,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const response = await request(app.getHttpServer())
      .patch('/locations/non-existent-id/trash')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(400)
  })

  test('[PATCH] /locations/:id/trash (as reporter - should be forbidden)', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const location = await locationFactory.makePrismaLocation({
      name: 'Test Location',
    })

    const locationId = location.id.toValue()

    const response = await request(app.getHttpServer())
      .patch(`/locations/${locationId}/trash`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)
  })
})
