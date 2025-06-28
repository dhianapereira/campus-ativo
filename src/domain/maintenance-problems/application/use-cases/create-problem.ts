import { Problem } from '@/domain/maintenance-problems/enterprise/entities/problems/problem'
import { ProblemsRepository } from '../repositories/problems-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { right, Either } from '@/core/either'
import { ProblemAttachment } from '../../enterprise/entities/problems/problem-attachment'
import { ProblemAttachmentList } from '../../enterprise/entities/problems/problem-attachment-list'
import { Injectable } from '@nestjs/common'

interface CreateProblemUseCaseRequest {
  reporterId: string
  locationId: string
  categoryId: string
  title: string
  description: string
  attachmentsIds: string[]
}

type CreateProblemUseCaseResponse = Either<
  null,
  {
    problem: Problem
  }
>

@Injectable()
export class CreateProblemUseCase {
  constructor(private problemsRepository: ProblemsRepository) {}

  async execute({
    reporterId,
    locationId,
    categoryId,
    title,
    description,
    attachmentsIds,
  }: CreateProblemUseCaseRequest): Promise<CreateProblemUseCaseResponse> {
    const problem = Problem.create({
      reporterId: new UniqueEntityID(reporterId),
      locationId: new UniqueEntityID(locationId),
      categoryId: new UniqueEntityID(categoryId),
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
