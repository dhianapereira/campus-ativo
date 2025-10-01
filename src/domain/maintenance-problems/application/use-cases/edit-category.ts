import { left, right, Either } from '@/core/either'
import { Category } from '../../enterprise/entities/category'
import { CategoriesRepository } from '../repositories/categories-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { CategoryInTrashError } from '@/core/errors/category-in-trash-error'
import { Injectable } from '@nestjs/common'

interface EditCategoryUseCaseRequest {
  categoryId: string
  name: string
  description?: string | null
  isActive?: boolean
}

type EditCategoryUseCaseResponse = Either<
  ResourceNotFoundError | CategoryInTrashError,
  {
    category: Category
  }
>

@Injectable()
export class EditCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    categoryId,
    name,
    description,
    isActive,
  }: EditCategoryUseCaseRequest): Promise<EditCategoryUseCaseResponse> {
    const category = await this.categoriesRepository.findById(categoryId)

    if (!category) {
      return left(new ResourceNotFoundError())
    }

    if (category.isInTrash) {
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
