import { PaginationParams } from "@/core/repositories/pagination-params";
import { ProblemAttachmentsRepository } from "@/domain/maintenance-problems/application/repositories/problem-attachments-repository";
import { ProblemsRepository } from "@/domain/maintenance-problems/application/repositories/problems-repository";
import { Problem } from "@/domain/maintenance-problems/enterprise/entities/problems/problem";

export class InMemoryProblemsRepository implements ProblemsRepository {
  public items: Problem[] = [];

  constructor(
    private problemAttachmentsRepository: ProblemAttachmentsRepository,
  ) {}

  async findById(id: string) {
    const problem = this.items.find((item) => item.id.toValue() === id);

    if (!problem) {
      return null;
    }

    return problem;
  }

  async findBySlug(slug: string) {
    const problem = this.items.find((item) => item.slug.value === slug);

    if (!problem) {
      return null;
    }

    return problem;
  }

  async findMany({ page }: PaginationParams) {
    const problems = this.items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * 20, page * 20);

    return problems;
  }

  async create(problem: Problem) {
    this.items.push(problem);
  }

  async delete(problem: Problem) {
    const itemIndex = this.items.findIndex((item) => item.id === problem.id);

    this.items.splice(itemIndex, 1);

    this.problemAttachmentsRepository.deleteManyByProblemId(
      problem.id.toValue(),
    );
  }

  async save(problem: Problem) {
    const itemIndex = this.items.findIndex((item) => item.id === problem.id);

    this.items[itemIndex] = problem;
  }
}
