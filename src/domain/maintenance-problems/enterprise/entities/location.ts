import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export interface LocationProps {
  name: string
  description?: string | null
  code?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt?: Date | null
  deletedAt?: Date | null
  purgedAt?: Date | null
}

export class Location extends Entity<LocationProps> {
  get name() {
    return this.props.name
  }

  get description() {
    return this.props.description
  }

  get code() {
    return this.props.code
  }

  get isActive() {
    return this.props.isActive
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  get deletedAt() {
    return this.props.deletedAt
  }

  get purgedAt() {
    return this.props.purgedAt
  }

  get isPurged() {
    return this.props.purgedAt !== null && this.props.purgedAt !== undefined
  }

  get isInTrash() {
    return !!this.props.deletedAt && !this.isPurged
  }

  set name(name: string) {
    this.props.name = name
    this.touch()
  }

  set description(description: string | null | undefined) {
    this.props.description = description
    this.touch()
  }

  set code(code: string | null | undefined) {
    this.props.code = code
    this.touch()
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive
    this.touch()
  }

  moveToTrash() {
    this.props.deletedAt = new Date()
    this.touch()
  }

  restoreFromTrash() {
    if (this.isPurged) {
      return
    }

    this.props.deletedAt = null
    this.touch()
  }

  permanentDelete() {
    this.props.deletedAt = this.props.deletedAt ?? new Date()
    this.props.purgedAt = new Date()
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(
    props: Optional<LocationProps, 'createdAt' | 'isActive'>,
    id?: UniqueEntityID,
  ) {
    const location = new Location(
      {
        ...props,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return location
  }
}
