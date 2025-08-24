import { PaginationParams } from "@/core/repositories/pagination-params";
import { Problem } from "../../enterprise/entities/problems/problem";

export abstract class ProblemsRepository {
  abstract findById(id: string): Promise<Problem | null>;
  abstract findBySlug(slug: string): Promise<Problem | null>;
  abstract findMany(params: PaginationParams): Promise<Problem[]>;
  abstract save(problem: Problem): Promise<void>;
  abstract create(problem: Problem): Promise<void>;
  abstract delete(problem: Problem): Promise<void>;
}
