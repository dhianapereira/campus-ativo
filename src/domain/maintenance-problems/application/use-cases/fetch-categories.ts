import { right, Either } from '@/core/either'
import { left } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Category } from '../../enterprise/entities/category'
import { CategoriesRepository } from '../repositories/categories-repository'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { RoleHierarchy } from '@/core/utils/role-hierarchy'

interface FetchCategoriesUseCaseRequest {
  page: number
  query?: string
  isActive?: boolean
  includeDeleted?: boolean
  userRole?: UserRole
}

type FetchCategoriesUseCaseResponse = Either<
  NotAllowedError,
  {
    categories: Category[]
  }
>

@Injectable()
export class FetchCategoriesUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    page,
    query,
    isActive,
    includeDeleted = false,
    userRole,
  }: FetchCategoriesUseCaseRequest): Promise<FetchCategoriesUseCaseResponse> {
    if (
      includeDeleted &&
      (!userRole || !RoleHierarchy.hasPermission(userRole, UserRole.MANAGER))
    ) {
      return left(new NotAllowedError())
    }

    const categories = await this.categoriesRepository.findMany({
      page,
      query,
      isActive,
      includeDeleted,
    })

    return right({
      categories,
    })
  }
}
