import { RegisterReporterUseCase } from './register-reporter'
import { InMemoryReportersRepository } from 'test/repositories/in-memory-reporters-repository'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { InvalidEmailDomainError } from './errors/invalid-email-domain-error'

let inMemoryReportersRepository: InMemoryReportersRepository
let fakeHasher: FakeHasher

let sut: RegisterReporterUseCase

describe('Register Reporter', () => {
  beforeEach(() => {
    inMemoryReportersRepository = new InMemoryReportersRepository()
    fakeHasher = new FakeHasher()

    sut = new RegisterReporterUseCase(inMemoryReportersRepository, fakeHasher)
  })

  it('should be able to register a new reporter with valid IFAL email', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      position: 'Director',
      email: 'johndoe@ifal.edu.br',
      password: '123456',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      reporter: inMemoryReportersRepository.items[0],
    })
  })

  it('should hash reporter password upon registration', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      position: 'Director',
      email: 'johndoe@aluno.ifal.edu.br',
      password: '123456',
    })

    const hashedPassword = await fakeHasher.hash('123456')

    expect(result.isRight()).toBe(true)
    expect(inMemoryReportersRepository.items[0].password).toEqual(
      hashedPassword,
    )
  })

  it('should not be able to register a reporter with invalid email domain', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      position: 'Director',
      email: 'johndoe@gmail.com',
      password: '123456',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidEmailDomainError)
  })

  it('should accept both @ifal.edu.br and @aluno.ifal.edu.br domains', async () => {
    const resultIfal = await sut.execute({
      name: 'John Doe',
      position: 'Director',
      email: 'johndoe@ifal.edu.br',
      password: '123456',
    })

    const resultAluno = await sut.execute({
      name: 'Jane Doe',
      position: 'Student',
      email: 'janedoe@aluno.ifal.edu.br',
      password: '123456',
    })

    expect(resultIfal.isRight()).toBe(true)
    expect(resultAluno.isRight()).toBe(true)
  })
})
