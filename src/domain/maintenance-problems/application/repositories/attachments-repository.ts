import { Attachment } from '../../enterprise/entities/attachment'

export abstract class AttachmentsRepository {
  abstract create(
    attachment: Attachment,
    options?: { problemId: string },
  ): Promise<void>
  abstract findById(id: string): Promise<Attachment | null>
  abstract findManyByProblemId(problemId: string): Promise<Attachment[]>
  abstract findOrphanByIdAndOwner(
    id: string,
    ownerId: string,
  ): Promise<Attachment | null>
  abstract delete(attachment: Attachment): Promise<void>
}
