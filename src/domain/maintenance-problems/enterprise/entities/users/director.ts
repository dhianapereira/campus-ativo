import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

interface DirectorProps {
  name: string
}

export class Director extends Entity<DirectorProps> {
  static create(props: DirectorProps, id?: UniqueEntityID) {
    const director = new Director(props, id)

    return director
  }
}
