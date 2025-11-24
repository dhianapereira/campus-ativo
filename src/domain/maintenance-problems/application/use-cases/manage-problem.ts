import { left, right, Either } from '@/core/either'
import { Problem, ProblemStatus } from '../../enterprise/entities/problems/problem'
import { ProblemsRepository } from '../repositories/problems-repository'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Injectable } from '@nestjs/common'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { RoleHierarchy } from '@/core/utils/role-hierarchy'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { MaintenanceType } from '../../enterprise/entities/problems/problem'
import { ProblemHistoryRepository } from '../repositories/problem-history-repository'
import {
  ProblemHistory,
  HistoryAction,
} from '../../enterprise/entities/problems/problem-history'
import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository'

interface ManageProblemUseCaseRequest {
  problemId: string
  executorId: string
  executorRole: UserRole
  status?: ProblemStatus
  categoryId?: string
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
    categoryId,
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

    // Track changes and create history records
    if (status !== undefined && status !== problem.status) {
      const oldStatus = problem.status
      problem.changeStatus(status)

      const history = ProblemHistory.create({
        problemId: problem.id,
        action: HistoryAction.STATUS_CHANGED,
        userId: executor.id,
        userName: executor.name,
        oldValue: oldStatus,
        newValue: status,
      })

      await this.problemHistoryRepository.create(history)
    }

    if (categoryId !== undefined) {
      const newCategoryId = new UniqueEntityID(categoryId)
      if (
        !problem.categoryId ||
        problem.categoryId.toValue() !== categoryId
      ) {
        const oldCategoryId = problem.categoryId?.toValue() ?? null
        problem.changeCategory(newCategoryId)

        const history = ProblemHistory.create({
          problemId: problem.id,
          action: HistoryAction.CATEGORY_CHANGED,
          userId: executor.id,
          userName: executor.name,
          oldValue: oldCategoryId,
          newValue: categoryId,
        })

        await this.problemHistoryRepository.create(history)
      }
    }

    if (maintenanceType !== undefined) {
      if (problem.maintenanceType !== maintenanceType) {
        const oldType = problem.maintenanceType
        problem.changeMaintenanceType(maintenanceType)

        const history = ProblemHistory.create({
          problemId: problem.id,
          action: HistoryAction.MAINTENANCE_TYPE_CHANGED,
          userId: executor.id,
          userName: executor.name,
          oldValue: oldType,
          newValue: maintenanceType,
        })

        await this.problemHistoryRepository.create(history)
      }
    }

    if (note !== undefined && note.trim().length > 0) {
      const history = ProblemHistory.create({
        problemId: problem.id,
        action: HistoryAction.NOTE_ADDED,
        userId: executor.id,
        userName: executor.name,
        note,
      })

      await this.problemHistoryRepository.create(history)
    }

    await this.problemsRepository.save(problem)

    return right({
      problem,
    })
  }
}
