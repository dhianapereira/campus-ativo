import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Category } from '@/domain/maintenance-problems/enterprise/entities/category'
import { Category as PrismaCategory, Prisma } from '@prisma/client'

export class PrismaCategoryMapper {
  static toDomain(raw: PrismaCategory): Category {
    return Category.create(
      {
        name: raw.name,
        description: raw.description,
        isActive: raw.isActive,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(category: Category): Prisma.CategoryUncheckedCreateInput {
    return {
      id: category.id.toValue(),
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      deletedAt: category.deletedAt,
    }
  }
}
