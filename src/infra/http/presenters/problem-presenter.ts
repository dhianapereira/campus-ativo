import { Problem } from "@/domain/maintenance-problems/enterprise/entities/problems/problem";

export class ProblemPresenter {
  static toHTTP(problem: Problem) {
    return {
      id: problem.id.toValue(),
      title: problem.title,
      slug: problem.slug.value,
      excerpt: problem.excerpt,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
    };
  }
}
