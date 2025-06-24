import { ProblemAttachmentsRepository } from '@/domain/maintenance-problems/application/repositories/problem-attachments-repository'
import { ProblemAttachment } from '@/domain/maintenance-problems/enterprise/entities/problems/problem-attachment'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PrismaProblemAttachmentsRepository
  implements ProblemAttachmentsRepository
{
  findManyByProblemId(problemId: string): Promise<ProblemAttachment[]> {
    throw new Error('Method not implemented.')
  }

  deleteManyByProblemId(problemId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
