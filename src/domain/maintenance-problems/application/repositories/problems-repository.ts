import { PaginationParams } from '@/core/repositories/pagination-params'
import { Problem } from '../../enterprise/entities/problems/problem'
import { ProblemWithDetails } from '../../enterprise/entities/value-objects/problem-with-details'
import { DashboardMetrics } from '../../enterprise/entities/value-objects/dashboard-metrics'

export interface FetchProblemsParams extends PaginationParams {
  query?: string
  includeDeleted?: boolean
  reporterId?: string
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
  abstract getDashboardMetrics(): Promise<DashboardMetrics>
  abstract migrateUserProblems(
    fromUserId: string,
    toUserId: string,
  ): Promise<void>
}
