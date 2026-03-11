import { ProblemAttachmentsRepository } from '@/domain/maintenance-problems/application/repositories/problem-attachments-repository'
import { ProblemAttachment } from '@/domain/maintenance-problems/enterprise/entities/problems/problem-attachment'

export class InMemoryProblemAttachmentsRepository implements ProblemAttachmentsRepository {
  public items: ProblemAttachment[] = []

  async findManyByProblemId(problemId: string) {
    const problemAttachments = this.items.filter(
      (item) => item.problemId.toValue() === problemId,
    )

    return problemAttachments
  }

  async deleteManyByProblemId(problemId: string) {
    const problemAttachments = this.items.filter(
      (item) => item.problemId.toValue() !== problemId,
    )

    this.items = problemAttachments
  }
}
