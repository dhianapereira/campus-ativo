import { PaginationParams } from '@/core/repositories/pagination-params'
import { Problem } from '../../enterprise/entities/problems/problem'
import { ProblemWithDetails } from '../../enterprise/entities/value-objects/problem-with-details'

export interface FetchProblemsParams extends PaginationParams {
  query?: string
}

export abstract class ProblemsRepository {
  abstract findById(id: string): Promise<Problem | null>
  abstract findBySlug(slug: string): Promise<Problem | null>
  abstract findMany(params: FetchProblemsParams): Promise<Problem[]>
  abstract findManyWithDetails(
    params: FetchProblemsParams,
  ): Promise<ProblemWithDetails[]>
  abstract save(problem: Problem): Promise<void>
  abstract create(problem: Problem): Promise<void>
  abstract delete(problem: Problem): Promise<void>
}
