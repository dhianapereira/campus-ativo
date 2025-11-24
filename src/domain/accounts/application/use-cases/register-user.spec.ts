import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { RegisterUserUseCase } from './register-user'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'
import { InvalidEmailDomainError } from './errors/invalid-email-domain-error'
import { InvalidPasswordError } from './errors/invalid-password-error'
import { makeUser } from 'test/factories/make-user'
import { UserRole } from '../../enterprise/entities/user'

let inMemoryUsersRepository: InMemoryUsersRepository
let fakeHasher: FakeHasher
let sut: RegisterUserUseCase

describe('Register User', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    fakeHasher = new FakeHasher()
    sut = new RegisterUserUseCase(inMemoryUsersRepository, fakeHasher)
  })

  it('should be able to register a new user', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      position: 'Developer',
      email: 'johndoe@ifal.edu.br',
      password: 'Senha@123',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      user: inMemoryUsersRepository.items[0],
    })
  })

  it('should create user with inactive status by default', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      position: 'Developer',
      email: 'johndoe@ifal.edu.br',
      password: 'Senha@123',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.isActive).toBe(false)
    }
  })

  it('should create user with REPORTER role by default', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      position: 'Developer',
      email: 'johndoe@ifal.edu.br',
      password: 'Senha@123',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.role).toBe(UserRole.REPORTER)
    }
  })

  it('should hash user password upon registration', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      position: 'Developer',
      email: 'johndoe@ifal.edu.br',
      password: 'Senha@123',
    })

    const hashedPassword = await fakeHasher.hash('Senha@123')

    expect(result.isRight()).toBe(true)
    expect(inMemoryUsersRepository.items[0].password).toBe(hashedPassword)
  })

  it('should not be able to register with same email twice', async () => {
    const email = 'johndoe@ifal.edu.br'

    const user = makeUser({
      email,
    })

    await inMemoryUsersRepository.create(user)

    const result = await sut.execute({
      name: 'John Doe',
      position: 'Developer',
      email,
      password: 'Senha@123',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserAlreadyExistsError)
  })

  it('should not be able to register with invalid email domain', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      position: 'Developer',
      email: 'johndoe@gmail.com',
      password: 'Senha@123',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidEmailDomainError)
  })

  it('should not be able to register with invalid password', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      position: 'Developer',
      email: 'johndoe@ifal.edu.br',
      password: '123', // Too short
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidPasswordError)
  })

  it('should be able to register with specific role', async () => {
    const result = await sut.execute({
      name: 'John Manager',
      position: 'Manager',
      email: 'manager@ifal.edu.br',
      password: 'Senha@123',
      role: UserRole.MANAGER,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.role).toBe(UserRole.MANAGER)
      expect(result.value.user.isActive).toBe(false)
    }
  })
})
