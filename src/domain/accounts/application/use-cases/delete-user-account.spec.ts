import { vi } from 'vitest'
import { makeUser } from 'test/factories/make-user'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { InMemoryProblemsRepository } from 'test/repositories/in-memory-problems-repository'
import { ProblemAttachmentsRepository } from '@/domain/maintenance-problems/application/repositories/problem-attachments-repository'
import { DeleteUserAccountUseCase } from './delete-user-account'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { UserRole } from '../../enterprise/entities/user'

// Mock para o ProblemAttachmentsRepository
const mockProblemAttachmentsRepository: ProblemAttachmentsRepository = {
  findManyByProblemId: vi.fn().mockResolvedValue([]),
  deleteManyByProblemId: vi.fn(),
}

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryProblemsRepository: InMemoryProblemsRepository
let sut: DeleteUserAccountUseCase

describe('Delete User Account', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      mockProblemAttachmentsRepository,
    )
    sut = new DeleteUserAccountUseCase(
      inMemoryUsersRepository,
      inMemoryProblemsRepository,
    )
  })

  it('should be able to delete own account', async () => {
    const user = makeUser()
    const systemUser = makeUser({
      email: 'sistema@ifal-arapiraca.edu.br',
    })

    inMemoryUsersRepository.items.push(user)
    inMemoryUsersRepository.items.push(systemUser)

    expect(inMemoryUsersRepository.items).toHaveLength(2)

    const result = await sut.execute({
      userId: user.id.toValue(),
      executorId: user.id.toValue(),
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryUsersRepository.items).toHaveLength(1)
    expect(inMemoryUsersRepository.items[0].id.toValue()).toBe(
      systemUser.id.toValue(),
    )
  })

  it('should not be able to delete another user account', async () => {
    const user = makeUser()
    const anotherUser = makeUser()

    inMemoryUsersRepository.items.push(user)
    inMemoryUsersRepository.items.push(anotherUser)

    expect(inMemoryUsersRepository.items).toHaveLength(2)

    const result = await sut.execute({
      userId: user.id.toValue(),
      executorId: anotherUser.id.toValue(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryUsersRepository.items).toHaveLength(2)
  })

  it('should not be able to delete an admin account of another user', async () => {
    const adminUser = makeUser({ role: UserRole.ADMIN })
    const anotherUser = makeUser({ role: UserRole.REPORTER })

    inMemoryUsersRepository.items.push(adminUser)
    inMemoryUsersRepository.items.push(anotherUser)

    const result = await sut.execute({
      userId: adminUser.id.toValue(),
      executorId: anotherUser.id.toValue(),
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

  it('should not be able to delete a system user account', async () => {
    const systemUser = makeUser({
      email: 'sistema@ifal-arapiraca.edu.br',
    })

    inMemoryUsersRepository.items.push(systemUser)

    const result = await sut.execute({
      userId: systemUser.id.toValue(),
      executorId: systemUser.id.toValue(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryUsersRepository.items).toHaveLength(1)
  })

  it('should not be able to delete account if system user does not exist', async () => {
    const user = makeUser()

    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toValue(),
      executorId: user.id.toValue(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should migrate user problems to system user when deleting account', async () => {
    const user = makeUser()
    const systemUser = makeUser({
      email: 'sistema@ifal-arapiraca.edu.br',
    })

    inMemoryUsersRepository.items.push(user)
    inMemoryUsersRepository.items.push(systemUser)

    const result = await sut.execute({
      userId: user.id.toValue(),
      executorId: user.id.toValue(),
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryUsersRepository.items).toHaveLength(1)
    expect(inMemoryUsersRepository.items[0].id.toValue()).toBe(
      systemUser.id.toValue(),
    )
  })
})
