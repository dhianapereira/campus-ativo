import { PaginationParams } from '@/core/repositories/pagination-params'
import { Category } from '../../enterprise/entities/category'

export interface FetchCategoriesParams extends PaginationParams {
  query?: string
  isActive?: boolean
  includeDeleted?: boolean
}

export abstract class CategoriesRepository {
  abstract findMany(params: FetchCategoriesParams): Promise<Category[]>
  abstract findById(id: string): Promise<Category | null>
  abstract create(category: Category): Promise<void>
  abstract save(category: Category): Promise<void>
  abstract delete(category: Category): Promise<void>
  abstract hasAssociatedProblems(categoryId: string): Promise<boolean>
}
