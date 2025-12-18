import { left, right, Either } from '@/core/either'
import { Problem } from '../../enterprise/entities/problems/problem'
import { ProblemsRepository } from '../repositories/problems-repository'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Injectable } from '@nestjs/common'

interface RestoreProblemFromTrashUseCaseRequest {
  problemId: string
  reporterId: string
}

type RestoreProblemFromTrashUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    problem: Problem
  }
>

@Injectable()
export class RestoreProblemFromTrashUseCase {
  constructor(private problemsRepository: ProblemsRepository) {}

  async execute({
    problemId,
    reporterId,
  }: RestoreProblemFromTrashUseCaseRequest): Promise<RestoreProblemFromTrashUseCaseResponse> {
    const problem = await this.problemsRepository.findById(problemId)

    if (!problem) {
      return left(new ResourceNotFoundError())
    }

    // Only the reporter can restore the problem from trash
    if (reporterId !== problem.reporterId?.toValue()) {
      return left(new NotAllowedError())
    }

    problem.restoreFromTrash()

    await this.problemsRepository.save(problem)

    return right({
      problem,
    })
  }
}
