import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { UserRole } from './user'

export interface UserSummaryProps {
  name: string
  position: string
  email: string
  role: UserRole
  isActive: boolean
}

export class UserSummary extends Entity<UserSummaryProps> {
  get name() {
    return this.props.name
  }

  get position() {
    return this.props.position
  }

  get email() {
    return this.props.email
  }

  get role() {
    return this.props.role
  }

  get isActive() {
    return this.props.isActive
  }

  static create(props: UserSummaryProps, id?: UniqueEntityID) {
    const userSummary = new UserSummary(props, id)
    return userSummary
  }
}
