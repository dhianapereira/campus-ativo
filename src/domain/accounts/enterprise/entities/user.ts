import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export enum UserRole {
  SYSTEM = 'SYSTEM',
  REPORTER = 'REPORTER',
  MANAGER = 'MANAGER',
  DIRECTOR = 'DIRECTOR',
  ADMIN = 'ADMIN',
}

export interface UserProps {
  name: string
  position: string
  email: string
  password: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt?: Date | null
}

export class User extends Entity<UserProps> {
  get name() {
    return this.props.name
  }

  get position() {
    return this.props.position
  }

  get email() {
    return this.props.email
  }

  get password() {
    return this.props.password
  }

  get role() {
    return this.props.role
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

  changeRole(newRole: UserRole): void {
    this.props.role = newRole
    this.touch()
  }

  changePassword(newPassword: string): void {
    this.props.password = newPassword
    this.touch()
  }

  updateProfile(name: string, position: string): void {
    this.props.name = name
    this.props.position = position
    this.touch()
  }

  changeStatus(isActive: boolean): void {
    this.props.isActive = isActive
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(props: Optional<UserProps, 'createdAt'>, id?: UniqueEntityID) {
    const user = new User(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return user
  }
}
