import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  ProblemHistory,
  HistoryAction,
  ProblemHistoryChange,
} from '@/domain/maintenance-problems/enterprise/entities/problems/problem-history'
import {
  ProblemHistory as PrismaProblemHistory,
  HistoryAction as PrismaHistoryAction,
  Prisma,
} from '@prisma/client'

export class PrismaProblemHistoryMapper {
  static toDomain(raw: PrismaProblemHistory): ProblemHistory {
    const rawWithChanges = raw as PrismaProblemHistory & {
      changes?: Prisma.JsonValue | null
    }

    return ProblemHistory.create(
      {
        problemId: new UniqueEntityID(raw.problemId),
        action: raw.action as HistoryAction,
        userId: new UniqueEntityID(raw.userId),
        note: raw.note,
        changes:
          (rawWithChanges.changes as ProblemHistoryChange[] | null) ?? null,
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(
    problemHistory: ProblemHistory,
  ): Prisma.ProblemHistoryUncheckedCreateInput {
    return {
      id: problemHistory.id.toValue(),
      problemId: problemHistory.problemId.toValue(),
      action: problemHistory.action as PrismaHistoryAction,
      userId: problemHistory.userId.toValue(),
      note: problemHistory.note ?? null,
      changes: problemHistory.changes
        ? (problemHistory.changes as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    }
  }
}
