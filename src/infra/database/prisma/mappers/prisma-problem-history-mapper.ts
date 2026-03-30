import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  ProblemHistory,
  ProblemHistoryAction,
  ProblemHistoryChangeField,
} from '@/domain/maintenance-problems/enterprise/entities/problems/problem-history'
import {
  ProblemHistory as PrismaProblemHistory,
  ProblemHistoryAction as PrismaProblemHistoryAction,
  ProblemHistoryChangeField as PrismaProblemHistoryChangeField,
  Prisma,
} from '@prisma/client'

export class PrismaProblemHistoryMapper {
  static toDomain(
    raw: PrismaProblemHistory & {
      changes?: Array<{
        field: PrismaProblemHistoryChangeField
        oldValue: string | null
        newValue: string | null
        position: number
      }>
    },
  ): ProblemHistory {
    return ProblemHistory.create(
      {
        problemId: new UniqueEntityID(raw.problemId),
        action: raw.action as ProblemHistoryAction,
        userId: new UniqueEntityID(raw.userId),
        note: raw.note,
        changes:
          raw.changes?.map((change) => ({
            field: PrismaProblemHistoryMapper.toDomainField(change.field),
            oldValue: change.oldValue,
            newValue: change.newValue,
          })) ?? null,
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(
    problemHistory: ProblemHistory,
  ): Prisma.ProblemHistoryCreateInput {
    return {
      id: problemHistory.id.toValue(),
      problem: {
        connect: {
          id: problemHistory.problemId.toValue(),
        },
      },
      action: problemHistory.action as PrismaProblemHistoryAction,
      user: {
        connect: {
          id: problemHistory.userId.toValue(),
        },
      },
      note: problemHistory.note ?? null,
      changes: problemHistory.changes?.length
        ? {
            create: problemHistory.changes.map((change, index) => ({
              position: index,
              field: PrismaProblemHistoryMapper.toPrismaField(change.field),
              oldValue: change.oldValue ?? null,
              newValue: change.newValue ?? null,
            })),
          }
        : undefined,
    }
  }

  private static toDomainField(
    field: PrismaProblemHistoryChangeField,
  ): ProblemHistoryChangeField {
    switch (field) {
      case PrismaProblemHistoryChangeField.STATUS:
        return ProblemHistoryChangeField.STATUS
      case PrismaProblemHistoryChangeField.MAINTENANCE_TYPE:
        return ProblemHistoryChangeField.MAINTENANCE_TYPE
      case PrismaProblemHistoryChangeField.NOTE:
        return ProblemHistoryChangeField.NOTE
    }
  }

  private static toPrismaField(
    field: ProblemHistoryChangeField,
  ): PrismaProblemHistoryChangeField {
    switch (field) {
      case ProblemHistoryChangeField.STATUS:
        return PrismaProblemHistoryChangeField.STATUS
      case ProblemHistoryChangeField.MAINTENANCE_TYPE:
        return PrismaProblemHistoryChangeField.MAINTENANCE_TYPE
      case ProblemHistoryChangeField.NOTE:
        return PrismaProblemHistoryChangeField.NOTE
    }
  }
}
