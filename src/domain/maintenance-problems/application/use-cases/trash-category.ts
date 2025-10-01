import { left, right, Either } from '@/core/either'
import { Category } from '../../enterprise/entities/category'
import { CategoriesRepository } from '../repositories/categories-repository'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Injectable } from '@nestjs/common'

interface TrashCategoryUseCaseRequest {
  categoryId: string
}

type TrashCategoryUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    category: Category
  }
>

@Injectable()
export class TrashCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    categoryId,
  }: TrashCategoryUseCaseRequest): Promise<TrashCategoryUseCaseResponse> {
    const category = await this.categoriesRepository.findById(categoryId)

    if (!category) {
      return left(new ResourceNotFoundError())
    }

    category.moveToTrash()

    await this.categoriesRepository.save(category)

    return right({
      category,
    })
  }
}
