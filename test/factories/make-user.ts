import { faker } from '@faker-js/faker'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  User,
  UserProps,
  UserRole,
} from '@/domain/accounts/enterprise/entities/user'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaUserMapper } from '@/infra/database/prisma/mappers/prisma-user-mapper'

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
      isActive: true, // Default to active in tests for convenience
      ...override,
    },
    id,
  )

  return user
}

export function makeSystemUser(
  override: Partial<UserProps> = {},
  id?: UniqueEntityID,
) {
  return makeUser(
    {
      name: 'Sistema IFAL Arapiraca',
      position: 'Usuario do Sistema',
      email: 'sistema@ifal.edu.br',
      role: UserRole.SYSTEM,
      isActive: false,
      ...override,
    },
    id,
  )
}

@Injectable()
export class UserFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaUser(data: Partial<UserProps> = {}): Promise<User> {
    const user = makeUser(data)

    await this.prisma.user.create({
      data: PrismaUserMapper.toPrisma(user),
    })

    return user
  }
}
