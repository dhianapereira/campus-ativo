import { AggregateRoot } from '@/core/entities/aggregate-root'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { ProblemAttachmentList } from '@/domain/maintenance-problems/enterprise/entities/problems/problem-attachment-list'
import { Slug } from '@/domain/maintenance-problems/enterprise/entities/value-objects/slug'

export interface ProblemProps {
  reporterId: UniqueEntityID
  title: string
  slug: Slug
  description: string
  attachments: ProblemAttachmentList
  createdAt: Date
  updatedAt?: Date | null
}

export class Problem extends AggregateRoot<ProblemProps> {
  get reporterId() {
    return this.props.reporterId
  }

  get title() {
    return this.props.title
  }

  set title(title: string) {
    this.props.title = title
    this.props.slug = Slug.createFromText(title)

    this.touch()
  }

  get description() {
    return this.props.description
  }

  set description(description: string) {
    this.props.description = description
    this.touch()
  }

  get slug() {
    return this.props.slug
  }

  get attachments() {
    return this.props.attachments
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  get excerpt() {
    return this.description.substring(0, 120).trimEnd().concat('...')
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  set attachments(attachments: ProblemAttachmentList) {
    this.props.attachments = attachments
    this.touch()
  }

  static create(
    props: Optional<ProblemProps, 'createdAt' | 'slug' | 'attachments'>,
    id?: UniqueEntityID,
  ) {
    const problem = new Problem(
      {
        ...props,
        slug: props.slug ?? Slug.createFromText(props.title),
        attachments: props.attachments ?? new ProblemAttachmentList(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return problem
  }
}
