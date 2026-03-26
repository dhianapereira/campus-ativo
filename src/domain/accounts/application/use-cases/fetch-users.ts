import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UsersRepository } from '../repositories/users-repository'
import { UserRole } from '../../enterprise/entities/user'
import { UserSummary } from '../../enterprise/entities/user-summary'

interface FetchUsersUseCaseRequest {
  currentUserRole: UserRole
  query?: string
  isActive?: boolean
}

type FetchUsersUseCaseResponse = Either<
  null,
  {
    users: UserSummary[]
  }
>

@Injectable()
export class FetchUsersUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    currentUserRole,
    query,
    isActive,
  }: FetchUsersUseCaseRequest): Promise<FetchUsersUseCaseResponse> {
    const users = await this.usersRepository.findManyForListing({
      query,
      isActive,
    })

    const filteredUsers = users.filter((user) => {
      if (currentUserRole === UserRole.ADMIN) {
        return true
      }

      return user.role !== UserRole.ADMIN
    })

    return right({
      users: filteredUsers,
    })
  }
}
