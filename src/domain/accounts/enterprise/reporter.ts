import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

interface ReporterProps {
  name: string
}

export class Reporter extends Entity<ReporterProps> {
  static create(props: ReporterProps, id?: UniqueEntityID) {
    const reporter = new Reporter(props, id)

    return reporter
  }
}
