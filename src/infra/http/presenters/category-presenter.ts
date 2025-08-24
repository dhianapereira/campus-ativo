import { Category } from "@/domain/maintenance-problems/enterprise/entities/category";

export class CategoryPresenter {
  static toHTTP(category: Category) {
    return {
      id: category.id.toValue(),
      name: category.name,
      description: category.description,
      isActive: category.isActive,
    };
  }
}
