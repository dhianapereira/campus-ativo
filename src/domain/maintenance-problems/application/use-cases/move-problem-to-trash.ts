import { left, right, Either } from '@/core/either'
import {
  Problem,
  ProblemStatus,
} from '../../enterprise/entities/problems/problem'
import { ProblemsRepository } from '../repositories/problems-repository'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { ProblemNotDeletableError } from '@/core/errors/problem-not-deletable-error'
import { Injectable } from '@nestjs/common'

interface MoveProblemToTrashUseCaseRequest {
  problemId: string
  reporterId: string
}

type MoveProblemToTrashUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError | ProblemNotDeletableError,
  {
    problem: Problem
  }
>

@Injectable()
export class MoveProblemToTrashUseCase {
  constructor(private problemsRepository: ProblemsRepository) {}

  async execute({
    problemId,
    reporterId,
  }: MoveProblemToTrashUseCaseRequest): Promise<MoveProblemToTrashUseCaseResponse> {
    const problem = await this.problemsRepository.findById(problemId)

    if (!problem) {
      return left(new ResourceNotFoundError())
    }

    // Only the reporter can move the problem to trash
    if (reporterId !== problem.reporterId?.toValue()) {
      return left(new NotAllowedError())
    }

    // Problem can only be moved to trash when status is TO_ANALYSIS
    if (problem.status !== ProblemStatus.TO_ANALYSIS) {
      return left(new ProblemNotDeletableError())
    }

    problem.moveToTrash()

    await this.problemsRepository.save(problem)

    return right({
      problem,
    })
  }
}
