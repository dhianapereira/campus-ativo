import { AppModule } from '@/app.module'
import { PrismaService } from '@/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'

describe('Fetch problems (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[GET] /problems', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'John Doe',
        position: 'Director',
        email: 'johndoe@example.com',
        password: '123456',
      },
    })

    const accessToken = jwt.sign({ sub: user.id })

    await prisma.problem.createMany({
      data: [
        {
          title: 'Problem 01',
          description: 'Problem description',
          userId: user.id,
        },
        {
          title: 'Problem 02',
          description: 'Problem description',
          userId: user.id,
        },
      ],
    })

    const response = await request(app.getHttpServer())
      .get('/problems')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      problems: [
        expect.objectContaining({ title: 'Problem 01' }),
        expect.objectContaining({ title: 'Problem 02' }),
      ],
    })
  })
})
