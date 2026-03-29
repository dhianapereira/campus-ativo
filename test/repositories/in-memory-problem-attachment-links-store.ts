import { ProblemAttachment } from '@/domain/maintenance-problems/enterprise/entities/problems/problem-attachment'

export class InMemoryProblemAttachmentLinksStore {
  public items: ProblemAttachment[] = []

  async findManyByProblemId(problemId: string) {
    return this.items.filter((item) => item.problemId.toValue() === problemId)
  }

  async deleteManyByProblemId(problemId: string) {
    this.items = this.items.filter(
      (item) => item.problemId.toValue() !== problemId,
    )
  }
}
