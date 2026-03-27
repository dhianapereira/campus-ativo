import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UsersRepository } from '../repositories/users-repository'
import { UserRole } from '../../enterprise/entities/user'
import { UserSummary } from '../../enterprise/entities/user-summary'
import { PaginationParams } from '@/core/repositories/pagination-params'

interface FetchUsersUseCaseRequest extends PaginationParams {
  currentUserRole: UserRole
  query?: string
  isActive?: boolean
}

type FetchUsersUseCaseResponse = Either<
  null,
  {
    users: UserSummary[]
    total: number
  }
>

@Injectable()
export class FetchUsersUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    currentUserRole,
    page,
    pageSize,
    query,
    isActive,
  }: FetchUsersUseCaseRequest): Promise<FetchUsersUseCaseResponse> {
    const { items: users, total } =
      await this.usersRepository.findManyForListing({
        page,
        pageSize,
        query,
        isActive,
        includeAdmins: currentUserRole === UserRole.ADMIN,
      })

    return right({
      users,
      total,
    })
  }
}
