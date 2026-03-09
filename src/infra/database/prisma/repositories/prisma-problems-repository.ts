import {
  ProblemsRepository,
  FetchProblemsParams,
} from '@/domain/maintenance-problems/application/repositories/problems-repository'
import {
  Problem,
  ProblemStatus,
} from '@/domain/maintenance-problems/enterprise/entities/problems/problem'
import { ProblemWithDetails } from '@/domain/maintenance-problems/enterprise/entities/value-objects/problem-with-details'
import { DashboardMetrics } from '@/domain/maintenance-problems/enterprise/entities/value-objects/dashboard-metrics'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaProblemMapper } from '../mappers/prisma-problem-mapper'
import { PrismaProblemWithDetailsMapper } from '../mappers/prisma-problem-with-details-mapper'

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

  async findMany({
    page,
    query,
    includeDeleted = false,
  }: FetchProblemsParams): Promise<Problem[]> {
    const problems = await this.prisma.problem.findMany({
      where: {
        ...(!includeDeleted && { deletedAt: null }),
        ...(query && {
          OR: [
            {
              title: {
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
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      skip: (page - 1) * 20,
    })

    return problems.map(PrismaProblemMapper.toDomain)
  }

  async findManyWithDetails({
    page,
    query,
    includeDeleted = false,
  }: FetchProblemsParams): Promise<ProblemWithDetails[]> {
    const problems = await this.prisma.problem.findMany({
      where: {
        ...(!includeDeleted && { deletedAt: null }),
        ...(query && {
          OR: [
            {
              title: {
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
      },
      include: {
        location: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      skip: (page - 1) * 20,
    })

    return problems.map(PrismaProblemWithDetailsMapper.toDomain)
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

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Count total problems (excluding deleted)
    const totalProblems = await this.prisma.problem.count({
      where: {
        deletedAt: null,
      },
    })

    // Count problems by status
    const problemsByStatus = await this.prisma.problem.groupBy({
      by: ['status'],
      where: {
        deletedAt: null,
      },
      _count: {
        status: true,
      },
    })

    // Count recent problems (last 7 days)
    const recentProblems = await this.prisma.problem.count({
      where: {
        deletedAt: null,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    })

    // Calculate average resolution time for finished problems
    const finishedProblems = await this.prisma.problem.findMany({
      where: {
        deletedAt: null,
        status: 'FINISHED',
        updatedAt: {
          not: null,
        },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    })

    let averageResolutionTime: number | undefined

    if (finishedProblems.length > 0) {
      const totalDays = finishedProblems.reduce((sum, problem) => {
        const createdAt = problem.createdAt.getTime()
        const finishedAt = problem.updatedAt!.getTime()
        const diffInDays = (finishedAt - createdAt) / (1000 * 60 * 60 * 24)
        return sum + diffInDays
      }, 0)

      averageResolutionTime = Math.round(totalDays / finishedProblems.length)
    }

    return new DashboardMetrics({
      totalProblems,
      problemsByStatus: problemsByStatus.map((item) => ({
        status: item.status as ProblemStatus,
        count: item._count.status,
      })),
      recentProblems,
      averageResolutionTime,
    })
  }

  async migrateUserProblems(
    fromUserId: string,
    toUserId: string,
  ): Promise<void> {
    await this.prisma.problem.updateMany({
      where: {
        reporterId: fromUserId,
      },
      data: {
        reporterId: toUserId,
      },
    })
  }
}
