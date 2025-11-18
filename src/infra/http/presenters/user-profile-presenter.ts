import { User } from '@/domain/accounts/enterprise/entities/user'

export class UserProfilePresenter {
  static toHTTP(user: User) {
    return {
      id: user.id.toValue(),
      name: user.name,
      email: user.email,
      position: user.position,
    }
  }
}