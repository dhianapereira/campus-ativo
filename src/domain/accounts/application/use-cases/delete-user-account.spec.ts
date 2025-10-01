import { makeUser } from 'test/factories/make-user'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { DeleteUserAccountUseCase } from './delete-user-account'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: DeleteUserAccountUseCase

describe('Delete User Account', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new DeleteUserAccountUseCase(inMemoryUsersRepository)
  })

  it('should be able to delete own account', async () => {
    const user = makeUser()

    inMemoryUsersRepository.items.push(user)

    expect(inMemoryUsersRepository.items).toHaveLength(1)

    const result = await sut.execute({
      userId: user.id.toString(),
      executorId: user.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryUsersRepository.items).toHaveLength(0)
  })

  it('should not be able to delete another user account', async () => {
    const user = makeUser()
    const anotherUser = makeUser()

    inMemoryUsersRepository.items.push(user)
    inMemoryUsersRepository.items.push(anotherUser)

    expect(inMemoryUsersRepository.items).toHaveLength(2)

    const result = await sut.execute({
      userId: user.id.toString(),
      executorId: anotherUser.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryUsersRepository.items).toHaveLength(2)
  })

  it('should not be able to delete non-existing user account', async () => {
    const result = await sut.execute({
      userId: 'non-existing-id',
      executorId: 'non-existing-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
