import { left, right, Either } from '@/core/either'
import { Category } from '../../enterprise/entities/category'
import { CategoriesRepository } from '../repositories/categories-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { Injectable } from '@nestjs/common'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { RoleHierarchy } from '@/core/utils/role-hierarchy'

interface RestoreCategoryUseCaseRequest {
  categoryId: string
  userRole: UserRole
}

type RestoreCategoryUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    category: Category
  }
>

@Injectable()
export class RestoreCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    categoryId,
    userRole,
  }: RestoreCategoryUseCaseRequest): Promise<RestoreCategoryUseCaseResponse> {
    // Only Manager+ can restore categories
    if (!RoleHierarchy.hasPermission(userRole, UserRole.MANAGER)) {
      return left(new NotAllowedError())
    }

    const category = await this.categoriesRepository.findById(categoryId)

    if (!category) {
      return left(new ResourceNotFoundError())
    }

    if (category.isPurged || !category.isInTrash) {
      return left(new NotAllowedError())
    }

    category.restoreFromTrash()

    await this.categoriesRepository.save(category)

    return right({
      category,
    })
  }
}
