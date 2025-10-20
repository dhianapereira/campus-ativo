import { Problem } from '@/domain/maintenance-problems/enterprise/entities/problems/problem'
import { ProblemWithDetails } from '@/domain/maintenance-problems/enterprise/entities/value-objects/problem-with-details'

export class ProblemPresenter {
  static toHTTP(problem: Problem) {
    return {
      id: problem.id.toValue(),
      title: problem.title,
      slug: problem.slug.value,
      excerpt: problem.excerpt,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
    }
  }

  static toHTTPWithDetails(problem: ProblemWithDetails) {
    return {
      id: problem.problemId.toValue(),
      title: problem.title,
      slug: problem.slug.value,
      excerpt: problem.excerpt,
      location: {
        id: problem.locationId.toValue(),
        name: problem.locationName,
      },
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
    }
  }
}
