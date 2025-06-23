import { ProblemAttachment } from '../../enterprise/entities/problems/problem-attachment'

export interface ProblemAttachmentsRepository {
  findManyByProblemId(problemId: string): Promise<ProblemAttachment[]>
  deleteManyByProblemId(problemId: string): Promise<void>
}
