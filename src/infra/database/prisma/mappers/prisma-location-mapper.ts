import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Location } from '@/domain/maintenance-problems/enterprise/entities/location'
import { Location as PrismaLocation, Prisma } from '@prisma/client'

export class PrismaLocationMapper {
  static toDomain(raw: PrismaLocation): Location {
    return Location.create(
      {
        name: raw.name,
        description: raw.description,
        code: raw.code,
        isActive: raw.isActive,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
        isPermanentlyDeleted: raw.isPermanentlyDeleted,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(location: Location): Prisma.LocationUncheckedCreateInput {
    return {
      id: location.id.toValue(),
      name: location.name,
      description: location.description,
      code: location.code,
      isActive: location.isActive,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
      deletedAt: location.deletedAt,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type will be available after Prisma migration
      is_permanently_deleted: location.isPermanentlyDeleted,
    }
  }
}
