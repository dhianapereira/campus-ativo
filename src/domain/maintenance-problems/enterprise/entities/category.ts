import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export interface CategoryProps {
  name: string
  description?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt?: Date | null
  deletedAt?: Date | null
}

export class Category extends Entity<CategoryProps> {
  get name() {
    return this.props.name
  }

  get description() {
    return this.props.description
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

  get isInTrash() {
    return !!this.props.deletedAt
  }

  set name(name: string) {
    this.props.name = name
    this.touch()
  }

  set description(description: string | null | undefined) {
    this.props.description = description
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
    this.props.deletedAt = null
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(
    props: Optional<CategoryProps, 'createdAt' | 'isActive'>,
    id?: UniqueEntityID,
  ) {
    const category = new Category(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        isActive: props.isActive ?? true,
      },
      id,
    )

    return category
  }
}
