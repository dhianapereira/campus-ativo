import { User } from "../../enterprise/entities/user";
import { UserSummary } from "../../enterprise/entities/user-summary";

export abstract class UsersRepository {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
  abstract findByIdForListing(id: string): Promise<UserSummary | null>;
  abstract create(user: User): Promise<void>;
  abstract save(user: User): Promise<void>;
  abstract findMany(): Promise<User[]>;
  abstract findManyForListing(): Promise<UserSummary[]>;
}
