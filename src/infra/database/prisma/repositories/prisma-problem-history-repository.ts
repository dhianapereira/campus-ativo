import { Injectable } from '@nestjs/common'
import { ProblemHistoryRepository } from '@/domain/maintenance-problems/application/repositories/problem-history-repository'
import { ProblemHistory } from '@/domain/maintenance-problems/enterprise/entities/problems/problem-history'
import { PrismaService } from '../prisma.service'
import { PrismaProblemHistoryMapper } from '../mappers/prisma-problem-history-mapper'

@Injectable()
export class PrismaProblemHistoryRepository implements ProblemHistoryRepository {
  constructor(private prisma: PrismaService) {}

  async create(problemHistory: ProblemHistory): Promise<void> {
    const data = PrismaProblemHistoryMapper.toPrisma(problemHistory)

    await this.prisma.problemHistory.create({
      data,
    })
  }

  async findManyByProblemId(problemId: string): Promise<ProblemHistory[]> {
    const problemHistories = await this.prisma.problemHistory.findMany({
      where: {
        problemId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return problemHistories.map(PrismaProblemHistoryMapper.toDomain)
  }
}
