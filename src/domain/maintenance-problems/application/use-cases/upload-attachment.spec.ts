import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { FakeUploader } from 'test/upload/fake-uploader'
import { UploadAttachmentUseCase } from './upload-attachment'
import { InvalidAttachmentTypeError } from './errors/invalid-attachment-type-error'

let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let fakeUploader: FakeUploader
let sut: UploadAttachmentUseCase

describe('Upload Attachment', () => {
  beforeEach(() => {
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    fakeUploader = new FakeUploader()
    sut = new UploadAttachmentUseCase(
      fakeUploader,
      inMemoryAttachmentsRepository,
    )
  })

  it('should be able to upload an image', async () => {
    const result = await sut.execute({
      ownerId: 'reporter-1',
      fileName: 'test-image.png',
      fileType: 'image/png',
      body: Buffer.from('fake image content'),
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryAttachmentsRepository.items).toHaveLength(1)
    expect(inMemoryAttachmentsRepository.items[0].title).toBe('test-image.png')
    expect(inMemoryAttachmentsRepository.items[0].link).toMatch(
      /^fake-uploads\//,
    )
    expect(inMemoryAttachmentsRepository.items[0].ownerId.toValue()).toBe(
      'reporter-1',
    )
  })

  it('should upload file to image uploader', async () => {
    await sut.execute({
      ownerId: 'reporter-1',
      fileName: 'test-image.jpg',
      fileType: 'image/jpeg',
      body: Buffer.from('fake image content'),
    })

    expect(fakeUploader.uploads).toHaveLength(1)
    expect(fakeUploader.uploads[0].fileName).toBe('test-image.jpg')
    expect(fakeUploader.uploads[0].fileType).toBe('image/jpeg')
  })

  it('should accept jpeg images', async () => {
    const result = await sut.execute({
      ownerId: 'reporter-1',
      fileName: 'photo.jpeg',
      fileType: 'image/jpeg',
      body: Buffer.from('fake image'),
    })

    expect(result.isRight()).toBe(true)
  })

  it('should accept jpg images', async () => {
    const result = await sut.execute({
      ownerId: 'reporter-1',
      fileName: 'photo.jpg',
      fileType: 'image/jpg',
      body: Buffer.from('fake image'),
    })

    expect(result.isRight()).toBe(true)
  })

  it('should accept png images', async () => {
    const result = await sut.execute({
      ownerId: 'reporter-1',
      fileName: 'screenshot.png',
      fileType: 'image/png',
      body: Buffer.from('fake image'),
    })

    expect(result.isRight()).toBe(true)
  })

  it('should accept gif images', async () => {
    const result = await sut.execute({
      ownerId: 'reporter-1',
      fileName: 'animation.gif',
      fileType: 'image/gif',
      body: Buffer.from('fake image'),
    })

    expect(result.isRight()).toBe(true)
  })

  it('should accept webp images', async () => {
    const result = await sut.execute({
      ownerId: 'reporter-1',
      fileName: 'modern-image.webp',
      fileType: 'image/webp',
      body: Buffer.from('fake image'),
    })

    expect(result.isRight()).toBe(true)
  })

  it('should not accept non-image files', async () => {
    const result = await sut.execute({
      ownerId: 'reporter-1',
      fileName: 'document.pdf',
      fileType: 'application/pdf',
      body: Buffer.from('fake pdf'),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidAttachmentTypeError)
  })

  it('should not accept video files', async () => {
    const result = await sut.execute({
      ownerId: 'reporter-1',
      fileName: 'video.mp4',
      fileType: 'video/mp4',
      body: Buffer.from('fake video'),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidAttachmentTypeError)
  })

  it('should not accept text files', async () => {
    const result = await sut.execute({
      ownerId: 'reporter-1',
      fileName: 'text.txt',
      fileType: 'text/plain',
      body: Buffer.from('fake text'),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidAttachmentTypeError)
  })

  it('should create attachment with correct data', async () => {
    const result = await sut.execute({
      ownerId: 'reporter-1',
      fileName: 'important-image.png',
      fileType: 'image/png',
      body: Buffer.from('fake image content'),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.attachment.title).toBe('important-image.png')
      expect(result.value.attachment.link).toMatch(/^fake-uploads\//)
    }
  })

  it('should handle multiple uploads', async () => {
    await sut.execute({
      ownerId: 'reporter-1',
      fileName: 'image1.png',
      fileType: 'image/png',
      body: Buffer.from('image 1'),
    })

    await sut.execute({
      ownerId: 'reporter-1',
      fileName: 'image2.jpg',
      fileType: 'image/jpeg',
      body: Buffer.from('image 2'),
    })

    await sut.execute({
      ownerId: 'reporter-1',
      fileName: 'image3.gif',
      fileType: 'image/gif',
      body: Buffer.from('image 3'),
    })

    expect(inMemoryAttachmentsRepository.items).toHaveLength(3)
    expect(fakeUploader.uploads).toHaveLength(3)
  })
})
