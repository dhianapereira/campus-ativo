import { left, right, Either } from '@/core/either'
import { Category } from '../../enterprise/entities/category'
import { CategoriesRepository } from '../repositories/categories-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { CategoryInTrashError } from '@/core/errors/category-in-trash-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { Injectable } from '@nestjs/common'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { RoleHierarchy } from '@/core/utils/role-hierarchy'

interface EditCategoryUseCaseRequest {
  categoryId: string
  userRole: UserRole
  name: string
  description?: string | null
  isActive?: boolean
}

type EditCategoryUseCaseResponse = Either<
  ResourceNotFoundError | CategoryInTrashError | NotAllowedError,
  {
    category: Category
  }
>

@Injectable()
export class EditCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    categoryId,
    userRole,
    name,
    description,
    isActive,
  }: EditCategoryUseCaseRequest): Promise<EditCategoryUseCaseResponse> {
    // Only Manager+ can edit categories
    if (!RoleHierarchy.hasPermission(userRole, UserRole.MANAGER)) {
      return left(new NotAllowedError())
    }

    const category = await this.categoriesRepository.findById(categoryId)

    if (!category) {
      return left(new ResourceNotFoundError())
    }

    if (category.deletedAt) {
      return left(new CategoryInTrashError())
    }

    category.name = name
    category.description = description
    if (isActive !== undefined) {
      category.isActive = isActive
    }

    await this.categoriesRepository.save(category)

    return right({
      category,
    })
  }
}
