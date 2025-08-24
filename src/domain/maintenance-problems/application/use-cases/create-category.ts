import { Category } from "@/domain/maintenance-problems/enterprise/entities/category";
import { right, Either } from "@/core/either";
import { Injectable } from "@nestjs/common";
import { CategoriesRepository } from "../repositories/categories-repository";

interface CreateCategoryUseCaseRequest {
  name: string;
  description?: string | null;
}

type CreateCategoryUseCaseResponse = Either<
  null,
  {
    category: Category;
  }
>;

@Injectable()
export class CreateCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    name,
    description,
  }: CreateCategoryUseCaseRequest): Promise<CreateCategoryUseCaseResponse> {
    const category = Category.create({
      name,
      description,
    });

    await this.categoriesRepository.create(category);

    return right({
      category,
    });
  }
}
