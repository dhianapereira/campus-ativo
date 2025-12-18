import { UserSummary } from '@/domain/accounts/enterprise/entities/user-summary'

export class UserListPresenter {
  static toHTTP(user: UserSummary) {
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
