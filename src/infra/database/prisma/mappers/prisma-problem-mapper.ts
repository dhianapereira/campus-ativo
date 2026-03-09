import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Problem,
  ProblemStatus,
  MaintenanceType,
} from '@/domain/maintenance-problems/enterprise/entities/problems/problem'
import { Slug } from '@/domain/maintenance-problems/enterprise/entities/value-objects/slug'
import { Problem as PrismaProblem, Prisma } from '@prisma/client'

export class PrismaProblemMapper {
  static toDomain(raw: PrismaProblem): Problem {
    return Problem.create(
      {
        reporterId: raw.reporterId ? new UniqueEntityID(raw.reporterId) : null,
        locationId: raw.locationId ? new UniqueEntityID(raw.locationId) : null,
        locationName: raw.locationName,
        categoryId: raw.categoryId ? new UniqueEntityID(raw.categoryId) : null,
        slug: Slug.create(raw.slug),
        title: raw.title,
        description: raw.description,
        status: raw.status as ProblemStatus,
        maintenanceType: raw.maintenanceType as MaintenanceType | null,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
        purgedAt: raw.purgedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(problem: Problem): Prisma.ProblemUncheckedCreateInput {
    return {
      id: problem.id.toValue(),
      reporterId: problem.reporterId?.toValue() ?? null,
      categoryId: problem.categoryId?.toValue() ?? null,
      locationId: problem.locationId?.toValue() ?? null,
      locationName: problem.locationName,
      title: problem.title,
      description: problem.description,
      slug: problem.slug.value,
      status: problem.status,
      maintenanceType: problem.maintenanceType,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
      deletedAt: problem.deletedAt,
      purgedAt: problem.purgedAt,
    }
  }
}
