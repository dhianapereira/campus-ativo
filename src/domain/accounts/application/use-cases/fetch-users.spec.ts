import { makeUser } from 'test/factories/make-user'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { FetchUsersUseCase } from './fetch-users'
import { UserRole } from '../../enterprise/entities/user'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: FetchUsersUseCase

describe('Fetch Users', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new FetchUsersUseCase(inMemoryUsersRepository)
  })

  it('should be able to fetch all users', async () => {
    const user1 = makeUser({
      name: 'John Doe',
      role: UserRole.REPORTER,
    })

    const user2 = makeUser({
      name: 'Jane Doe', 
      role: UserRole.MANAGER,
    })

    const user3 = makeUser({
      name: 'Bob Smith',
      role: UserRole.DIRECTOR,
    })

    inMemoryUsersRepository.items.push(user1, user2, user3)

    const result = await sut.execute()

    expect(result.isRight()).toBe(true)
    expect(result.value?.users).toHaveLength(3)
    expect(result.value?.users).toEqual([
      expect.objectContaining({ name: 'John Doe', role: UserRole.REPORTER }),
      expect.objectContaining({ name: 'Jane Doe', role: UserRole.MANAGER }),
      expect.objectContaining({ name: 'Bob Smith', role: UserRole.DIRECTOR }),
    ])
  })

  it('should return empty array when no users exist', async () => {
    const result = await sut.execute()

    expect(result.isRight()).toBe(true)
    expect(result.value?.users).toHaveLength(0)
  })
})