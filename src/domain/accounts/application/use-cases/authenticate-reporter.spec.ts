import { InMemoryReportersRepository } from 'test/repositories/in-memory-reporters-repository'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { FakeEncrypter } from 'test/cryptography/fake-encrypter'
import { AuthenticateReporterUseCase } from './authenticate-reporter'
import { makeReporter } from 'test/factories/make-reporter'

let inMemoryReportersRepository: InMemoryReportersRepository
let fakeHasher: FakeHasher
let encrypter: FakeEncrypter

let sut: AuthenticateReporterUseCase

describe('Authenticate Reporter', () => {
  beforeEach(() => {
    inMemoryReportersRepository = new InMemoryReportersRepository()
    fakeHasher = new FakeHasher()
    encrypter = new FakeEncrypter()

    sut = new AuthenticateReporterUseCase(
      inMemoryReportersRepository,
      fakeHasher,
      encrypter,
    )
  })

  it('should be able to authenticate a reporter', async () => {
    const reporter = makeReporter({
      email: 'johndoe@example.com',
      password: await fakeHasher.hash('123456'),
    })

    inMemoryReportersRepository.items.push(reporter)

    const result = await sut.execute({
      email: 'johndoe@example.com',
      password: '123456',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      accessToken: expect.any(String),
    })
  })
})
