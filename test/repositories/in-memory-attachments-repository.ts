import { AttachmentsRepository } from '@/domain/maintenance-problems/application/repositories/attachments-repository'
import { Attachment } from '@/domain/maintenance-problems/enterprise/entities/attachment'

export class InMemoryAttachmentsRepository implements AttachmentsRepository {
  public items: Attachment[] = []

  async create(attachment: Attachment): Promise<void> {
    this.items.push(attachment)
  }

  async findById(id: string): Promise<Attachment | null> {
    const attachment = this.items.find((item) => item.id.toValue() === id)

    if (!attachment) {
      return null
    }

    return attachment
  }

  async delete(attachment: Attachment): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id === attachment.id)

    this.items.splice(itemIndex, 1)
  }
}
