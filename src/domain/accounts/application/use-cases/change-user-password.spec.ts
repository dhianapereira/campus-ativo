import { makeUser } from 'test/factories/make-user'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { ChangeUserPasswordUseCase } from './change-user-password'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { WrongCredentialsError } from './errors/wrong-credentials-error'
import { HashComparer } from '../cryptography/hash-comparer'
import { HashGenerator } from '../cryptography/hash-generator'
import { UserRole } from '../../enterprise/entities/user'

let inMemoryUsersRepository: InMemoryUsersRepository
let fakeHashComparer: HashComparer
let fakeHashGenerator: HashGenerator
let sut: ChangeUserPasswordUseCase

describe('Change User Password', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    fakeHashComparer = {
      compare: vi.fn(),
    }
    fakeHashGenerator = {
      hash: vi.fn(),
    }
    sut = new ChangeUserPasswordUseCase(
      inMemoryUsersRepository,
      fakeHashComparer,
      fakeHashGenerator,
    )
  })

  it('should be able to change own password', async () => {
    const user = makeUser({
      password: 'hashed-old-password',
    })

    inMemoryUsersRepository.items.push(user)

    vi.spyOn(fakeHashComparer, 'compare').mockResolvedValueOnce(true)
    vi.spyOn(fakeHashGenerator, 'hash').mockResolvedValueOnce(
      'hashed-new-password',
    )

    const result = await sut.execute({
      userId: user.id.toValue(),
      executorId: user.id.toValue(),
      oldPassword: 'old-password',
      newPassword: 'NewPassword123',
    })

    expect(result.isRight()).toBe(true)
    expect(fakeHashComparer.compare).toHaveBeenCalledWith(
      'old-password',
      'hashed-old-password',
    )
    expect(fakeHashGenerator.hash).toHaveBeenCalledWith('NewPassword123')
    expect(inMemoryUsersRepository.items[0].password).toBe(
      'hashed-new-password',
    )
  })

  it('should not be able to change password with wrong old password', async () => {
    const user = makeUser({
      password: 'hashed-old-password',
    })

    inMemoryUsersRepository.items.push(user)

    vi.spyOn(fakeHashComparer, 'compare').mockResolvedValueOnce(false)

    const result = await sut.execute({
      userId: user.id.toValue(),
      executorId: user.id.toValue(),
      oldPassword: 'wrong-password',
      newPassword: 'NewPassword123',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(WrongCredentialsError)
    expect(fakeHashGenerator.hash).not.toHaveBeenCalled()
    expect(inMemoryUsersRepository.items[0].password).toBe(
      'hashed-old-password',
    )
  })

  it('should not be able to change another user password', async () => {
    const user = makeUser({
      password: 'hashed-old-password',
    })

    const anotherUser = makeUser()

    inMemoryUsersRepository.items.push(user)
    inMemoryUsersRepository.items.push(anotherUser)

    const result = await sut.execute({
      userId: user.id.toValue(),
      executorId: anotherUser.id.toValue(),
      oldPassword: 'old-password',
      newPassword: 'NewPassword123',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(fakeHashComparer.compare).not.toHaveBeenCalled()
    expect(fakeHashGenerator.hash).not.toHaveBeenCalled()
  })

  it('should not be able to change password for non-existing user', async () => {
    const result = await sut.execute({
      userId: 'non-existing-id',
      executorId: 'non-existing-id',
      oldPassword: 'old-password',
      newPassword: 'NewPassword123',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not allow changing the password of a system user', async () => {
    const systemUser = makeUser({
      email: 'sistema@ifal-arapiraca.edu.br',
      password: 'hashed-system-password',
      role: UserRole.SYSTEM,
      isActive: false,
    })

    inMemoryUsersRepository.items.push(systemUser)

    const result = await sut.execute({
      userId: systemUser.id.toValue(),
      executorId: systemUser.id.toValue(),
      oldPassword: 'old-password',
      newPassword: 'NewPassword123',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(fakeHashComparer.compare).not.toHaveBeenCalled()
    expect(fakeHashGenerator.hash).not.toHaveBeenCalled()
  })
})
