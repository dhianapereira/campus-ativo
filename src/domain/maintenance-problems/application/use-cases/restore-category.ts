import { left, right, Either } from '@/core/either'
import { Category } from '../../enterprise/entities/category'
import { CategoriesRepository } from '../repositories/categories-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Injectable } from '@nestjs/common'

interface RestoreCategoryUseCaseRequest {
  categoryId: string
}

type RestoreCategoryUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    category: Category
  }
>

@Injectable()
export class RestoreCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    categoryId,
  }: RestoreCategoryUseCaseRequest): Promise<RestoreCategoryUseCaseResponse> {
    const category = await this.categoriesRepository.findById(categoryId)

    if (!category) {
      return left(new ResourceNotFoundError())
    }

    category.restoreFromTrash()

    await this.categoriesRepository.save(category)

    return right({
      category,
    })
  }
}
