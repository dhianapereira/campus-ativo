import { WatchedList } from "@/core/entities/watched-list";
import { ProblemAttachment } from "./problem-attachment";

export class ProblemAttachmentList extends WatchedList<ProblemAttachment> {
  compareItems(a: ProblemAttachment, b: ProblemAttachment): boolean {
    return a.attachmentId.equals(b.attachmentId);
  }
}
