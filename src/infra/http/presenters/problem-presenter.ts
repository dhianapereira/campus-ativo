import { Problem } from '@/domain/maintenance-problems/enterprise/entities/problems/problem'
import { ProblemWithDetails } from '@/domain/maintenance-problems/enterprise/entities/value-objects/problem-with-details'
import { Attachment } from '@/domain/maintenance-problems/enterprise/entities/attachment'

export class ProblemPresenter {
  static toHTTP(problem: Problem) {
    return {
      id: problem.id.toValue(),
      reporterId: problem.reporterId?.toValue() ?? null,
      categoryId: problem.categoryId.toValue(),
      locationId: problem.locationId?.toValue() ?? null,
      title: problem.title,
      slug: problem.slug.value,
      description: problem.description,
      excerpt: problem.excerpt,
      status: problem.status,
      maintenanceType: problem.maintenanceType,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
      deletedAt: problem.deletedAt,
    }
  }

  static toHTTPWithAttachments(problem: Problem, attachments: Attachment[]) {
    return {
      id: problem.id.toValue(),
      reporterId: problem.reporterId?.toValue() ?? null,
      categoryId: problem.categoryId.toValue(),
      locationId: problem.locationId?.toValue() ?? null,
      title: problem.title,
      slug: problem.slug.value,
      description: problem.description,
      excerpt: problem.excerpt,
      status: problem.status,
      maintenanceType: problem.maintenanceType,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
      deletedAt: problem.deletedAt,
      attachments: attachments.map((attachment) => ({
        id: attachment.id.toValue(),
        title: attachment.title,
        url: attachment.link,
      })),
    }
  }

  static toHTTPWithDetails(problem: ProblemWithDetails) {
    return {
      id: problem.problemId.toValue(),
      reporterId: problem.reporterId?.toValue() ?? null,
      title: problem.title,
      slug: problem.slug.value,
      excerpt: problem.excerpt,
      location: {
        id: problem.locationId.toValue(),
        name: problem.locationName,
      },
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
      deletedAt: problem.deletedAt,
    }
  }
}
