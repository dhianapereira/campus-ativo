import {
  CategoriesRepository,
  FetchCategoriesParams,
} from '@/domain/maintenance-problems/application/repositories/categories-repository'
import { Category } from '@/domain/maintenance-problems/enterprise/entities/category'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaCategoryMapper } from '../mappers/prisma-category-mapper'

@Injectable()
export class PrismaCategoriesRepository implements CategoriesRepository {
  constructor(private prisma: PrismaService) {}

  async findMany({
    page,
    query,
    isActive,
    includeDeleted,
  }: FetchCategoriesParams): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        purgedAt: null,
        ...(query && {
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        }),
        ...(isActive !== undefined && { isActive }),
        ...(!includeDeleted && { deletedAt: null }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      skip: (page - 1) * 20,
    })

    return categories.map(PrismaCategoryMapper.toDomain)
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
