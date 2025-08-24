import { UniqueEntityID } from "@/core/entities/unique-entity-id";

import {
  ProblemAttachment,
  ProblemAttachmentProps,
} from "@/domain/maintenance-problems/enterprise/entities/problems/problem-attachment";

export function makeProblemAttachment(
  override: Partial<ProblemAttachmentProps> = {},
  id?: UniqueEntityID,
) {
  const problemAttachment = ProblemAttachment.create(
    {
      problemId: new UniqueEntityID(),
      attachmentId: new UniqueEntityID(),
      ...override,
    },
    id,
  );

  return problemAttachment;
}
