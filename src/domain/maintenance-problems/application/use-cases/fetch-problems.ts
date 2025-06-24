import { Problem } from '@/domain/maintenance-problems/enterprise/entities/problems/problem'
import { ProblemsRepository } from '../repositories/problems-repository'
import { right, Either } from '@/core/either'
import { Injectable } from '@nestjs/common'

interface FetchRecentProblemsUseCaseRequest {
  page: number
}

type FetchRecentProblemsUseCaseResponse = Either<
  null,
  {
    problems: Problem[]
  }
>

@Injectable()
export class FetchRecentProblemsUseCase {
  constructor(private problemsRepository: ProblemsRepository) {}

  async execute({
    page,
  }: FetchRecentProblemsUseCaseRequest): Promise<FetchRecentProblemsUseCaseResponse> {
    const problems = await this.problemsRepository.findMany({ page })

    return right({
      problems,
    })
  }
}
