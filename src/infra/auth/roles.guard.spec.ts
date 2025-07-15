import { Test, TestingModule } from '@nestjs/testing'
import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RolesGuard } from './roles.guard'
import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { makeUser } from 'test/factories/make-user-factory'

describe('RolesGuard', () => {
  let guard: RolesGuard
  let reflector: Reflector
  let usersRepository: UsersRepository

  beforeEach(async () => {
    const mockUsersRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        Reflector,
        { provide: UsersRepository, useValue: mockUsersRepository },
      ],
    }).compile()

    guard = module.get<RolesGuard>(RolesGuard)
    reflector = module.get<Reflector>(Reflector)
    usersRepository = module.get<UsersRepository>(UsersRepository)
  })

  it('should allow access when no roles are required', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null)

    const context = createMockExecutionContext({ sub: 'user-1' })
    const result = await guard.canActivate(context)

    expect(result).toBe(true)
  })

  it('should allow access when user has required role', async () => {
    const user = makeUser({ role: UserRole.MANAGER })
    
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.MANAGER])
    vi.spyOn(usersRepository, 'findById').mockResolvedValue(user)

    const context = createMockExecutionContext({ sub: 'user-1' })
    const result = await guard.canActivate(context)

    expect(result).toBe(true)
  })

  it('should deny access when user does not have required role', async () => {
    const user = makeUser({ role: UserRole.REPORTER })
    
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.MANAGER])
    vi.spyOn(usersRepository, 'findById').mockResolvedValue(user)

    const context = createMockExecutionContext({ sub: 'user-1' })

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException)
  })

  it('should deny access when user is not found', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.MANAGER])
    vi.spyOn(usersRepository, 'findById').mockResolvedValue(null)

    const context = createMockExecutionContext({ sub: 'user-1' })

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException)
  })

  it('should deny access when no user in request', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.MANAGER])

    const context = createMockExecutionContext(null)

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException)
  })

  function createMockExecutionContext(user: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext
  }
})