import {
  ProblemsRepository,
  FetchProblemsParams,
  DuplicateProblemLookup,
} from '@/domain/maintenance-problems/application/repositories/problems-repository'
import {
  Problem,
  ProblemStatus,
} from '@/domain/maintenance-problems/enterprise/entities/problems/problem'
import { DashboardMetrics } from '@/domain/maintenance-problems/enterprise/entities/value-objects/dashboard-metrics'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaProblemMapper } from '../mappers/prisma-problem-mapper'
import { PrismaProblemWithDetailsMapper } from '../mappers/prisma-problem-with-details-mapper'

const DEFAULT_PAGE_SIZE = 20

@Injectable()
export class PrismaProblemsRepository implements ProblemsRepository {
  constructor(private prisma: PrismaService) {}

  private buildProblemWhere({
    query,
    statuses,
    includeDeleted,
    reporterId,
  }: Omit<FetchProblemsParams, 'page' | 'pageSize'>) {
    return {
      purgedAt: null,
      ...(reporterId && { reporterId }),
      ...(!includeDeleted && { deletedAt: null }),
      ...(statuses &&
        statuses.length > 0 && {
        status: {
          in: statuses,
        },
      }),
      ...(query && {
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive' as const,
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    }
  }

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
        deletedAt: null,
        purgedAt: null,
      },
    })

    if (!problem) {
      return null
    }

    return PrismaProblemMapper.toDomain(problem)
  }

  async findDuplicate({
    title,
    description,
    categoryId,
    locationId,
  }: DuplicateProblemLookup): Promise<Problem | null> {
    const problem = await this.prisma.problem.findFirst({
      where: {
        deletedAt: null,
        purgedAt: null,
        categoryId,
        locationId,
        title: {
          equals: title,
          mode: 'insensitive',
        },
        description: {
          equals: description,
          mode: 'insensitive',
        },
      },
    })

    if (!problem) {
      return null
    }

    return PrismaProblemMapper.toDomain(problem)
  }

  async findMany({
    page,
    pageSize = DEFAULT_PAGE_SIZE,
    query,
    statuses,
    includeDeleted = false,
    reporterId,
  }: FetchProblemsParams) {
    const where = this.buildProblemWhere({
      query,
      statuses,
      includeDeleted,
      reporterId,
    })

    const [problems, total] = await Promise.all([
      this.prisma.problem.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.prisma.problem.count({ where }),
    ])

    return {
      items: problems.map(PrismaProblemMapper.toDomain),
      total,
    }
  }

  async findManyWithDetails({
    page,
    pageSize = DEFAULT_PAGE_SIZE,
    query,
    statuses,
    includeDeleted = false,
    reporterId,
  }: FetchProblemsParams) {
    const where = this.buildProblemWhere({
      query,
      statuses,
      includeDeleted,
      reporterId,
    })

    const [problems, total] = await Promise.all([
      this.prisma.problem.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
        include: {
          location: true,
          reporter: {
            select: {
              email: true,
            },
          },
        },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.prisma.problem.count({ where }),
    ])

    return {
      items: problems.map(PrismaProblemWithDetailsMapper.toDomain),
      total,
    }
  }

  async create(problem: Problem): Promise<void> {
    const data = PrismaProblemMapper.toPrisma(problem)

    await this.prisma.$transaction(async (tx) => {
      await tx.problem.create({
        data,
      })

      const attachmentIds = problem.attachments
        .getItems()
        .map((attachment) => attachment.attachmentId.toValue())

      if (attachmentIds.length > 0) {
        await tx.attachment.updateMany({
          where: {
            id: {
              in: attachmentIds,
            },
          },
          data: {
            problemId: problem.id.toValue(),
          },
        })
      }
    })
  }

  async save(problem: Problem): Promise<void> {
    const data = PrismaProblemMapper.toPrisma(problem)

    await this.prisma.$transaction(async (tx) => {
      await tx.problem.update({
        where: {
          id: problem.id.toValue(),
        },
        data,
      })

      const newAttachmentIds = problem.attachments
        .getNewItems()
        .map((attachment) => attachment.attachmentId.toValue())

      if (newAttachmentIds.length > 0) {
        await tx.attachment.updateMany({
          where: {
            id: {
              in: newAttachmentIds,
            },
          },
          data: {
            problemId: problem.id.toValue(),
          },
        })
      }

      const removedAttachmentIds = problem.attachments
        .getRemovedItems()
        .map((attachment) => attachment.attachmentId.toValue())

      if (removedAttachmentIds.length > 0) {
        await tx.attachment.updateMany({
          where: {
            id: {
              in: removedAttachmentIds,
            },
            problemId: problem.id.toValue(),
          },
          data: {
            problemId: null,
          },
        })
      }
    })
  }

  async delete(problem: Problem): Promise<void> {
    const data = PrismaProblemMapper.toPrisma(problem)

    await this.prisma.$transaction(async (tx) => {
      await tx.attachment.updateMany({
        where: {
          problemId: data.id,
        },
        data: {
          problemId: null,
        },
      })

      await tx.problem.delete({
        where: {
          id: data.id,
        },
      })
    })
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const totalProblems = await this.prisma.problem.count({
      where: {
        deletedAt: null,
        purgedAt: null,
      },
    })

    const problemsByStatus = await this.prisma.problem.groupBy({
      by: ['status'],
      where: {
        deletedAt: null,
        purgedAt: null,
      },
      _count: {
        status: true,
      },
    })

    const recentProblems = await this.prisma.problem.count({
      where: {
        deletedAt: null,
        purgedAt: null,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    })

    const finishedProblems = await this.prisma.problem.findMany({
      where: {
        deletedAt: null,
        purgedAt: null,
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
      // The domain does not store a dedicated "finished at" timestamp, so the
      // dashboard uses the last update time of FINISHED problems as a proxy.
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
