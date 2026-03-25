import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ProblemStatus } from '@/domain/maintenance-problems/enterprise/entities/problems/problem'
import { ProblemWithDetails } from '@/domain/maintenance-problems/enterprise/entities/value-objects/problem-with-details'
import { Slug } from '@/domain/maintenance-problems/enterprise/entities/value-objects/slug'
import {
  Problem as PrismaProblem,
  Location as PrismaLocation,
  User as PrismaUser,
} from '@prisma/client'

export class PrismaProblemWithDetailsMapper {
  static toDomain(
    raw: PrismaProblem & {
      location: PrismaLocation
      reporter: Pick<PrismaUser, 'email'>
    },
  ): ProblemWithDetails {
    const excerpt = raw.description.substring(0, 120).trimEnd().concat('...')
    return new ProblemWithDetails({
      problemId: new UniqueEntityID(raw.id),
      reporterId: new UniqueEntityID(raw.reporterId),
      reporterEmail: raw.reporter.email,
      title: raw.title,
      slug: Slug.create(raw.slug),
      excerpt,
      locationName: raw.location.name,
      status: raw.status as ProblemStatus,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    })
  }
}
