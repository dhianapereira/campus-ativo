import { AttachmentsRepository } from '@/domain/maintenance-problems/application/repositories/attachments-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Attachment } from '@/domain/maintenance-problems/enterprise/entities/attachment'

export class InMemoryAttachmentsRepository implements AttachmentsRepository {
  public items: Attachment[] = []
  // Map to track problemId -> attachmentIds relationship
  public problemAttachmentMap: Map<string, string[]> = new Map()

  async create(
    attachment: Attachment,
    options?: { problemId: string },
  ): Promise<void> {
    this.items.push(attachment)
    if (options?.problemId) {
      this.linkAttachmentToProblem(attachment.id.toValue(), options.problemId)
    }
  }

  async findById(id: string): Promise<Attachment | null> {
    const attachment = this.items.find((item) => item.id.toValue() === id)

    if (!attachment) {
      return null
    }

    return attachment
  }

  async findManyByProblemId(problemId: string): Promise<Attachment[]> {
    const attachmentIds = this.problemAttachmentMap.get(problemId) ?? []
    return this.items.filter((item) =>
      attachmentIds.includes(item.id.toValue()),
    )
  }

  async findOrphanByIdAndOwner(
    id: string,
    ownerId: string,
  ): Promise<Attachment | null> {
    const attachment = this.items.find(
      (item) => item.id.toValue() === id && item.ownerId.toValue() === ownerId,
    )

    return attachment ?? null
  }

  async migrateUserAttachments(
    fromUserId: string,
    toUserId: string,
  ): Promise<void> {
    this.items = this.items.map((attachment) => {
      if (attachment.ownerId.toValue() !== fromUserId) {
        return attachment
      }

      return Attachment.create(
        {
          title: attachment.title,
          link: attachment.link,
          ownerId: new UniqueEntityID(toUserId),
          createdAt: attachment.createdAt,
        },
        attachment.id,
      )
    })
  }

  // Helper method for tests to associate attachments with problems
  linkAttachmentToProblem(attachmentId: string, problemId: string): void {
    const existing = this.problemAttachmentMap.get(problemId) ?? []
    if (!existing.includes(attachmentId)) {
      this.problemAttachmentMap.set(problemId, [...existing, attachmentId])
    }
  }

  async delete(attachment: Attachment): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id === attachment.id)

    this.items.splice(itemIndex, 1)
  }
}
