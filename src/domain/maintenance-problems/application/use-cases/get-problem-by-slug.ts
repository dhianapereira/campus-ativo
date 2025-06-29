import { ProblemsRepository } from '../repositories/problems-repository'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Problem } from '../../enterprise/entities/problems/problem'
import { Injectable } from '@nestjs/common'

interface GetProblemBySlugUseCaseRequest {
  slug: string
}

type GetProblemBySlugUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    problem: Problem
  }
>

@Injectable()
export class GetProblemBySlugUseCase {
  constructor(private problemsRepository: ProblemsRepository) {}

  async execute({
    slug,
  }: GetProblemBySlugUseCaseRequest): Promise<GetProblemBySlugUseCaseResponse> {
    const problem = await this.problemsRepository.findBySlug(slug)

    if (!problem) {
      return left(new ResourceNotFoundError())
    }

    return right({
      problem,
    })
  }
}
