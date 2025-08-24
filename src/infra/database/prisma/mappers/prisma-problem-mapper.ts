import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Problem } from "@/domain/maintenance-problems/enterprise/entities/problems/problem";
import { Slug } from "@/domain/maintenance-problems/enterprise/entities/value-objects/slug";
import { Problem as PrismaProblem, Prisma } from "@prisma/client";

export class PrismaProblemMapper {
  static toDomain(raw: PrismaProblem): Problem {
    return Problem.create(
      {
        reporterId: new UniqueEntityID(raw.reporterId),
        locationId: new UniqueEntityID(raw.locationId),
        categoryId: new UniqueEntityID(raw.categoryId),
        slug: Slug.create(raw.slug),
        title: raw.title,
        description: raw.description,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(problem: Problem): Prisma.ProblemUncheckedCreateInput {
    return {
      id: problem.id.toValue(),
      reporterId: problem.reporterId.toValue(),
      categoryId: problem.categoryId.toValue(),
      locationId: problem.locationId.toValue(),
      title: problem.title,
      description: problem.description,
      slug: problem.slug.value,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
    };
  }
}
