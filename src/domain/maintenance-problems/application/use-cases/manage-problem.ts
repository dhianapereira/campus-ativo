import { left, right, Either } from '@/core/either'
import {
  Problem,
  ProblemStatus,
  MaintenanceType,
} from '../../enterprise/entities/problems/problem'
import { ProblemsRepository } from '../repositories/problems-repository'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Injectable } from '@nestjs/common'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { RoleHierarchy } from '@/core/utils/role-hierarchy'
import { ProblemHistoryRepository } from '../repositories/problem-history-repository'
import {
  ProblemHistory,
  HistoryAction,
  HistoryChangeField,
  ProblemHistoryChange,
} from '../../enterprise/entities/problems/problem-history'
import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository'

interface ManageProblemUseCaseRequest {
  problemId: string
  executorId: string
  executorRole: UserRole
  status?: ProblemStatus
  maintenanceType?: MaintenanceType | null
  note?: string
}

type ManageProblemUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    problem: Problem
  }
>

@Injectable()
export class ManageProblemUseCase {
  constructor(
    private problemsRepository: ProblemsRepository,
    private problemHistoryRepository: ProblemHistoryRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    problemId,
    executorId,
    executorRole,
    status,
    maintenanceType,
    note,
  }: ManageProblemUseCaseRequest): Promise<ManageProblemUseCaseResponse> {
    // Only MANAGER or higher can manage problem
    if (!RoleHierarchy.hasPermission(executorRole, UserRole.MANAGER)) {
      return left(new NotAllowedError())
    }

    const problem = await this.problemsRepository.findById(problemId)

    if (!problem) {
      return left(new ResourceNotFoundError())
    }

    const executor = await this.usersRepository.findById(executorId)

    if (!executor) {
      return left(new ResourceNotFoundError())
    }

    const historyChanges: ProblemHistoryChange[] = []
    const problemHistory =
      note !== undefined
        ? await this.problemHistoryRepository.findManyByProblemId(problemId)
        : []
    const currentNote =
      note !== undefined
        ? this.getLatestNote(problemHistory)
        : undefined
    const normalizedNote = note?.trim()
    const nextNote = note === undefined
      ? undefined
      : normalizedNote || null

    if (status !== undefined && status !== problem.status) {
      const oldStatus = problem.status
      problem.changeStatus(status)
      historyChanges.push({
        field: HistoryChangeField.STATUS,
        oldValue: oldStatus,
        newValue: status,
      })
    }

    if (maintenanceType !== undefined) {
      if (problem.maintenanceType !== maintenanceType) {
        const oldType = problem.maintenanceType
        problem.changeMaintenanceType(maintenanceType)
        historyChanges.push({
          field: HistoryChangeField.MAINTENANCE_TYPE,
          oldValue: oldType,
          newValue: maintenanceType,
        })
      }
    }

    if (note !== undefined && nextNote !== currentNote) {
      historyChanges.push({
        field: HistoryChangeField.NOTE,
        oldValue: currentNote ?? null,
        newValue: nextNote,
      })
    }

    if (historyChanges.length > 0) {
      const history = ProblemHistory.create({
        problemId: problem.id,
        action: this.getHistoryAction(historyChanges),
        userId: executor.id,
        note: nextNote ?? null,
        changes: historyChanges,
      })

      await this.problemHistoryRepository.create(history)
    }

    await this.problemsRepository.save(problem)

    return right({
      problem,
    })
  }

  private getHistoryAction(changes: ProblemHistoryChange[]) {
    if (changes.length > 1) {
      return HistoryAction.UPDATED
    }

    switch (changes[0].field) {
      case HistoryChangeField.STATUS:
        return HistoryAction.STATUS_CHANGED
      case HistoryChangeField.MAINTENANCE_TYPE:
        return HistoryAction.MAINTENANCE_TYPE_CHANGED
      case HistoryChangeField.NOTE:
        return changes[0].newValue
          ? HistoryAction.NOTE_ADDED
          : HistoryAction.UPDATED
    }
  }

  private getLatestNote(
    history: {
      note?: string | null
      changes?: ProblemHistoryChange[] | null
    }[],
  ) {
    for (const entry of history) {
      const noteChange = entry.changes?.find(
        (change) => change.field === HistoryChangeField.NOTE,
      )

      if (noteChange) {
        return typeof noteChange.newValue === 'string'
          ? noteChange.newValue.trim()
          : null
      }

      if (typeof entry.note === 'string') {
        return entry.note.trim()
      }
    }

    return null
  }
}
