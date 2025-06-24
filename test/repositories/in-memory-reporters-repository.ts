import { ReportersRepository } from '@/domain/accounts/application/repositories/reporters-repository'
import { Reporter } from '@/domain/accounts/enterprise/entities/reporter'

export class InMemoryReportersRepository implements ReportersRepository {
  public items: Reporter[] = []

  async findByEmail(email: string) {
    const reporter = this.items.find((item) => item.email === email)

    if (!reporter) {
      return null
    }

    return reporter
  }

  async create(reporter: Reporter) {
    this.items.push(reporter)
  }
}
