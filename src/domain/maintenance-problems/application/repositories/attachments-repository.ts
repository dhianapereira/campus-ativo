import { Attachment } from '../../enterprise/entities/attachment'

export abstract class AttachmentsRepository {
  abstract create(attachment: Attachment): Promise<void>
  abstract findById(id: string): Promise<Attachment | null>
  abstract findManyByProblemId(problemId: string): Promise<Attachment[]>
  abstract delete(attachment: Attachment): Promise<void>
}
