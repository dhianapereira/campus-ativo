import { faker } from '@faker-js/faker'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Reporter,
  ReporterProps,
} from '@/domain/accounts/enterprise/entities/reporter'

export function makeReporter(
  override: Partial<ReporterProps> = {},
  id?: UniqueEntityID,
) {
  const reporter = Reporter.create(
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      ...override,
    },
    id,
  )

  return reporter
}
