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

  set role(role: UserRole) {
    this.props.role = role
  }

  canChangeRoleOf(targetUser: User): boolean {
    const roleHierarchy = {
      [UserRole.ADMIN]: 4,
      [UserRole.DIRECTOR]: 3,
      [UserRole.MANAGER]: 2,
      [UserRole.REPORTER]: 1,
    }

    const currentUserLevel = roleHierarchy[this.role]
    const targetUserLevel = roleHierarchy[targetUser.role]

    // Admin can change any role
    if (this.role === UserRole.ADMIN) {
      return true
    }

    // Director can change roles below their level
    if (this.role === UserRole.DIRECTOR) {
      return targetUserLevel < currentUserLevel
    }

    // Manager and Reporter cannot change roles
    return false
  }

  static create(props: UserProps, id?: UniqueEntityID) {
    const user = new User(props, id)

    return user
  }
}
