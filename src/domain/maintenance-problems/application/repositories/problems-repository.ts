import { PaginationParams } from '@/core/repositories/pagination-params'
import { Problem } from '../../enterprise/entities/problems/problem'

export interface ProblemsRepository {
  findById(id: string): Promise<Problem | null>
  findBySlug(slug: string): Promise<Problem | null>
  findMany(params: PaginationParams): Promise<Problem[]>
  save(problem: Problem): Promise<void>
  create(problem: Problem): Promise<void>
  delete(problem: Problem): Promise<void>
}
