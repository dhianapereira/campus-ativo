import { ProblemAttachmentsRepository } from '@/domain/maintenance-problems/application/repositories/problem-attachments-repository'
import { ProblemAttachment } from '@/domain/maintenance-problems/enterprise/entities/problems/problem-attachment'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaProblemAttachmentMapper } from '../mappers/prisma-problem-attachment-mapper'

@Injectable()
export class PrismaProblemAttachmentsRepository
  implements ProblemAttachmentsRepository
{
  constructor(private prisma: PrismaService) {}

  async findManyByProblemId(problemId: string): Promise<ProblemAttachment[]> {
    const problemAttachments = await this.prisma.attachment.findMany({
      where: {
        problemId,
      },
    })

    return problemAttachments.map(PrismaProblemAttachmentMapper.toDomain)
  }

  async deleteManyByProblemId(problemId: string): Promise<void> {
    await this.prisma.attachment.deleteMany({
      where: {
        problemId,
      },
    })
  }
}
