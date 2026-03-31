import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

interface AttachmentProps {
  title: string
  link: string
  ownerId: UniqueEntityID
  createdAt?: Date
}

export class Attachment extends Entity<AttachmentProps> {
  get title() {
    return this.props.title
  }

  get link() {
    return this.props.link
  }

  get ownerId() {
    return this.props.ownerId
  }

  get createdAt() {
    return this.props.createdAt ?? new Date()
  }

  static create(props: AttachmentProps, id?: UniqueEntityID) {
    const attachment = new Attachment(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return attachment
  }
}
