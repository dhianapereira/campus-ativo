import { User } from '../../enterprise/entities/user'
import { UserSummary } from '../../enterprise/entities/user-summary'

export interface FetchUsersParams {
  query?: string
  isActive?: boolean
}

export abstract class UsersRepository {
  abstract findByEmail(email: string): Promise<User | null>
  abstract findById(id: string): Promise<User | null>
  abstract findSystemUser(): Promise<User | null>
  abstract findManyByIds(ids: string[]): Promise<User[]>
  abstract findByIdForListing(id: string): Promise<UserSummary | null>
  abstract create(user: User): Promise<void>
  abstract save(user: User): Promise<void>
  abstract delete(user: User): Promise<void>
  abstract findMany(params?: FetchUsersParams): Promise<User[]>
  abstract findManyForListing(params?: FetchUsersParams): Promise<UserSummary[]>
}
