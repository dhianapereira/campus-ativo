import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Attachment } from '@/domain/maintenance-problems/enterprise/entities/attachment'
import { Prisma, Attachment as PrismaAttachment } from '@prisma/client'

export class PrismaAttachmentMapper {
  static toDomain(raw: PrismaAttachment): Attachment {
    return Attachment.create(
      {
        title: raw.title,
        link: raw.url,
        ownerId: new UniqueEntityID(raw.ownerId),
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(
    attachment: Attachment,
    problemId?: string,
  ): Prisma.AttachmentUncheckedCreateInput {
    return {
      id: attachment.id.toValue(),
      title: attachment.title,
      url: attachment.link,
      ownerId: attachment.ownerId.toValue(),
      createdAt: attachment.createdAt,
      ...(problemId && { problemId }),
    }
  }
}
