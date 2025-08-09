import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'

describe('Create Account (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)

    await app.init()
  })

  test('[POST] /accounts - should create account with valid IFAL email', async () => {
    const response = await request(app.getHttpServer()).post('/accounts').send({
      name: 'John Doe',
      position: 'Director',
      email: 'johndoe@ifal.edu.br',
      password: '123456',
    })

    expect(response.statusCode).toBe(201)

    const userOnDatabase = await prisma.user.findUnique({
      where: {
        email: 'johndoe@ifal.edu.br',
      },
    })

    expect(userOnDatabase).toBeTruthy()
  })

  test('[POST] /accounts - should create account with valid student IFAL email', async () => {
    const response = await request(app.getHttpServer()).post('/accounts').send({
      name: 'Jane Doe',
      position: 'Student',
      email: 'janedoe@aluno.ifal.edu.br',
      password: '123456',
    })

    expect(response.statusCode).toBe(201)

    const userOnDatabase = await prisma.user.findUnique({
      where: {
        email: 'janedoe@aluno.ifal.edu.br',
      },
    })

    expect(userOnDatabase).toBeTruthy()
  })

  test('[POST] /accounts - should reject account with invalid email domain', async () => {
    const response = await request(app.getHttpServer()).post('/accounts').send({
      name: 'Invalid User',
      position: 'Director',
      email: 'invalid@gmail.com',
      password: '123456',
    })

    expect(response.statusCode).toBe(400)
    expect(response.body.message).toContain('domain is not allowed')

    const userOnDatabase = await prisma.user.findUnique({
      where: {
        email: 'invalid@gmail.com',
      },
    })

    expect(userOnDatabase).toBeNull()
  })

  test('[POST] /accounts - should reject account with various invalid domains', async () => {
    const invalidEmails = [
      'user@outlook.com',
      'user@ifal.com',
      'user@aluno.ifal.com',
      'user@fake.ifal.edu.br',
    ]

    for (const email of invalidEmails) {
      const response = await request(app.getHttpServer()).post('/accounts').send({
        name: 'Test User',
        position: 'Director',
        email,
        password: '123456',
      })

      expect(response.statusCode).toBe(400)
      expect(response.body.message).toContain('domain is not allowed')
    }
  })
})
