import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  ProblemHistory,
  HistoryAction,
} from '@/domain/maintenance-problems/enterprise/entities/problems/problem-history'
import { ProblemHistory as PrismaProblemHistory } from '@prisma/client'

export class PrismaProblemHistoryMapper {
  static toDomain(raw: PrismaProblemHistory): ProblemHistory {
    return ProblemHistory.create(
      {
        problemId: new UniqueEntityID(raw.problemId),
        action: raw.action as HistoryAction,
        userId: new UniqueEntityID(raw.userId),
        userName: raw.userName,
        oldValue: raw.oldValue,
        newValue: raw.newValue,
        note: raw.note,
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(
    problemHistory: ProblemHistory,
  ): Omit<PrismaProblemHistory, 'createdAt'> {
    return {
      id: problemHistory.id.toValue(),
      problemId: problemHistory.problemId.toValue(),
      action: problemHistory.action,
      userId: problemHistory.userId.toValue(),
      userName: problemHistory.userName,
      oldValue: problemHistory.oldValue ?? null,
      newValue: problemHistory.newValue ?? null,
      note: problemHistory.note ?? null,
    }
  }
}
