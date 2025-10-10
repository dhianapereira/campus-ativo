import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { CategoryFactory } from 'test/factories/make-category'
import { UserFactory } from 'test/factories/make-user'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

describe('Edit category (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let categoryFactory: CategoryFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, CategoryFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    userFactory = moduleRef.get(UserFactory)
    categoryFactory = moduleRef.get(CategoryFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[PATCH] /categories/:id', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.MANAGER,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const category = await categoryFactory.makePrismaCategory({
      name: 'Old Category',
      description: 'Old description',
    })

    const categoryId = category.id.toValue()

    const response = await request(app.getHttpServer())
      .patch(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Updated Category',
        description: 'Updated description',
        isActive: false,
      })

    expect(response.statusCode).toBe(204)

    const categoryOnDatabase = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    })

    expect(categoryOnDatabase).toBeTruthy()
    expect(categoryOnDatabase?.name).toBe('Updated Category')
    expect(categoryOnDatabase?.description).toBe('Updated description')
    expect(categoryOnDatabase?.isActive).toBe(false)
  })

  test('[PATCH] /categories/:id (category not found)', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.MANAGER,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const response = await request(app.getHttpServer())
      .patch('/categories/non-existent-id')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Updated Category',
      })

    expect(response.statusCode).toBe(400)
  })

  test('[PATCH] /categories/:id (category in trash)', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.MANAGER,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const category = await categoryFactory.makePrismaCategory({
      name: 'Trashed Category',
      deletedAt: new Date(),
    })

    const categoryId = category.id.toValue()

    const response = await request(app.getHttpServer())
      .patch(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Updated Category',
      })

    expect(response.statusCode).toBe(400)
  })

  test('[PATCH] /categories/:id (as reporter - should be forbidden)', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.REPORTER,
    })

    const accessToken = jwt.sign({
      sub: user.id.toValue(),
      role: user.role,
    })

    const category = await categoryFactory.makePrismaCategory({
      name: 'Test Category',
    })

    const categoryId = category.id.toValue()

    const response = await request(app.getHttpServer())
      .patch(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Updated Category',
      })

    expect(response.statusCode).toBe(403)
  })
})
