import { PaginationParams } from "@/core/repositories/pagination-params";
import { Category } from "../../enterprise/entities/category";

export abstract class CategoriesRepository {
  abstract findMany(params: PaginationParams): Promise<Category[]>;
  abstract create(category: Category): Promise<void>;
}
