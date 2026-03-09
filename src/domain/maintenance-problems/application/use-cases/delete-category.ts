import { left, right, Either } from '@/core/either'
import { CategoriesRepository } from '../repositories/categories-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { Injectable } from '@nestjs/common'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { RoleHierarchy } from '@/core/utils/role-hierarchy'

interface DeleteCategoryUseCaseRequest {
  categoryId: string
  userRole: UserRole
}

type DeleteCategoryUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  object
>

@Injectable()
export class DeleteCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    categoryId,
    userRole,
  }: DeleteCategoryUseCaseRequest): Promise<DeleteCategoryUseCaseResponse> {
    // Only Manager+ can delete categories permanently
    if (!RoleHierarchy.hasPermission(userRole, UserRole.MANAGER)) {
      return left(new NotAllowedError())
    }

    const category = await this.categoriesRepository.findById(categoryId)

    if (!category) {
      return left(new ResourceNotFoundError())
    }

    // Check if category has associated problems
    const hasProblems =
      await this.categoriesRepository.hasAssociatedProblems(categoryId)

    if (hasProblems) {
      return left(new NotAllowedError())
    }

    // Mark as permanently deleted instead of hard deleting
    category.permanentDelete()
    await this.categoriesRepository.save(category)

    return right({})
  }
}
