import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UsersRepository } from '../repositories/users-repository'
import { UserRole } from '../../enterprise/entities/user'
import { UserSummary } from '../../enterprise/entities/user-summary'

interface FetchUsersUseCaseRequest {
  currentUserRole: UserRole
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

  async execute({ currentUserRole }: FetchUsersUseCaseRequest): Promise<FetchUsersUseCaseResponse> {
    const users = await this.usersRepository.findManyForListing()

    // Filter users based on current user role
    const filteredUsers = users.filter(user => {
      // ADMIN can see all users
      if (currentUserRole === UserRole.ADMIN) {
        return true
      }
      
      // DIRECTOR and below cannot see ADMIN users
      return user.role !== UserRole.ADMIN
    })

    return right({
      users: filteredUsers,
    })
  }
}