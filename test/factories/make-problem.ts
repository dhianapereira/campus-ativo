import { faker } from '@faker-js/faker'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Problem,
  ProblemProps,
} from 'problem'

export function makeProblem(
  override: Partial<ProblemProps> = {},
  id?: UniqueEntityID,
) {
  const problem = Problem.create(
    {
      reporterId: new UniqueEntityID(),
      title: faker.lorem.sentence(),
      description: faker.lorem.text(),
      ...override,
    },
    id,
  )

  return problem
}
