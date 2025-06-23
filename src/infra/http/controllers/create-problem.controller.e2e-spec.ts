import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'

describe('Create problem (E2E)', () => {
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

  test('[POST] /problems', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'John Doe',
        position: 'Director',
        email: 'johndoe@example.com',
        password: '123456',
      },
    })

    const accessToken = jwt.sign({ sub: user.id })

    const response = await request(app.getHttpServer())
      .post('/problems')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'New problem',
        description: 'Problem description',
      })

    expect(response.statusCode).toBe(201)

    const problemOnDatabase = await prisma.problem.findFirst({
      where: {
        title: 'New problem',
      },
    })

    expect(problemOnDatabase).toBeTruthy()
  })
})
