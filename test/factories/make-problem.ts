import { faker } from "@faker-js/faker";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import {
  Problem,
  ProblemProps,
} from "@/domain/maintenance-problems/enterprise/entities/problems/problem";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { PrismaProblemMapper } from "@/infra/database/prisma/mappers/prisma-problem-mapper";

export function makeProblem(
  override: Partial<ProblemProps> = {},
  id?: UniqueEntityID,
) {
  const problem = Problem.create(
    {
      reporterId: new UniqueEntityID(),
      locationId: new UniqueEntityID(),
      categoryId: new UniqueEntityID(),
      title: faker.lorem.sentence(),
      description: faker.lorem.text(),
      ...override,
    },
    id,
  );

  return problem;
}

@Injectable()
export class ProblemFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaProblem(data: Partial<ProblemProps> = {}): Promise<Problem> {
    const problem = makeProblem(data);

    await this.prisma.problem.create({
      data: PrismaProblemMapper.toPrisma(problem),
    });

    return problem;
  }
}
