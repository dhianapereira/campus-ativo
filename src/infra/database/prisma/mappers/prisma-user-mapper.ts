import { User as PrismaUser, UserRole as PrismaUserRole, Prisma } from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { User, UserRole } from '@/domain/accounts/enterprise/entities/user'

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): User {
    return User.create(
      {
        name: raw.name,
        position: raw.position,
        email: raw.email,
        password: raw.password,
        role: raw.role as UserRole,
        isActive: raw.isActive,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(user: User): Prisma.UserUncheckedCreateInput {
    return {
      id: user.id.toValue(),
      name: user.name,
      position: user.position,
      email: user.email,
      password: user.password,
      role: user.role as PrismaUserRole,
      isActive: user.isActive,
    }
  }
}