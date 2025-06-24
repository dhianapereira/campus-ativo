import { Reporter } from '../../enterprise/entities/reporter'

export abstract class ReportersRepository {
  abstract findByEmail(email: string): Promise<Reporter | null>
  abstract create(student: Reporter): Promise<void>
}
