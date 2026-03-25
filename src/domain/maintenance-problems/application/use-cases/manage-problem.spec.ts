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
import { HistoryChangeField } from '../../enterprise/entities/problems/problem-history'
import { ProblemHistory } from '../../enterprise/entities/problems/problem-history'

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
    expect(inMemoryProblemHistoryRepository.items[0].changes).toEqual([
      {
        field: HistoryChangeField.STATUS,
        oldValue: ProblemStatus.TO_ANALYSIS,
        newValue: ProblemStatus.IN_ANALYSIS,
      },
    ])
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
    expect(inMemoryProblemHistoryRepository.items[0].changes).toEqual([
      {
        field: HistoryChangeField.MAINTENANCE_TYPE,
        oldValue: null,
        newValue: MaintenanceType.CORRECTIVE,
      },
    ])
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
    expect(inMemoryProblemHistoryRepository.items[0].changes).toEqual([
      {
        field: HistoryChangeField.NOTE,
        oldValue: null,
        newValue: 'This problem needs urgent attention',
      },
    ])
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
      maintenanceType: MaintenanceType.PREVENTIVE,
      note: 'Updated all fields',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryProblemsRepository.items[0].status).toBe(
      ProblemStatus.ACCEPTED,
    )
    expect(inMemoryProblemsRepository.items[0].maintenanceType).toBe(
      MaintenanceType.PREVENTIVE,
    )
    expect(inMemoryProblemHistoryRepository.items).toHaveLength(1)
    expect(inMemoryProblemHistoryRepository.items[0].action).toBe(
      HistoryAction.UPDATED,
    )
    expect(inMemoryProblemHistoryRepository.items[0].note).toBe(
      'Updated all fields',
    )
    expect(inMemoryProblemHistoryRepository.items[0].changes).toEqual([
      {
        field: HistoryChangeField.STATUS,
        oldValue: ProblemStatus.TO_ANALYSIS,
        newValue: ProblemStatus.ACCEPTED,
      },
      {
        field: HistoryChangeField.MAINTENANCE_TYPE,
        oldValue: null,
        newValue: MaintenanceType.PREVENTIVE,
      },
      {
        field: HistoryChangeField.NOTE,
        oldValue: null,
        newValue: 'Updated all fields',
      },
    ])
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

  it('should allow clearing the latest note', async () => {
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

    await inMemoryProblemHistoryRepository.create(
      ProblemHistory.create(
        {
          problemId: problem.id,
          action: HistoryAction.NOTE_ADDED,
          userId: manager.id,
          userName: manager.name,
          note: 'Previous note',
          changes: [
            {
              field: HistoryChangeField.NOTE,
              oldValue: null,
              newValue: 'Previous note',
            },
          ],
        },
        new UniqueEntityID('history-1'),
      ),
    )

    const result = await sut.execute({
      problemId: problem.id.toValue(),
      executorId: manager.id.toValue(),
      executorRole: UserRole.MANAGER,
      note: '   ',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryProblemHistoryRepository.items).toHaveLength(2)
    expect(inMemoryProblemHistoryRepository.items[1].action).toBe(
      HistoryAction.UPDATED,
    )
    expect(inMemoryProblemHistoryRepository.items[1].note).toBeNull()
    expect(inMemoryProblemHistoryRepository.items[1].changes).toEqual([
      {
        field: HistoryChangeField.NOTE,
        oldValue: 'Previous note',
        newValue: null,
      },
    ])
  })
})
