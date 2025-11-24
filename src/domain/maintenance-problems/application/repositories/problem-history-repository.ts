import { ProblemHistory } from '../../enterprise/entities/problems/problem-history'

export abstract class ProblemHistoryRepository {
  abstract create(problemHistory: ProblemHistory): Promise<void>
  abstract findManyByProblemId(problemId: string): Promise<ProblemHistory[]>
}
