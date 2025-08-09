import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

export enum UserRole {
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

  static create(props: UserProps, id?: UniqueEntityID) {
    const user = new User(props, id)

    return user
  }
}