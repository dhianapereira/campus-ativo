import { ManageProblemUseCase } from './manage-problem'
import { InMemoryProblemsRepository } from 'test/repositories/in-memory-problems-repository'
import { makeProblem } from 'test/factories/make-problem'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { InMemoryProblemAttachmentsRepository } from 'test/repositories/in-memory-problem-attachments-repository'
import {
  ProblemStatus,
  MaintenanceType,
} from '../../enterprise/entities/problems/problem'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { InMemoryProblemHistoryRepository } from 'test/repositories/in-memory-problem-history-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { makeUser } from 'test/factories/make-user'
import { HistoryAction } from '../../enterprise/entities/problems/problem-history'

let inMemoryProblemsRepository: InMemoryProblemsRepository
let inMemoryProblemAttachmentsRepository: InMemoryProblemAttachmentsRepository
let inMemoryProblemHistoryRepository: InMemoryProblemHistoryRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let sut: ManageProblemUseCase

describe('Manage Problem', () => {
  beforeEach(() => {
    inMemoryProblemAttachmentsRepository =
      new InMemoryProblemAttachmentsRepository()
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      inMemoryProblemAttachmentsRepository,
    )
    inMemoryProblemHistoryRepository = new InMemoryProblemHistoryRepository()
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new ManageProblemUseCase(
      inMemoryProblemsRepository,
      inMemoryProblemHistoryRepository,
      inMemoryUsersRepository,
    )
  })

  it('should allow MANAGER to change problem status', async () => {
    const manager = makeUser(
      {
        role: UserRole.MANAGER,
        name: 'John Manager',
      },
      new UniqueEntityID('manager-1'),
    )
    await inMemoryUsersRepository.create(manager)

    const problem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.TO_ANALYSIS,
      },
      new UniqueEntityID('problem-1'),
    )
    await inMemoryProblemsRepository.create(problem)

    const result = await sut.execute({
      problemId: problem.id.toValue(),
      executorId: manager.id.toValue(),
      executorRole: UserRole.MANAGER,
      status: ProblemStatus.IN_ANALYSIS,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryProblemsRepository.items[0].status).toBe(
      ProblemStatus.IN_ANALYSIS,
    )
    expect(inMemoryProblemHistoryRepository.items).toHaveLength(1)
    expect(inMemoryProblemHistoryRepository.items[0].action).toBe(
      HistoryAction.STATUS_CHANGED,
    )
    expect(inMemoryProblemHistoryRepository.items[0].oldValue).toBe(
      ProblemStatus.TO_ANALYSIS,
    )
    expect(inMemoryProblemHistoryRepository.items[0].newValue).toBe(
      ProblemStatus.IN_ANALYSIS,
    )
  })

  it('should allow DIRECTOR to change problem category', async () => {
    const director = makeUser(
      {
        role: UserRole.DIRECTOR,
        name: 'Jane Director',
      },
      new UniqueEntityID('director-1'),
    )
    await inMemoryUsersRepository.create(director)

    const problem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        categoryId: new UniqueEntityID('category-1'),
      },
      new UniqueEntityID('problem-1'),
    )
    await inMemoryProblemsRepository.create(problem)

    const result = await sut.execute({
      problemId: problem.id.toValue(),
      executorId: director.id.toValue(),
      executorRole: UserRole.DIRECTOR,
      categoryId: 'category-2',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryProblemsRepository.items[0].categoryId?.toValue()).toBe(
      'category-2',
    )
    expect(inMemoryProblemHistoryRepository.items).toHaveLength(1)
    expect(inMemoryProblemHistoryRepository.items[0].action).toBe(
      HistoryAction.CATEGORY_CHANGED,
    )
  })

  it('should allow ADMIN to change maintenance type', async () => {
    const admin = makeUser(
      {
        role: UserRole.ADMIN,
        name: 'Admin User',
      },
      new UniqueEntityID('admin-1'),
    )
    await inMemoryUsersRepository.create(admin)

    const problem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        maintenanceType: null,
      },
      new UniqueEntityID('problem-1'),
    )
    await inMemoryProblemsRepository.create(problem)

    const result = await sut.execute({
      problemId: problem.id.toValue(),
      executorId: admin.id.toValue(),
      executorRole: UserRole.ADMIN,
      maintenanceType: MaintenanceType.CORRECTIVE,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryProblemsRepository.items[0].maintenanceType).toBe(
      MaintenanceType.CORRECTIVE,
    )
    expect(inMemoryProblemHistoryRepository.items).toHaveLength(1)
    expect(inMemoryProblemHistoryRepository.items[0].action).toBe(
      HistoryAction.MAINTENANCE_TYPE_CHANGED,
    )
  })

  it('should allow MANAGER to add a note', async () => {
    const manager = makeUser(
      {
        role: UserRole.MANAGER,
        name: 'Manager User',
      },
      new UniqueEntityID('manager-1'),
    )
    await inMemoryUsersRepository.create(manager)

    const problem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
      },
      new UniqueEntityID('problem-1'),
    )
    await inMemoryProblemsRepository.create(problem)

    const result = await sut.execute({
      problemId: problem.id.toValue(),
      executorId: manager.id.toValue(),
      executorRole: UserRole.MANAGER,
      note: 'This problem needs urgent attention',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryProblemHistoryRepository.items).toHaveLength(1)
    expect(inMemoryProblemHistoryRepository.items[0].action).toBe(
      HistoryAction.NOTE_ADDED,
    )
    expect(inMemoryProblemHistoryRepository.items[0].note).toBe(
      'This problem needs urgent attention',
    )
  })

  it('should not allow REPORTER to manage problem', async () => {
    const reporter = makeUser(
      {
        role: UserRole.REPORTER,
      },
      new UniqueEntityID('reporter-1'),
    )
    await inMemoryUsersRepository.create(reporter)

    const problem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
      },
      new UniqueEntityID('problem-1'),
    )
    await inMemoryProblemsRepository.create(problem)

    const result = await sut.execute({
      problemId: problem.id.toValue(),
      executorId: reporter.id.toValue(),
      executorRole: UserRole.REPORTER,
      status: ProblemStatus.IN_ANALYSIS,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should allow changing multiple fields at once', async () => {
    const manager = makeUser(
      {
        role: UserRole.MANAGER,
        name: 'Manager User',
      },
      new UniqueEntityID('manager-1'),
    )
    await inMemoryUsersRepository.create(manager)

    const problem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.TO_ANALYSIS,
        categoryId: new UniqueEntityID('category-1'),
        maintenanceType: null,
      },
      new UniqueEntityID('problem-1'),
    )
    await inMemoryProblemsRepository.create(problem)

    const result = await sut.execute({
      problemId: problem.id.toValue(),
      executorId: manager.id.toValue(),
      executorRole: UserRole.MANAGER,
      status: ProblemStatus.ACCEPTED,
      categoryId: 'category-2',
      maintenanceType: MaintenanceType.PREVENTIVE,
      note: 'Updated all fields',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryProblemsRepository.items[0].status).toBe(
      ProblemStatus.ACCEPTED,
    )
    expect(inMemoryProblemsRepository.items[0].categoryId?.toValue()).toBe(
      'category-2',
    )
    expect(inMemoryProblemsRepository.items[0].maintenanceType).toBe(
      MaintenanceType.PREVENTIVE,
    )
    expect(inMemoryProblemHistoryRepository.items).toHaveLength(4)
  })

  it('should not create history if value did not change', async () => {
    const manager = makeUser(
      {
        role: UserRole.MANAGER,
      },
      new UniqueEntityID('manager-1'),
    )
    await inMemoryUsersRepository.create(manager)

    const problem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.IN_ANALYSIS,
      },
      new UniqueEntityID('problem-1'),
    )
    await inMemoryProblemsRepository.create(problem)

    const result = await sut.execute({
      problemId: problem.id.toValue(),
      executorId: manager.id.toValue(),
      executorRole: UserRole.MANAGER,
      status: ProblemStatus.IN_ANALYSIS,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryProblemHistoryRepository.items).toHaveLength(0)
  })

  it('should not create note history if note is empty', async () => {
    const manager = makeUser(
      {
        role: UserRole.MANAGER,
      },
      new UniqueEntityID('manager-1'),
    )
    await inMemoryUsersRepository.create(manager)

    const problem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
      },
      new UniqueEntityID('problem-1'),
    )
    await inMemoryProblemsRepository.create(problem)

    const result = await sut.execute({
      problemId: problem.id.toValue(),
      executorId: manager.id.toValue(),
      executorRole: UserRole.MANAGER,
      note: '   ',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryProblemHistoryRepository.items).toHaveLength(0)
  })
})
