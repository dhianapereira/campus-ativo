import { Either, left, right } from '@/core/either'
import { ProblemsRepository } from '../repositories/problems-repository'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Injectable } from '@nestjs/common'

interface DeleteProblemUseCaseRequest {
  reporterId: string
  problemId: string
}

type DeleteProblemUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  object
>

@Injectable()
export class DeleteProblemUseCase {
  constructor(private problemsRepository: ProblemsRepository) {}

  async execute({
    problemId,
    reporterId,
  }: DeleteProblemUseCaseRequest): Promise<DeleteProblemUseCaseResponse> {
    const problem = await this.problemsRepository.findById(problemId)

    if (!problem) {
      return left(new ResourceNotFoundError())
    }

    if (reporterId !== problem.reporterId.toValue()) {
      return left(new NotAllowedError())
    }

    if (!problem.isDeleted || problem.isPurged) {
      return left(new NotAllowedError())
    }

    problem.permanentDelete()
    await this.problemsRepository.save(problem)

    return right({})
  }
}
