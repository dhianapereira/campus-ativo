import { User } from '@/domain/accounts/enterprise/entities/user'

export class UserListPresenter {
  static toHTTP(user: User) {
    return {
      id: user.id.toValue(),
      name: user.name,
      email: user.email,
      position: user.position,
      role: user.role,
      isActive: user.isActive,
    }
  }
}