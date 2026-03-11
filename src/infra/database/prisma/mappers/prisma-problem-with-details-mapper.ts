import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ProblemWithDetails } from '@/domain/maintenance-problems/enterprise/entities/value-objects/problem-with-details'
import { Slug } from '@/domain/maintenance-problems/enterprise/entities/value-objects/slug'
import { Problem as PrismaProblem } from '@prisma/client'

export class PrismaProblemWithDetailsMapper {
  static toDomain(raw: PrismaProblem): ProblemWithDetails {
    const excerpt = raw.description.substring(0, 120).trimEnd().concat('...')

    return new ProblemWithDetails({
      problemId: new UniqueEntityID(raw.id),
      reporterId: raw.reporterId
        ? new UniqueEntityID(raw.reporterId)
        : null,
      title: raw.title,
      slug: Slug.create(raw.slug),
      excerpt,
      locationId: raw.locationId
        ? new UniqueEntityID(raw.locationId)
        : new UniqueEntityID('deleted'),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    })
  }
}
