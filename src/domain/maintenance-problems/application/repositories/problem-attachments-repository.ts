import { ProblemAttachment } from '../../enterprise/entities/problems/problem-attachment'

export abstract class ProblemAttachmentsRepository {
  abstract findManyByProblemId(problemId: string): Promise<ProblemAttachment[]>
  abstract deleteManyByProblemId(problemId: string): Promise<void>
}
