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

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(
    props: Optional<LocationProps, 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    const location = new Location(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return location
  }
}
