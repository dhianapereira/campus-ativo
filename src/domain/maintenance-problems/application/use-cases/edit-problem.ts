import { left, right, Either } from '@/core/either'
import {
  Problem,
  ProblemStatus,
} from '../../enterprise/entities/problems/problem'
import { ProblemsRepository } from '../repositories/problems-repository'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { ProblemNotEditableError } from '@/core/errors/problem-not-editable-error'
import { ProblemAttachmentsRepository } from '../repositories/problem-attachments-repository'
import { ProblemAttachmentList } from '../../enterprise/entities/problems/problem-attachment-list'
import { ProblemAttachment } from '../../enterprise/entities/problems/problem-attachment'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Injectable } from '@nestjs/common'

interface EditProblemUseCaseRequest {
  reporterId: string
  problemId: string
  title: string
  description: string
  attachmentsIds: string[]
}

type EditProblemUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError | ProblemNotEditableError,
  {
    problem: Problem
  }
>

@Injectable()
export class EditProblemUseCase {
  constructor(
    private problemsRepository: ProblemsRepository,
    private problemAttachmentsRepository: ProblemAttachmentsRepository,
  ) {}

  async execute({
    reporterId,
    problemId,
    title,
    description,
    attachmentsIds,
  }: EditProblemUseCaseRequest): Promise<EditProblemUseCaseResponse> {
    const problem = await this.problemsRepository.findById(problemId)

    if (!problem) {
      return left(new ResourceNotFoundError())
    }

    // Only the reporter can edit the problem
    if (reporterId !== problem.reporterId.toValue()) {
      return left(new NotAllowedError())
    }

    // Problem can only be edited when status is TO_ANALYSIS
    if (problem.status !== ProblemStatus.TO_ANALYSIS) {
      return left(new ProblemNotEditableError())
    }

    const currentProblemAttachments =
      await this.problemAttachmentsRepository.findManyByProblemId(problemId)
    const problemAttachmentList = new ProblemAttachmentList(
      currentProblemAttachments,
    )
    const problemAttachments = attachmentsIds.map((attachmentId) => {
      return ProblemAttachment.create({
        attachmentId: new UniqueEntityID(attachmentId),
        problemId: problem.id,
      })
    })
    problemAttachmentList.update(problemAttachments)

    problem.title = title
    problem.description = description
    problem.attachments = problemAttachmentList

    await this.problemsRepository.save(problem)

    return right({
      problem,
    })
  }
}
