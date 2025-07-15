import { User } from '../../enterprise/entities/user'

export interface FindManyUsersParams {
  page: number
}

export abstract class UsersRepository {
  abstract findByEmail(email: string): Promise<User | null>
  abstract findById(id: string): Promise<User | null>
  abstract findMany(params: FindManyUsersParams): Promise<User[]>
  abstract create(user: User): Promise<void>
  abstract save(user: User): Promise<void>
}
