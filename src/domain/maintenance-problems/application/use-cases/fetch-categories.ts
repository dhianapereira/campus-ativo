import { right, Either } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Category } from '../../enterprise/entities/category'
import { CategoriesRepository } from '../repositories/categories-repository'

interface FetchCategoriesUseCaseRequest {
  page: number
  query?: string
  isActive?: boolean
  includeDeleted?: boolean
}

type FetchCategoriesUseCaseResponse = Either<
  null,
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
  }: FetchCategoriesUseCaseRequest): Promise<FetchCategoriesUseCaseResponse> {
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
