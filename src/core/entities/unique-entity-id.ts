import { randomUUID } from 'node:crypto'

export class UniqueEntityID {
  private value: string

  toValue() {
    return this.value
  }

  constructor(value?: string) {
    this.value = value ?? randomUUID()
  }

  public equals(id: UniqueEntityID) {
    return id.toValue() === this.value
  }
}
