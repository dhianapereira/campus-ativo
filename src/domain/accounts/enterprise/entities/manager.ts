import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

interface ManagerProps {
  name: string
}

export class Manager extends Entity<ManagerProps> {
  static create(props: ManagerProps, id?: UniqueEntityID) {
    const manager = new Manager(props, id)

    return manager
  }
}
