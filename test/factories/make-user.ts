import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  User,
  UserProps,
  UserRole,
} from '@/domain/accounts/enterprise/entities/user'
import { faker } from '@faker-js/faker'

export function makeUser(
  override: Partial<UserProps> = {},
  id?: UniqueEntityID,
) {
  const user = User.create(
    {
      name: faker.person.fullName(),
      position: faker.person.jobTitle(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      role: UserRole.REPORTER,
      isActive: true,
      ...override,
    },
    id,
  )

  return user
}
