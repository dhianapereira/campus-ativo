import { PaginationParams } from "@/core/repositories/pagination-params";
import { CategoriesRepository } from "@/domain/maintenance-problems/application/repositories/categories-repository";
import { Category } from "@/domain/maintenance-problems/enterprise/entities/category";

export class InMemoryCategoriesRepository implements CategoriesRepository {
  public items: Category[] = [];

  async findMany({ page }: PaginationParams) {
    const categories = this.items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * 20, page * 20);

    return categories;
  }

  async create(category: Category) {
    this.items.push(category);
  }
}
