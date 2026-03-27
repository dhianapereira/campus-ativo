import { ProblemWithDetails } from '@/domain/maintenance-problems/enterprise/entities/value-objects/problem-with-details'
import { ProblemStatus } from '@/domain/maintenance-problems/enterprise/entities/problems/problem'
import { ProblemsRepository } from '../repositories/problems-repository'
import { right, Either } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { PaginationParams } from '@/core/repositories/pagination-params'

interface FetchProblemsUseCaseRequest extends PaginationParams {
  query?: string
  statuses?: ProblemStatus[]
  includeDeleted?: boolean
  reporterId?: string
}

type FetchProblemsUseCaseResponse = Either<
  null,
  {
    problems: ProblemWithDetails[]
    total: number
  }
>

@Injectable()
export class FetchProblemsUseCase {
  constructor(private problemsRepository: ProblemsRepository) {}

  async execute({
    page,
    pageSize,
    query,
    statuses,
    includeDeleted = false,
    reporterId,
  }: FetchProblemsUseCaseRequest): Promise<FetchProblemsUseCaseResponse> {
    const { items: problems, total } =
      await this.problemsRepository.findManyWithDetails({
        page,
        pageSize,
        query,
        statuses,
        includeDeleted,
        reporterId,
      })

    return right({
      problems,
      total,
    })
  }
}
