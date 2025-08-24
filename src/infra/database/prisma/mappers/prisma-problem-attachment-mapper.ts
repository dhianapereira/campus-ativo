import { Attachment as PrismaAttachment } from "@prisma/client";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { ProblemAttachment } from "@/domain/maintenance-problems/enterprise/entities/problems/problem-attachment";

export class PrismaProblemAttachmentMapper {
  static toDomain(raw: PrismaAttachment): ProblemAttachment {
    if (!raw.problemId) {
      throw new Error("Invalid attachment type.");
    }

    return ProblemAttachment.create(
      {
        attachmentId: new UniqueEntityID(raw.id),
        problemId: new UniqueEntityID(raw.problemId),
      },
      new UniqueEntityID(raw.id),
    );
  }
}
