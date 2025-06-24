import { PaginationParams } from '@/core/repositories/pagination-params'
import { ProblemsRepository } from '@/domain/maintenance-problems/application/repositories/problems-repository'
import { Problem } from '@/domain/maintenance-problems/enterprise/entities/problems/problem'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaProblemMapper } from '../mappers/prisma-problem-mapper'

@Injectable()
export class PrismaProblemsRepository implements ProblemsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Problem | null> {
    const problem = await this.prisma.problem.findUnique({
      where: {
        id,
      },
    })

    if (!problem) {
      return null
    }

    return PrismaProblemMapper.toDomain(problem)
  }

  async findBySlug(slug: string): Promise<Problem | null> {
    const problem = await this.prisma.problem.findUnique({
      where: {
        slug,
      },
    })

    if (!problem) {
      return null
    }

    return PrismaProblemMapper.toDomain(problem)
  }

  async findMany({ page }: PaginationParams): Promise<Problem[]> {
    const problems = await this.prisma.problem.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      skip: (page - 1) * 20,
    })

    return problems.map(PrismaProblemMapper.toDomain)
  }

  async create(problem: Problem): Promise<void> {
    const data = PrismaProblemMapper.toPrisma(problem)

    await this.prisma.problem.create({
      data,
    })
  }

  async save(problem: Problem): Promise<void> {
    const data = PrismaProblemMapper.toPrisma(problem)

    await this.prisma.problem.update({
      where: {
        id: problem.id.toValue(),
      },
      data,
    })
  }

  async delete(problem: Problem): Promise<void> {
    const data = PrismaProblemMapper.toPrisma(problem)

    await this.prisma.problem.delete({
      where: {
        id: data.id,
      },
    })
  }
}
