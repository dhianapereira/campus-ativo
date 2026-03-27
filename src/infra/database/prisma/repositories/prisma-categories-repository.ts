import {
  CategoriesRepository,
  FetchCategoriesParams,
} from '@/domain/maintenance-problems/application/repositories/categories-repository'
import { Category } from '@/domain/maintenance-problems/enterprise/entities/category'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaCategoryMapper } from '../mappers/prisma-category-mapper'

const DEFAULT_PAGE_SIZE = 20

@Injectable()
export class PrismaCategoriesRepository implements CategoriesRepository {
  constructor(private prisma: PrismaService) {}

  async findMany({
    page,
    query,
    isActive,
    includeDeleted,
    pageSize = DEFAULT_PAGE_SIZE,
  }: FetchCategoriesParams) {
    const where = {
      purgedAt: null,
      ...(query && {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive' as const,
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
      ...(!includeDeleted && { deletedAt: null }),
    }

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.prisma.category.count({ where }),
    ])

    return {
      items: categories.map(PrismaCategoryMapper.toDomain),
      total,
    }
  }

  async findById(id: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
    })

    if (!category) {
      return null
    }

    return PrismaCategoryMapper.toDomain(category)
  }

  async findByName(name: string): Promise<Category | null> {
    const category = await this.prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        deletedAt: null,
        purgedAt: null,
      },
    })

    if (!category) {
      return null
    }

    return PrismaCategoryMapper.toDomain(category)
  }

  async create(category: Category): Promise<void> {
    const data = PrismaCategoryMapper.toPrisma(category)

    await this.prisma.category.create({
      data,
    })
  }

  async save(category: Category): Promise<void> {
    const data = PrismaCategoryMapper.toPrisma(category)

    await this.prisma.category.update({
      where: {
        id: category.id.toValue(),
      },
      data,
    })
  }

  async delete(category: Category): Promise<void> {
    await this.prisma.category.delete({
      where: {
        id: category.id.toValue(),
      },
    })
  }

  async hasAssociatedProblems(categoryId: string): Promise<boolean> {
    const count = await this.prisma.problem.count({
      where: {
        categoryId,
      },
    })

    return count > 0
  }
}
