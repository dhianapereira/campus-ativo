import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ImageUploader } from '@/domain/maintenance-problems/application/upload/image-uploader'
import { FakeUploader } from 'test/upload/fake-uploader'

describe('Upload Attachment (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ImageUploader)
      .useClass(FakeUploader)
      .compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[POST] /attachments - should upload an image', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'John Doe',
        position: 'Manager',
        email: 'johndoe@ifal.edu.br',
        password: '123456',
        isActive: true,
      },
    })

    const accessToken = jwt.sign({ sub: user.id })

    const response = await request(app.getHttpServer())
      .post('/attachments')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('fake image content'), {
        filename: 'test-image.png',
        contentType: 'image/png',
      })

    expect(response.statusCode).toBe(201)
    expect(response.body).toEqual({
      attachmentId: expect.any(String),
      url: expect.stringContaining('https://'),
    })

    const attachmentOnDatabase = await prisma.attachment.findUnique({
      where: {
        id: response.body.attachmentId,
      },
    })

    expect(attachmentOnDatabase).toBeTruthy()
    expect(attachmentOnDatabase?.title).toBe('test-image.png')
  })

  test('[POST] /attachments - should reject files larger than 32MB', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Jane Doe',
        position: 'Manager',
        email: 'janedoe@ifal.edu.br',
        password: '123456',
        isActive: true,
      },
    })

    const accessToken = jwt.sign({ sub: user.id })

    // Create a buffer larger than 32MB
    const largeBuffer = Buffer.alloc(33 * 1024 * 1024) // 33MB

    const response = await request(app.getHttpServer())
      .post('/attachments')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', largeBuffer, {
        filename: 'large-image.png',
        contentType: 'image/png',
      })

    expect(response.statusCode).toBe(400)
  })

  test('[POST] /attachments - should reject non-image files', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Bob Smith',
        position: 'Manager',
        email: 'bob@ifal.edu.br',
        password: '123456',
        isActive: true,
      },
    })

    const accessToken = jwt.sign({ sub: user.id })

    const response = await request(app.getHttpServer())
      .post('/attachments')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('fake pdf content'), {
        filename: 'document.pdf',
        contentType: 'application/pdf',
      })

    expect(response.statusCode).toBe(400)
  })

  test('[POST] /attachments - should reject request without authentication', async () => {
    const response = await request(app.getHttpServer())
      .post('/attachments')
      .attach('file', Buffer.from('fake image'), {
        filename: 'test.png',
        contentType: 'image/png',
      })

    expect(response.statusCode).toBe(401)
  })

  test('[POST] /attachments - should accept different image formats', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Alice Johnson',
        position: 'Manager',
        email: 'alice@ifal.edu.br',
        password: '123456',
        isActive: true,
      },
    })

    const accessToken = jwt.sign({ sub: user.id })

    const imageFormats = [
      { filename: 'photo.jpg', contentType: 'image/jpeg' },
      { filename: 'photo.jpeg', contentType: 'image/jpeg' },
      { filename: 'screenshot.png', contentType: 'image/png' },
      { filename: 'animation.gif', contentType: 'image/gif' },
      { filename: 'modern.webp', contentType: 'image/webp' },
    ]

    for (const format of imageFormats) {
      const response = await request(app.getHttpServer())
        .post('/attachments')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('fake image'), format)

      expect(response.statusCode).toBe(201)
      expect(response.body.attachmentId).toBeDefined()
    }
  })
})
