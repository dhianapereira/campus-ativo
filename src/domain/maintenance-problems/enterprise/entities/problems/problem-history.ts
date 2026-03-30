import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

export enum ProblemHistoryAction {
  STATUS_CHANGED = 'STATUS_CHANGED',
  MAINTENANCE_TYPE_CHANGED = 'MAINTENANCE_TYPE_CHANGED',
  NOTE_ADDED = 'NOTE_ADDED',
  UPDATED = 'UPDATED',
}

export enum ProblemHistoryChangeField {
  STATUS = 'status',
  MAINTENANCE_TYPE = 'maintenanceType',
  NOTE = 'note',
}

export interface ProblemHistoryChange {
  field: ProblemHistoryChangeField
  oldValue?: string | null
  newValue?: string | null
}

export interface ProblemHistoryProps {
  problemId: UniqueEntityID
  action: ProblemHistoryAction
  userId: UniqueEntityID
  note?: string | null
  changes?: ProblemHistoryChange[] | null
  createdAt: Date
}

export class ProblemHistory extends Entity<ProblemHistoryProps> {
  get problemId() {
    return this.props.problemId
  }

  get action() {
    return this.props.action
  }

  get userId() {
    return this.props.userId
  }

  get note() {
    return this.props.note
  }

  get changes() {
    return this.props.changes
  }

  get createdAt() {
    return this.props.createdAt
  }

  static create(
    props: Omit<ProblemHistoryProps, 'createdAt'> & {
      createdAt?: Date
    },
    id?: UniqueEntityID,
  ) {
    const problemHistory = new ProblemHistory(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return problemHistory
  }
}
