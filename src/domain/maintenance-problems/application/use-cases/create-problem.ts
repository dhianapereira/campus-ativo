import { Problem } from '@/domain/maintenance-problems/enterprise/entities/problems/problem'
import { ProblemsRepository } from '../repositories/problems-repository'
import { LocationsRepository } from '../repositories/locations-repository'
import { CategoriesRepository } from '../repositories/categories-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { right, left, Either } from '@/core/either'
import { ProblemAttachment } from '../../enterprise/entities/problems/problem-attachment'
import { ProblemAttachmentList } from '../../enterprise/entities/problems/problem-attachment-list'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Injectable } from '@nestjs/common'

interface CreateProblemUseCaseRequest {
  reporterId: string
  locationId: string
  categoryId?: string
  title: string
  description: string
  attachmentsIds: string[]
}

type CreateProblemUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    problem: Problem
  }
>

@Injectable()
export class CreateProblemUseCase {
  constructor(
    private problemsRepository: ProblemsRepository,
    private locationsRepository: LocationsRepository,
    private categoriesRepository: CategoriesRepository,
  ) {}

  async execute({
    reporterId,
    locationId,
    categoryId,
    title,
    description,
    attachmentsIds,
  }: CreateProblemUseCaseRequest): Promise<CreateProblemUseCaseResponse> {
    const location = await this.locationsRepository.findById(locationId)

    if (!location) {
      return left(new ResourceNotFoundError())
    }

    if (categoryId) {
      const category = await this.categoriesRepository.findById(categoryId)

      if (!category) {
        return left(new ResourceNotFoundError())
      }
    }

    const problem = Problem.create({
      reporterId: new UniqueEntityID(reporterId),
      locationId: new UniqueEntityID(locationId),
      categoryId: categoryId
        ? new UniqueEntityID(categoryId)
        : null,
      title,
      description,
    })

    const problemAttachments = attachmentsIds.map((attachmentId) => {
      return ProblemAttachment.create({
        attachmentId: new UniqueEntityID(attachmentId),
        problemId: problem.id,
      })
    })

    problem.attachments = new ProblemAttachmentList(problemAttachments)

    await this.problemsRepository.create(problem)

    return right({
      problem,
    })
  }
}
