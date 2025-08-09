import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UsersRepository } from '../repositories/users-repository'
import { User } from '../../enterprise/entities/user'

type FetchUsersUseCaseResponse = Either<
  null,
  {
    users: User[]
  }
>

@Injectable()
export class FetchUsersUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute(): Promise<FetchUsersUseCaseResponse> {
    const users = await this.usersRepository.findMany()

    return right({
      users,
    })
  }
}