import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

export interface ProblemAttachmentProps {
  problemId: UniqueEntityID;
  attachmentId: UniqueEntityID;
}

export class ProblemAttachment extends Entity<ProblemAttachmentProps> {
  get problemId() {
    return this.props.problemId;
  }

  get attachmentId() {
    return this.props.attachmentId;
  }

  static create(props: ProblemAttachmentProps, id?: UniqueEntityID) {
    const problemAttachment = new ProblemAttachment(props, id);

    return problemAttachment;
  }
}
