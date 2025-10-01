import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { CategoryFactory } from 'test/factories/make-category'
import { UserFactory } from 'test/factories/make-user'

describe('Fetch categories (E2E)', () => {
  let app: INestApplication
  let jwt: JwtService

  let userFactory: UserFactory
  let categoryFactory: CategoryFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, CategoryFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    userFactory = moduleRef.get(UserFactory)
    categoryFactory = moduleRef.get(CategoryFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[GET] /categories', async () => {
    const user = await userFactory.makePrismaUser()

    const accessToken = jwt.sign({ sub: user.id.toValue() })

    await Promise.all([
      categoryFactory.makePrismaCategory({
        name: 'Category 01',
      }),
      categoryFactory.makePrismaCategory({
        name: 'Category 02',
      }),
    ])

    const response = await request(app.getHttpServer())
      .get('/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      categories: expect.arrayContaining([
        expect.objectContaining({ name: 'Category 01' }),
        expect.objectContaining({ name: 'Category 02' }),
      ]),
    })
  })

  test('[GET] /categories?query=search', async () => {
    const user = await userFactory.makePrismaUser()

    const accessToken = jwt.sign({ sub: user.id.toValue() })

    await Promise.all([
      categoryFactory.makePrismaCategory({
        name: 'Climatização',
        description: 'Problemas de ar condicionado',
      }),
      categoryFactory.makePrismaCategory({
        name: 'Elétrica',
        description: 'Problemas elétricos',
      }),
    ])

    const response = await request(app.getHttpServer())
      .get('/categories?query=Clima')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Climatização' }),
      ]),
    )
  })

  test('[GET] /categories?isActive=true', async () => {
    const user = await userFactory.makePrismaUser()

    const accessToken = jwt.sign({ sub: user.id.toValue() })

    await Promise.all([
      categoryFactory.makePrismaCategory({
        name: 'Active Category',
        isActive: true,
      }),
      categoryFactory.makePrismaCategory({
        name: 'Inactive Category',
        isActive: false,
      }),
    ])

    const response = await request(app.getHttpServer())
      .get('/categories?isActive=true')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Active Category' }),
      ]),
    )
  })

  test('[GET] /categories?includeDeleted=true', async () => {
    const user = await userFactory.makePrismaUser()

    const accessToken = jwt.sign({ sub: user.id.toValue() })

    await Promise.all([
      categoryFactory.makePrismaCategory({
        name: 'Normal Category',
      }),
      categoryFactory.makePrismaCategory({
        name: 'Deleted Category',
        deletedAt: new Date(),
      }),
    ])

    const response = await request(app.getHttpServer())
      .get('/categories?includeDeleted=true')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Normal Category' }),
        expect.objectContaining({ name: 'Deleted Category' }),
      ]),
    )
  })
})
