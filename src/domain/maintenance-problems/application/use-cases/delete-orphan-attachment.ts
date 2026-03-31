import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Injectable } from '@nestjs/common'
import { AttachmentsRepository } from '../repositories/attachments-repository'

interface DeleteOrphanAttachmentUseCaseRequest {
  attachmentId: string
  ownerId: string
}

type DeleteOrphanAttachmentUseCaseResponse = Either<
  ResourceNotFoundError,
  object
>

@Injectable()
export class DeleteOrphanAttachmentUseCase {
  constructor(private readonly attachmentsRepository: AttachmentsRepository) {}

  async execute({
    attachmentId,
    ownerId,
  }: DeleteOrphanAttachmentUseCaseRequest): Promise<DeleteOrphanAttachmentUseCaseResponse> {
    const attachment = await this.attachmentsRepository.findOrphanByIdAndOwner(
      attachmentId,
      ownerId,
    )

    if (!attachment) {
      return left(new ResourceNotFoundError())
    }

    await this.attachmentsRepository.delete(attachment)

    return right({})
  }
}
