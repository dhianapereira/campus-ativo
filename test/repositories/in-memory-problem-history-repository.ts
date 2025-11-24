import { ProblemHistoryRepository } from '@/domain/maintenance-problems/application/repositories/problem-history-repository'
import { ProblemHistory } from '@/domain/maintenance-problems/enterprise/entities/problems/problem-history'

export class InMemoryProblemHistoryRepository
  implements ProblemHistoryRepository
{
  public items: ProblemHistory[] = []

  async create(problemHistory: ProblemHistory): Promise<void> {
    this.items.push(problemHistory)
  }

  async findManyByProblemId(problemId: string): Promise<ProblemHistory[]> {
    const histories = this.items.filter(
      (item) => item.problemId.toValue() === problemId,
    )

    return histories.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )
  }
}
