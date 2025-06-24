import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

export interface ReporterProps {
  name: string
  position: string
  email: string
  password: string
}

export class Reporter extends Entity<ReporterProps> {
  get name() {
    return this.props.name
  }

  get position() {
    return this.props.position
  }

  get email() {
    return this.props.email
  }

  get password() {
    return this.props.password
  }

  static create(props: ReporterProps, id?: UniqueEntityID) {
    const reporter = new Reporter(props, id)

    return reporter
  }
}
