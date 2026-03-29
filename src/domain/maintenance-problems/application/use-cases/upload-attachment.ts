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
    const validImageTypes = /^image\/(jpeg|jpg|png|gif|webp)$/
    if (!validImageTypes.test(fileType)) {
      return left(new InvalidAttachmentTypeError(fileType))
    }

    const { storageKey } = await this.imageUploader.upload({
      fileName,
      fileType,
      body,
    })

    const attachment = Attachment.create({
      title: fileName,
      link: storageKey,
    })

    await this.attachmentsRepository.create(attachment)

    return right({
      attachment,
    })
  }
}
