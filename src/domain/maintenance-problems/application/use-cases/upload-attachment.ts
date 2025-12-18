import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { ImageUploader } from '../upload/image-uploader'
import { AttachmentsRepository } from '../repositories/attachments-repository'
import { Attachment } from '../../enterprise/entities/attachment'
import { InvalidAttachmentTypeError } from './errors/invalid-attachment-type-error'

interface UploadAttachmentUseCaseRequest {
  fileName: string
  fileType: string
  body: Buffer
}

type UploadAttachmentUseCaseResponse = Either<
  InvalidAttachmentTypeError,
  {
    attachment: Attachment
  }
>

@Injectable()
export class UploadAttachmentUseCase {
  constructor(
    private imageUploader: ImageUploader,
    private attachmentsRepository: AttachmentsRepository,
  ) {}

  async execute({
    fileName,
    fileType,
    body,
  }: UploadAttachmentUseCaseRequest): Promise<UploadAttachmentUseCaseResponse> {
    // Validate file type (only images)
    const validImageTypes = /^image\/(jpeg|jpg|png|gif|webp)$/
    if (!validImageTypes.test(fileType)) {
      return left(new InvalidAttachmentTypeError(fileType))
    }

    // Upload to ImgBB
    const { url } = await this.imageUploader.upload({
      fileName,
      fileType,
      body,
    })

    // Create attachment entity
    const attachment = Attachment.create({
      title: fileName,
      link: url,
    })

    // Save to database
    await this.attachmentsRepository.create(attachment)

    return right({
      attachment,
    })
  }
}
