import { AggregateRoot } from '@/core/entities/aggregate-root'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { ProblemAttachmentList } from '@/domain/maintenance-problems/enterprise/entities/problems/problem-attachment-list'
import { Slug } from '@/domain/maintenance-problems/enterprise/entities/value-objects/slug'

export enum ProblemStatus {
  TO_ANALYSIS = 'TO_ANALYSIS',
  IN_ANALYSIS = 'IN_ANALYSIS',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

export enum MaintenanceType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
}

export interface ProblemProps {
  reporterId: UniqueEntityID | null
  categoryId: UniqueEntityID
  locationId: UniqueEntityID | null
  locationName: string
  title: string
  slug: Slug
  description: string
  status: ProblemStatus
  maintenanceType: MaintenanceType | null
  attachments: ProblemAttachmentList
  createdAt: Date
  updatedAt?: Date | null
  deletedAt?: Date | null
  isPermanentlyDeleted?: boolean
}

export class Problem extends AggregateRoot<ProblemProps> {
  get reporterId() {
    return this.props.reporterId
  }

  get locationId() {
    return this.props.locationId
  }

  set locationId(locationId: UniqueEntityID | null) {
    this.props.locationId = locationId
    this.touch()
  }

  get locationName() {
    return this.props.locationName
  }

  set locationName(locationName: string) {
    this.props.locationName = locationName
    this.touch()
  }

  get categoryId() {
    return this.props.categoryId
  }

  set categoryId(categoryId: UniqueEntityID) {
    this.props.categoryId = categoryId
    this.touch()
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

  get status() {
    return this.props.status
  }

  get maintenanceType() {
    return this.props.maintenanceType
  }

  get deletedAt() {
    return this.props.deletedAt
  }

  get isPermanentlyDeleted() {
    return this.props.isPermanentlyDeleted ?? false
  }

  get isDeleted() {
    return (
      (this.props.deletedAt !== null && this.props.deletedAt !== undefined) ||
      this.isPermanentlyDeleted
    )
  }

  get excerpt() {
    return this.description.substring(0, 120).trimEnd().concat('...')
  }

  changeStatus(status: ProblemStatus) {
    this.props.status = status
    this.touch()
  }

  changeCategory(categoryId: UniqueEntityID) {
    this.props.categoryId = categoryId
    this.touch()
  }

  changeMaintenanceType(maintenanceType: MaintenanceType | null) {
    this.props.maintenanceType = maintenanceType
    this.touch()
  }

  moveToTrash() {
    this.props.deletedAt = new Date()
    this.props.isPermanentlyDeleted = false
    this.touch()
  }

  restoreFromTrash() {
    this.props.deletedAt = null
    this.props.isPermanentlyDeleted = false
    this.touch()
  }

  permanentDelete() {
    this.props.deletedAt = new Date()
    this.props.isPermanentlyDeleted = true
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  set attachments(attachments: ProblemAttachmentList) {
    this.props.attachments = attachments
    this.touch()
  }

  static create(
    props: Optional<
      ProblemProps,
      'createdAt' | 'slug' | 'attachments' | 'status' | 'maintenanceType'
    >,
    id?: UniqueEntityID,
  ) {
    const problem = new Problem(
      {
        ...props,
        slug: props.slug ?? Slug.createFromText(props.title),
        attachments: props.attachments ?? new ProblemAttachmentList(),
        status: props.status ?? ProblemStatus.TO_ANALYSIS,
        maintenanceType: props.maintenanceType ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return problem
  }
}
