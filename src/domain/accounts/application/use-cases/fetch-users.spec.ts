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

  it('should be able to fetch all users when current user is ADMIN', async () => {
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

    const admin = makeUser({
      name: 'Admin User',
      role: UserRole.ADMIN,
    })

    inMemoryUsersRepository.items.push(user1, user2, user3, admin)

    const result = await sut.execute({ currentUserRole: UserRole.ADMIN })

    expect(result.isRight()).toBe(true)
    expect(result.value?.users).toHaveLength(4)
    // Users are now sorted alphabetically by name (all active)
    expect(result.value?.users).toEqual([
      expect.objectContaining({ name: 'Admin User', role: UserRole.ADMIN }),
      expect.objectContaining({ name: 'Bob Smith', role: UserRole.DIRECTOR }),
      expect.objectContaining({ name: 'Jane Doe', role: UserRole.MANAGER }),
      expect.objectContaining({ name: 'John Doe', role: UserRole.REPORTER }),
    ])
  })

  it('should filter out ADMIN users when current user is DIRECTOR', async () => {
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

    const admin = makeUser({
      name: 'Admin User',
      role: UserRole.ADMIN,
    })

    inMemoryUsersRepository.items.push(user1, user2, user3, admin)

    const result = await sut.execute({ currentUserRole: UserRole.DIRECTOR })

    expect(result.isRight()).toBe(true)
    expect(result.value?.users).toHaveLength(3)
    // Users are now sorted alphabetically by name
    expect(result.value?.users).toEqual([
      expect.objectContaining({ name: 'Bob Smith', role: UserRole.DIRECTOR }),
      expect.objectContaining({ name: 'Jane Doe', role: UserRole.MANAGER }),
      expect.objectContaining({ name: 'John Doe', role: UserRole.REPORTER }),
    ])
    expect(result.value?.users).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: UserRole.ADMIN }),
      ]),
    )
  })

  it('should filter out ADMIN users when current user is MANAGER', async () => {
    const user1 = makeUser({
      name: 'John Doe',
      role: UserRole.REPORTER,
    })

    const admin = makeUser({
      name: 'Admin User',
      role: UserRole.ADMIN,
    })

    inMemoryUsersRepository.items.push(user1, admin)

    const result = await sut.execute({ currentUserRole: UserRole.MANAGER })

    expect(result.isRight()).toBe(true)
    expect(result.value?.users).toHaveLength(1)
    expect(result.value?.users).toEqual([
      expect.objectContaining({ name: 'John Doe', role: UserRole.REPORTER }),
    ])
  })

  it('should return empty array when no users exist', async () => {
    const result = await sut.execute({ currentUserRole: UserRole.DIRECTOR })

    expect(result.isRight()).toBe(true)
    expect(result.value?.users).toHaveLength(0)
  })

  it('should ensure passwords are not included in listing results', async () => {
    const user1 = makeUser({
      name: 'John Doe',
      role: UserRole.REPORTER,
      password: 'secret-password',
    })

    inMemoryUsersRepository.items.push(user1)

    const result = await sut.execute({ currentUserRole: UserRole.ADMIN })

    expect(result.isRight()).toBe(true)
    expect(result.value?.users).toHaveLength(1)
    // UserSummary doesn't have a password property at all - which is secure
    expect(result.value?.users[0]).not.toHaveProperty('password')
  })

  it('should not include system users in listings', async () => {
    const reporter = makeUser({
      name: 'Reporter User',
      role: UserRole.REPORTER,
    })

    const systemUser = makeUser({
      name: 'Sistema IFAL Arapiraca',
      email: 'sistema@ifal-arapiraca.edu.br',
      role: UserRole.SYSTEM,
      isActive: false,
    })

    inMemoryUsersRepository.items.push(reporter, systemUser)

    const result = await sut.execute({ currentUserRole: UserRole.ADMIN })

    expect(result.isRight()).toBe(true)
    expect(result.value?.users).toHaveLength(1)
    expect(result.value?.users[0].name).toBe('Reporter User')
  })

  it('should filter users by isActive', async () => {
    const activeUser = makeUser({
      name: 'Active User',
      role: UserRole.REPORTER,
      isActive: true,
    })

    const inactiveUser = makeUser({
      name: 'Inactive User',
      role: UserRole.REPORTER,
      isActive: false,
    })

    inMemoryUsersRepository.items.push(activeUser, inactiveUser)

    const resultActive = await sut.execute({
      currentUserRole: UserRole.ADMIN,
      isActive: true,
    })

    expect(resultActive.isRight()).toBe(true)
    expect(resultActive.value?.users).toHaveLength(1)
    expect(resultActive.value?.users[0].name).toBe('Active User')

    const resultInactive = await sut.execute({
      currentUserRole: UserRole.ADMIN,
      isActive: false,
    })

    expect(resultInactive.isRight()).toBe(true)
    expect(resultInactive.value?.users).toHaveLength(1)
    expect(resultInactive.value?.users[0].name).toBe('Inactive User')
  })

  it('should filter users by query in name', async () => {
    const user1 = makeUser({
      name: 'John Smith',
      email: 'john@example.com',
      role: UserRole.REPORTER,
    })

    const user2 = makeUser({
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: UserRole.REPORTER,
    })

    const user3 = makeUser({
      name: 'John Doe',
      email: 'johndoe@example.com',
      role: UserRole.REPORTER,
    })

    inMemoryUsersRepository.items.push(user1, user2, user3)

    const result = await sut.execute({
      currentUserRole: UserRole.ADMIN,
      query: 'john',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.users).toHaveLength(2)
    expect(result.value?.users).toEqual([
      expect.objectContaining({ name: 'John Doe' }),
      expect.objectContaining({ name: 'John Smith' }),
    ])
  })

  it('should filter users by query in email', async () => {
    const user1 = makeUser({
      name: 'Alice',
      email: 'alice@company.com',
      role: UserRole.REPORTER,
    })

    const user2 = makeUser({
      name: 'Bob',
      email: 'bob@example.com',
      role: UserRole.REPORTER,
    })

    inMemoryUsersRepository.items.push(user1, user2)

    const result = await sut.execute({
      currentUserRole: UserRole.ADMIN,
      query: 'company',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.users).toHaveLength(1)
    expect(result.value?.users[0].name).toBe('Alice')
  })

  it('should sort active users before inactive users', async () => {
    const inactiveUser1 = makeUser({
      name: 'Alice',
      role: UserRole.REPORTER,
      isActive: false,
    })

    const activeUser1 = makeUser({
      name: 'Bob',
      role: UserRole.REPORTER,
      isActive: true,
    })

    const activeUser2 = makeUser({
      name: 'Charlie',
      role: UserRole.REPORTER,
      isActive: true,
    })

    const inactiveUser2 = makeUser({
      name: 'David',
      role: UserRole.REPORTER,
      isActive: false,
    })

    inMemoryUsersRepository.items.push(
      inactiveUser1,
      activeUser1,
      activeUser2,
      inactiveUser2,
    )

    const result = await sut.execute({ currentUserRole: UserRole.ADMIN })

    expect(result.isRight()).toBe(true)
    expect(result.value?.users).toHaveLength(4)
    // Active users come first (Bob, Charlie), then inactive users (Alice, David)
    expect(result.value?.users[0].name).toBe('Bob')
    expect(result.value?.users[0].isActive).toBe(true)
    expect(result.value?.users[1].name).toBe('Charlie')
    expect(result.value?.users[1].isActive).toBe(true)
    expect(result.value?.users[2].name).toBe('Alice')
    expect(result.value?.users[2].isActive).toBe(false)
    expect(result.value?.users[3].name).toBe('David')
    expect(result.value?.users[3].isActive).toBe(false)
  })

  it('should combine multiple filters', async () => {
    const activeUser1 = makeUser({
      name: 'John Active',
      email: 'john@example.com',
      role: UserRole.REPORTER,
      isActive: true,
    })

    const inactiveUser = makeUser({
      name: 'John Inactive',
      email: 'johni@example.com',
      role: UserRole.REPORTER,
      isActive: false,
    })

    const activeUser2 = makeUser({
      name: 'Jane Active',
      email: 'jane@example.com',
      role: UserRole.REPORTER,
      isActive: true,
    })

    inMemoryUsersRepository.items.push(activeUser1, inactiveUser, activeUser2)

    const result = await sut.execute({
      currentUserRole: UserRole.ADMIN,
      query: 'john',
      isActive: true,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.users).toHaveLength(1)
    expect(result.value?.users[0].name).toBe('John Active')
  })
})
