import { PaginationParams } from '@/core/repositories/pagination-params'
import { PaginatedResult } from '@/core/repositories/paginated-result'
import {
  Problem,
  ProblemStatus,
} from '../../enterprise/entities/problems/problem'
import { ProblemWithDetails } from '../../enterprise/entities/value-objects/problem-with-details'
import { DashboardMetrics } from '../../enterprise/entities/value-objects/dashboard-metrics'

export interface FetchProblemsParams extends PaginationParams {
  query?: string
  statuses?: ProblemStatus[]
  includeDeleted?: boolean
  reporterId?: string
}

export interface DuplicateProblemLookup {
  title: string
  description: string
  categoryId: string
  locationId: string
}

export abstract class ProblemsRepository {
  abstract findById(id: string): Promise<Problem | null>
  abstract findBySlug(slug: string): Promise<Problem | null>
  abstract findDuplicate(
    params: DuplicateProblemLookup,
  ): Promise<Problem | null>
  abstract findMany(
    params: FetchProblemsParams,
  ): Promise<PaginatedResult<Problem>>
  abstract findManyWithDetails(
    params: FetchProblemsParams,
  ): Promise<PaginatedResult<ProblemWithDetails>>

  abstract save(problem: Problem): Promise<void>
  abstract create(problem: Problem): Promise<void>
  abstract delete(problem: Problem): Promise<void>
  abstract getDashboardMetrics(): Promise<DashboardMetrics>
  abstract migrateUserProblems(
    fromUserId: string,
    toUserId: string,
  ): Promise<void>
}
