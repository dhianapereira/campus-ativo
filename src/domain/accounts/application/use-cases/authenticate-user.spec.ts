import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { FakeEncrypter } from 'test/cryptography/fake-encrypter'
import { AuthenticateUserUseCase } from './authenticate-user'
import { makeUser } from 'test/factories/make-user'
import { UserRole } from '../../enterprise/entities/user'

let inMemoryUsersRepository: InMemoryUsersRepository
let fakeHasher: FakeHasher
let fakeEncrypter: FakeEncrypter
let sut: AuthenticateUserUseCase

describe('Authenticate User', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    fakeHasher = new FakeHasher()
    fakeEncrypter = new FakeEncrypter()
    sut = new AuthenticateUserUseCase(
      inMemoryUsersRepository,
      fakeHasher,
      fakeEncrypter,
    )
  })

  it('should be able to authenticate a user', async () => {
    const user = makeUser({
      email: 'johndoe@example.com',
      password: await fakeHasher.hash('123456'),
      role: UserRole.REPORTER,
      isActive: true,
    })

    await inMemoryUsersRepository.create(user)

    const result = await sut.execute({
      email: 'johndoe@example.com',
      password: '123456',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      accessToken: expect.any(String),
    })
  })

  it('should not be able to authenticate with wrong email', async () => {
    const result = await sut.execute({
      email: 'johndoe@example.com',
      password: '123456',
    })

    expect(result.isLeft()).toBe(true)
  })

  it('should not be able to authenticate with wrong password', async () => {
    const user = makeUser({
      email: 'johndoe@example.com',
      password: await fakeHasher.hash('123456'),
    })

    await inMemoryUsersRepository.create(user)

    const result = await sut.execute({
      email: 'johndoe@example.com',
      password: 'wrong-password',
    })

    expect(result.isLeft()).toBe(true)
  })

  it('should not be able to authenticate an inactive user', async () => {
    const user = makeUser({
      email: 'johndoe@example.com',
      password: await fakeHasher.hash('123456'),
      isActive: false,
    })

    await inMemoryUsersRepository.create(user)

    const result = await sut.execute({
      email: 'johndoe@example.com',
      password: '123456',
    })

    expect(result.isLeft()).toBe(true)
  })

  it('should not be able to authenticate a system user', async () => {
    const user = makeUser({
      email: 'sistema@ifal-arapiraca.edu.br',
      password: await fakeHasher.hash('123456'),
      isActive: true,
      role: UserRole.SYSTEM,
    })

    await inMemoryUsersRepository.create(user)

    const result = await sut.execute({
      email: 'sistema@ifal-arapiraca.edu.br',
      password: '123456',
    })

    expect(result.isLeft()).toBe(true)
  })
})
