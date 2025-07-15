import { Test, TestingModule } from '@nestjs/testing'
import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ResourceOwnerGuard } from './resource-owner.guard'
import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository'
import { ProblemsRepository } from '@/domain/maintenance-problems/application/repositories/problems-repository'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { makeUser } from 'test/factories/make-user-factory'
import { makeProblem } from 'test/factories/make-problem'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

describe('ResourceOwnerGuard', () => {
  let guard: ResourceOwnerGuard
  let reflector: Reflector
  let usersRepository: UsersRepository
  let problemsRepository: ProblemsRepository

  beforeEach(async () => {
    const mockUsersRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    }

    const mockProblemsRepository = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourceOwnerGuard,
        Reflector,
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: ProblemsRepository, useValue: mockProblemsRepository },
      ],
    }).compile()

    guard = module.get<ResourceOwnerGuard>(ResourceOwnerGuard)
    reflector = module.get<Reflector>(Reflector)
    usersRepository = module.get<UsersRepository>(UsersRepository)
    problemsRepository = module.get<ProblemsRepository>(ProblemsRepository)
  })

  it('should allow access when no resource type is specified', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null)

    const context = createMockExecutionContext({ sub: 'user-1' }, { id: 'problem-1' })
    const result = await guard.canActivate(context)

    expect(result).toBe(true)
  })

  it('should allow access when user is manager or higher', async () => {
    const user = makeUser({ role: UserRole.MANAGER })
    
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue('problem')
    vi.spyOn(usersRepository, 'findById').mockResolvedValue(user)

    const context = createMockExecutionContext({ sub: 'user-1' }, { id: 'problem-1' })
    const result = await guard.canActivate(context)

    expect(result).toBe(true)
  })

  it('should allow access when reporter owns the resource', async () => {
    const userId = new UniqueEntityID('user-1')
    const user = makeUser({ role: UserRole.REPORTER }, userId)
    const problem = makeProblem({ reporterId: userId })
    
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue('problem')
    vi.spyOn(usersRepository, 'findById').mockResolvedValue(user)
    vi.spyOn(problemsRepository, 'findById').mockResolvedValue(problem)

    const context = createMockExecutionContext({ sub: 'user-1' }, { id: 'problem-1' })
    const result = await guard.canActivate(context)

    expect(result).toBe(true)
  })

  it('should deny access when reporter does not own the resource', async () => {
    const userId = new UniqueEntityID('user-1')
    const otherUserId = new UniqueEntityID('user-2')
    const user = makeUser({ role: UserRole.REPORTER }, userId)
    const problem = makeProblem({ reporterId: otherUserId })
    
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue('problem')
    vi.spyOn(usersRepository, 'findById').mockResolvedValue(user)
    vi.spyOn(problemsRepository, 'findById').mockResolvedValue(problem)

    const context = createMockExecutionContext({ sub: 'user-1' }, { id: 'problem-1' })

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException)
  })

  it('should deny access when problem is not found', async () => {
    const user = makeUser({ role: UserRole.REPORTER })
    
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue('problem')
    vi.spyOn(usersRepository, 'findById').mockResolvedValue(user)
    vi.spyOn(problemsRepository, 'findById').mockResolvedValue(null)

    const context = createMockExecutionContext({ sub: 'user-1' }, { id: 'problem-1' })

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException)
  })

  it('should deny access when user is not found', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue('problem')
    vi.spyOn(usersRepository, 'findById').mockResolvedValue(null)

    const context = createMockExecutionContext({ sub: 'user-1' }, { id: 'problem-1' })

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException)
  })

  function createMockExecutionContext(user: any, params: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext
  }
})