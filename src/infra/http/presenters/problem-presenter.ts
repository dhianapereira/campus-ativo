import { Problem } from '@/domain/maintenance-problems/enterprise/entities/problems/problem'
import { ProblemWithDetails } from '@/domain/maintenance-problems/enterprise/entities/value-objects/problem-with-details'
import { Attachment } from '@/domain/maintenance-problems/enterprise/entities/attachment'
import { ProblemHistory } from '@/domain/maintenance-problems/enterprise/entities/problems/problem-history'

export class ProblemPresenter {
  static toHTTPWithAttachments(
    problem: Problem,
    attachments: Attachment[],
    category: {
      id: string
      name: string
      description: string | null
    },
    location: {
      id: string
      name: string
      code: string
      description: string
    },
    reporter: {
      id: string
      email: string
    },
  ) {
    return {
      id: problem.id.toValue(),
      reporter,
      category,
      location,
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

  static toHTTPHistory(history: ProblemHistory[]) {
    return history.map((entry) => ({
      id: entry.id.toValue(),
      action: entry.action,
      userName: entry.userName,
      note: entry.note ?? null,
      changes: entry.changes ?? null,
      createdAt: entry.createdAt,
    }))
  }

  static toHTTPWithDetails(problem: ProblemWithDetails) {
    return {
      id: problem.problemId.toValue(),
      reporterId: problem.reporterId.toValue(),
      title: problem.title,
      slug: problem.slug.value,
      excerpt: problem.excerpt,
      locationName: problem.locationName,
      status: problem.status,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
      deletedAt: problem.deletedAt,
    }
  }
}
