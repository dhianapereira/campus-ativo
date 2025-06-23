import { left, right, Either } from '@/core/either'
import { Problem } from '../../enterprise/entities/problems/problem'
import { ProblemsRepository } from '../repositories/problems-repository'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { ProblemAttachmentsRepository } from '../repositories/problem-attachments-repository'
import { ProblemAttachmentList } from '../../enterprise/entities/problems/problem-attachment-list'
import { ProblemAttachment } from '../../enterprise/entities/problems/problem-attachment'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

interface EditProblemUseCaseRequest {
  reporterId: string
  problemId: string
  title: string
  description: string
  attachmentsIds: string[]
}

type EditProblemUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    problem: Problem
  }
>

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

    if (reporterId !== problem.reporterId.toValue()) {
      return left(new NotAllowedError())
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
