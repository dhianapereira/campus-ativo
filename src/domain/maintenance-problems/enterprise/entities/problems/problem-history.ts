import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

export enum HistoryAction {
  STATUS_CHANGED = 'STATUS_CHANGED',
  CATEGORY_CHANGED = 'CATEGORY_CHANGED',
  MAINTENANCE_TYPE_CHANGED = 'MAINTENANCE_TYPE_CHANGED',
  NOTE_ADDED = 'NOTE_ADDED',
}

export interface ProblemHistoryProps {
  problemId: UniqueEntityID
  action: HistoryAction
  userId: UniqueEntityID
  userName: string
  oldValue?: string | null
  newValue?: string | null
  note?: string | null
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

  get userName() {
    return this.props.userName
  }

  get oldValue() {
    return this.props.oldValue
  }

  get newValue() {
    return this.props.newValue
  }

  get note() {
    return this.props.note
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
