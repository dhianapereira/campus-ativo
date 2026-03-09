import { ProblemWithDetails } from '@/domain/maintenance-problems/enterprise/entities/value-objects/problem-with-details'
import { ProblemsRepository } from '../repositories/problems-repository'
import { right, Either } from '@/core/either'
import { Injectable } from '@nestjs/common'

interface FetchProblemsUseCaseRequest {
  page: number
  query?: string
  includeDeleted?: boolean
}

type FetchProblemsUseCaseResponse = Either<
  null,
  {
    problems: ProblemWithDetails[]
  }
>

@Injectable()
export class FetchProblemsUseCase {
  constructor(private problemsRepository: ProblemsRepository) {}

  async execute({
    page,
    query,
    includeDeleted = false,
  }: FetchProblemsUseCaseRequest): Promise<FetchProblemsUseCaseResponse> {
    const problems = await this.problemsRepository.findManyWithDetails({
      page,
      query,
      includeDeleted,
    })

    return right({
      problems,
    })
  }
}
