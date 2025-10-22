import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ProblemWithDetails } from '@/domain/maintenance-problems/enterprise/entities/value-objects/problem-with-details'
import { Slug } from '@/domain/maintenance-problems/enterprise/entities/value-objects/slug'
import { Problem as PrismaProblem, Location as PrismaLocation } from '@prisma/client'

type PrismaProblemWithLocation = PrismaProblem & {
  location: PrismaLocation | null
}

export class PrismaProblemWithDetailsMapper {
  static toDomain(raw: PrismaProblemWithLocation): ProblemWithDetails {
    const excerpt = raw.description.substring(0, 120).trimEnd().concat('...')

    return new ProblemWithDetails({
      problemId: new UniqueEntityID(raw.id),
      title: raw.title,
      slug: Slug.create(raw.slug),
      excerpt,
      locationId: raw.locationId ? new UniqueEntityID(raw.locationId) : new UniqueEntityID('deleted'),
      locationName: raw.locationName,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }
}
