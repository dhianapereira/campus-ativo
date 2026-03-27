import { makeUser } from 'test/factories/make-user'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { EditUserProfileUseCase } from './edit-user-profile'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { UserRole } from '../../enterprise/entities/user'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: EditUserProfileUseCase

describe('Edit User Profile', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new EditUserProfileUseCase(inMemoryUsersRepository)
  })

  it('should be able to edit own profile', async () => {
    const user = makeUser({
      name: 'John Doe',
      position: 'Developer',
    })

    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toValue(),
      executorId: user.id.toValue(),
      name: 'Jane Doe',
      position: 'Senior Developer',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.user.name).toBe('Jane Doe')
    expect(result.value?.user.position).toBe('Senior Developer')
    expect(inMemoryUsersRepository.items[0].name).toBe('Jane Doe')
    expect(inMemoryUsersRepository.items[0].position).toBe('Senior Developer')
  })

  it('should not be able to edit another user profile', async () => {
    const user = makeUser({
      name: 'John Doe',
      position: 'Developer',
    })

    const anotherUser = makeUser({
      name: 'Jane Smith',
      position: 'Manager',
    })

    inMemoryUsersRepository.items.push(user)
    inMemoryUsersRepository.items.push(anotherUser)

    const result = await sut.execute({
      userId: user.id.toValue(),
      executorId: anotherUser.id.toValue(),
      name: 'Hacker',
      position: 'Hacker',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryUsersRepository.items[0].name).toBe('John Doe')
  })

  it('should not be able to edit profile for non-existing user', async () => {
    const result = await sut.execute({
      userId: 'non-existing-id',
      executorId: 'non-existing-id',
      name: 'Jane Doe',
      position: 'Senior Developer',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not allow editing the profile of a system user', async () => {
    const systemUser = makeUser({
      name: 'Sistema IFAL Arapiraca',
      position: 'Usuário do Sistema',
      email: 'sistema@ifal-arapiraca.edu.br',
      role: UserRole.SYSTEM,
      isActive: false,
    })

    inMemoryUsersRepository.items.push(systemUser)

    const result = await sut.execute({
      userId: systemUser.id.toValue(),
      executorId: systemUser.id.toValue(),
      name: 'Outro nome',
      position: 'Outro cargo',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryUsersRepository.items[0].name).toBe('Sistema IFAL Arapiraca')
  })
})
