import { RegisterReporterUseCase } from './register-reporter'
import { InMemoryReportersRepository } from 'test/repositories/in-memory-reporters-repository'
import { FakeHasher } from 'test/cryptography/fake-hasher'

let inMemoryReportersRepository: InMemoryReportersRepository
let fakeHasher: FakeHasher

let sut: RegisterReporterUseCase

describe('Register Reporter', () => {
  beforeEach(() => {
    inMemoryReportersRepository = new InMemoryReportersRepository()
    fakeHasher = new FakeHasher()

    sut = new RegisterReporterUseCase(inMemoryReportersRepository, fakeHasher)
  })

  it('should be able to register a new reporter', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      position: 'Director',
      email: 'johndoe@example.com',
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
      email: 'johndoe@example.com',
      password: '123456',
    })

    const hashedPassword = await fakeHasher.hash('123456')

    expect(result.isRight()).toBe(true)
    expect(inMemoryReportersRepository.items[0].password).toEqual(
      hashedPassword,
    )
  })
})
