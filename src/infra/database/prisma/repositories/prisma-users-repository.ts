import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import {
  UsersRepository,
  FetchUsersParams,
} from '@/domain/accounts/application/repositories/users-repository'
import { User } from '@/domain/accounts/enterprise/entities/user'
import { UserSummary } from '@/domain/accounts/enterprise/entities/user-summary'
import { PrismaUserMapper } from '../mappers/prisma-user-mapper'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

const DEFAULT_PAGE_SIZE = 20

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async findSystemUser(): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        role: UserRole.SYSTEM,
      },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async findManyByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) {
      return []
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    })

    return users.map(PrismaUserMapper.toDomain)
  }

  async create(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user)

    await this.prisma.user.create({
      data,
    })
  }

  async save(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user)

    await this.prisma.user.update({
      where: {
        id: user.id.toValue(),
      },
      data,
    })
  }

  async delete(user: User): Promise<void> {
    await this.prisma.user.delete({
      where: {
        id: user.id.toValue(),
      },
    })
  }

  async findByIdForListing(id: string): Promise<UserSummary | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        role: {
          not: UserRole.SYSTEM,
        },
      },
      select: {
        id: true,
        name: true,
        position: true,
        email: true,
        role: true,
        isActive: true,
      },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toUserSummary(user)
  }

  async findMany(params?: FetchUsersParams): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        ...(params?.query && {
          OR: [
            {
              name: {
                contains: params.query,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: params.query,
                mode: 'insensitive',
              },
            },
            {
              position: {
                contains: params.query,
                mode: 'insensitive',
              },
            },
          ],
        }),
        role: {
          not: UserRole.SYSTEM,
        },
        ...(params?.isActive !== undefined && { isActive: params.isActive }),
      },
      orderBy: [
        {
          isActive: 'desc',
        },
        {
          name: 'asc',
        },
      ],
    })

    return users.map(PrismaUserMapper.toDomain)
  }

  async findManyForListing(params?: FetchUsersParams) {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE
    const where = {
      ...(params?.query && {
        OR: [
          {
            name: {
              contains: params.query,
              mode: 'insensitive' as const,
            },
          },
          {
            email: {
              contains: params.query,
              mode: 'insensitive' as const,
            },
          },
          {
            position: {
              contains: params.query,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
      role: params?.includeAdmins
        ? {
            not: UserRole.SYSTEM,
          }
        : {
            notIn: [UserRole.SYSTEM, UserRole.ADMIN],
          },
      ...(params?.isActive !== undefined && { isActive: params.isActive }),
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: [
          {
            isActive: 'desc',
          },
          {
            name: 'asc',
          },
        ],
        select: {
          id: true,
          name: true,
          position: true,
          email: true,
          role: true,
          isActive: true,
        },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.prisma.user.count({ where }),
    ])

    return {
      items: users.map(PrismaUserMapper.toUserSummary),
      total,
    }
  }
}
