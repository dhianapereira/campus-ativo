import { right, Either } from "@/core/either";
import { Injectable } from "@nestjs/common";
import { Category } from "../../enterprise/entities/category";
import { CategoriesRepository } from "../repositories/categories-repository";

interface FetchCategoriesUseCaseRequest {
  page: number;
}

type FetchCategoriesUseCaseResponse = Either<
  null,
  {
    categories: Category[];
  }
>;

@Injectable()
export class FetchCategoriesUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    page,
  }: FetchCategoriesUseCaseRequest): Promise<FetchCategoriesUseCaseResponse> {
    const categories = await this.categoriesRepository.findMany({ page });

    return right({
      categories,
    });
  }
}
