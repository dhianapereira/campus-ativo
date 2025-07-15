import { Injectable } from '@nestjs/common'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  User,
  UserProps,
  UserRole,
} from '@/domain/accounts/enterprise/entities/user'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaUserMapper } from '@/infra/database/prisma/mappers/prisma-user-mapper'
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

@Injectable()
export class UserFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaUser(data: Partial<UserProps> = {}): Promise<User> {
    const user = makeUser(data)

    const prismaUser = await this.prisma.user.create({
      data: PrismaUserMapper.toPrisma(user),
    })

    return PrismaUserMapper.toDomain(prismaUser)
  }
}
